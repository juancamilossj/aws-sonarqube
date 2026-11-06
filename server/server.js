import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import authRouter from './routes/auth.js';
import { verifyToken, optionalToken } from './middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;

// Disable X-Powered-By header to avoid disclosing Express version (SonarCloud: S5689)
app.disable('x-powered-by');

// Restrict CORS to known origins to prevent cross-origin attacks (SonarCloud: S5122)
const ALLOWED_ORIGINS = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:3000', 'http://localhost:4000'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. same-origin, Postman, curl)
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: Origin '${origin}' not allowed`));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());

// Authentication routes (JWT)
app.use('/api/auth', authRouter);

const DB_PATH = path.join(__dirname, 'data', 'database.json');
const INITIAL_PATH = path.join(__dirname, 'data', 'initialNodes.json');

// Initial Student State
const INITIAL_STUDENT = {
  name: "Alex Thorne",
  id: "std-9821-neuro",
  cohort: "Cohorte Alfa 2026 - Bio-Computación",
  level: 4,
  title: "Arquitecto Sináptico Nivel 4",
  xp: 1450,
  nextLevelXp: 2000,
  streakDays: 12,
  completedChallenges: ["mat-algebra-lineal", "ia-redes-neuronales", "bio-neurobiologia-redes"]
};

let db = {
  nodes: [],
  student: { ...INITIAL_STUDENT }
};

// Load or initialize DB
function loadDatabase() {
  try {
    if (fs.existsSync(DB_PATH)) {
      const data = fs.readFileSync(DB_PATH, 'utf-8');
      db = JSON.parse(data);
    } else {
      const initial = fs.readFileSync(INITIAL_PATH, 'utf-8');
      db.nodes = JSON.parse(initial);
      db.student = { ...INITIAL_STUDENT };
      saveDatabase();
    }
  } catch (err) {
    console.error("Error reading database:", err);
    const initial = fs.readFileSync(INITIAL_PATH, 'utf-8');
    db.nodes = JSON.parse(initial);
    db.student = { ...INITIAL_STUDENT };
  }
}

function saveDatabase() {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error("Error saving database:", err);
  }
}

loadDatabase();

// Recalculate status of locked/unlocked nodes based on prerequisites
function recomputeNodeStatuses() {
  const completedSet = new Set(db.student.completedChallenges);

  db.nodes.forEach(node => {
    if (completedSet.has(node.id)) {
      node.status = 'mastered';
      node.masteryScore = 100;
      return;
    }

    if (!node.prerequisites || node.prerequisites.length === 0) {
      if (node.status === 'locked') {
        node.status = 'in_progress';
      }
      return;
    }

    // Check prerequisites
    const allMet = node.prerequisites.every(preId => completedSet.has(preId));
    if (allMet) {
      if (node.status === 'locked') {
        node.status = 'in_progress';
        if (node.masteryScore === 0) node.masteryScore = 25;
      }
    } else {
      node.status = 'locked';
      node.masteryScore = 0;
    }
  });
}

// Routes
// 1. Get all nodes & connections
app.get('/api/nodes', (req, res) => {
  recomputeNodeStatuses();
  res.json({
    nodes: db.nodes,
    clusters: Array.from(new Set(db.nodes.map(n => n.cluster)))
  });
});

// 2. Get single node
app.get('/api/nodes/:id', (req, res) => {
  const node = db.nodes.find(n => n.id === req.params.id);
  if (!node) return res.status(404).json({ error: "Nodo no encontrado en la red" });
  res.json(node);
});

// 3. Complete diagnostic challenge / activate node
app.post('/api/nodes/:id/complete', (req, res) => {
  const { id } = req.params;
  const node = db.nodes.find(n => n.id === id);

  if (!node) return res.status(404).json({ error: "Nodo no encontrado" });

  if (!db.student.completedChallenges.includes(id)) {
    db.student.completedChallenges.push(id);
    db.student.xp += node.xpReward || 150;

    // Check level up (every 500 XP)
    const newLevel = Math.floor(db.student.xp / 500) + 1;
    if (newLevel > db.student.level) {
      db.student.level = newLevel;
      const titles = [
        "Iniciado de Red",
        "Explorador de Sinapsis",
        "Navegante Cognitivo",
        "Arquitecto Sináptico Nivel 4",
        "Sintetizador Interdisciplinar",
        "Maestro del Conectoma Global"
      ];
      db.student.title = titles[Math.min(newLevel - 1, titles.length - 1)];
    }
    db.student.nextLevelXp = db.student.level * 500;
  }

  node.status = 'mastered';
  node.masteryScore = 100;

  // Reduce struggle in cohort when student succeeds
  if (node.cohortStats && node.cohortStats.studentsStruggling > 5) {
    node.cohortStats.studentsStruggling -= 1;
    node.cohortStats.averageScore = Math.min(98, node.cohortStats.averageScore + 1);
    if (node.cohortStats.studentsStruggling / node.cohortStats.totalStudents < 0.35) {
      node.cohortStats.isBottleneck = false;
    }
  }

  recomputeNodeStatuses();
  saveDatabase();

  res.json({
    success: true,
    message: `¡Neurona ${node.title} activada exitosamente!`,
    student: db.student,
    nodes: db.nodes
  });
});

// 4. Create new node (Teacher mode)
app.post('/api/nodes', (req, res) => {
  const { title, cluster, summary, level, prerequisites = [], xpReward = 150, clusterColor = '#00f2fe' } = req.body;
  if (!title || !cluster) {
    return res.status(400).json({ error: "Título y clúster son obligatorios" });
  }

  const id = `custom-${Date.now().toString(36)}`;
  const newNode = {
    id,
    title,
    cluster,
    clusterColor,
    level: level || "Intermedio",
    summary: summary || "Nueva competencia curricular agregada por el cuerpo docente.",
    status: prerequisites.length > 0 ? "locked" : "in_progress",
    masteryScore: 0,
    xpReward: Number(xpReward) || 150,
    synapses: [],
    prerequisites: prerequisites,
    interdisciplinaryBridges: [],
    cohortStats: {
      averageScore: 70,
      studentsStruggling: 20,
      totalStudents: 150,
      isBottleneck: false
    },
    quiz: [
      {
        question: `¿Cuál es el principio medular de ${title}?`,
        options: [
          "Integrar este concepto con las redes neuronales adyacentes",
          "Aislar la materia del resto de conocimientos",
          "Memorizar la definición sin aplicación práctica",
          "Descartar las evidencias empíricas"
        ],
        correctIndex: 0,
        explanation: "La comprensión holística requiere conectar el concepto a la matriz global."
      }
    ],
    resources: [
      { title: `Guía Docente: ${title}`, type: "Material Didáctico", duration: "10 min" }
    ],
    x: (Math.random() - 0.5) * 400,
    y: (Math.random() - 0.5) * 400,
    z: (Math.random() - 0.5) * 250
  };

  // Add synapse to source prerequisites
  prerequisites.forEach(preId => {
    const preNode = db.nodes.find(n => n.id === preId);
    if (preNode && !preNode.synapses.includes(id)) {
      preNode.synapses.push(id);
    }
  });

  db.nodes.push(newNode);
  recomputeNodeStatuses();
  saveDatabase();

  res.status(201).json({ success: true, node: newNode, nodes: db.nodes });
});

// 5. Connect two nodes with a synapse (Teacher mode)
app.post('/api/synapses', (req, res) => {
  const { sourceId, targetId, isInterdisciplinary = false, note = "" } = req.body;
  if (!sourceId || !targetId || sourceId === targetId) {
    return res.status(400).json({ error: "IDs de origen y destino válidos requeridos" });
  }

  const sourceNode = db.nodes.find(n => n.id === sourceId);
  const targetNode = db.nodes.find(n => n.id === targetId);

  if (!sourceNode || !targetNode) {
    return res.status(404).json({ error: "Uno o ambos nodos no existen" });
  }

  if (!sourceNode.synapses.includes(targetId)) {
    sourceNode.synapses.push(targetId);
  }

  if (isInterdisciplinary) {
    const existing = sourceNode.interdisciplinaryBridges.find(b => b.targetId === targetId);
    if (!existing) {
      sourceNode.interdisciplinaryBridges.push({
        targetId,
        description: note || `Puente interdisciplinar entre ${sourceNode.title} y ${targetNode.title}.`
      });
    }
  } else {
    if (!targetNode.prerequisites.includes(sourceId)) {
      targetNode.prerequisites.push(sourceId);
    }
  }

  recomputeNodeStatuses();
  saveDatabase();

  res.json({ success: true, message: "Sinapsis creada correctamente", nodes: db.nodes });
});

// 6. Delete a node (Teacher mode)
app.patch('/api/nodes/:id/position', (req, res) => {
  const { id } = req.params;
  const { x, y, z } = req.body;
  const node = db.nodes.find(n => n.id === id);
  if (!node) return res.status(404).json({ error: "Nodo no encontrado" });
  if (x !== undefined) node.x = x;
  if (y !== undefined) node.y = y;
  if (z !== undefined) node.z = z;
  saveDatabase();
  res.json({ success: true, node });
});

app.delete('/api/nodes/:id', (req, res) => {
  const { id } = req.params;
  db.nodes = db.nodes.filter(n => n.id !== id);

  // Remove references
  db.nodes.forEach(n => {
    n.synapses = n.synapses.filter(sid => sid !== id);
    n.prerequisites = n.prerequisites.filter(pid => pid !== id);
    n.interdisciplinaryBridges = n.interdisciplinaryBridges.filter(b => b.targetId !== id);
  });

  db.student.completedChallenges = db.student.completedChallenges.filter(cid => cid !== id);

  recomputeNodeStatuses();
  saveDatabase();

  res.json({ success: true, nodes: db.nodes });
});

// 7. Institutional Analytics (Teacher Telemetry)
app.get('/api/analytics', (req, res) => {
  const totalNodes = db.nodes.length;
  const masteredCount = db.nodes.filter(n => n.status === 'mastered').length;
  const inProgressCount = db.nodes.filter(n => n.status === 'in_progress').length;
  const lockedCount = db.nodes.filter(n => n.status === 'locked').length;

  // Bottlenecks
  const bottlenecks = db.nodes
    .filter(n => n.cohortStats && n.cohortStats.isBottleneck)
    .map(n => ({
      id: n.id,
      title: n.title,
      cluster: n.cluster,
      struggleRate: Math.round((n.cohortStats.studentsStruggling / n.cohortStats.totalStudents) * 100),
      studentsStruggling: n.cohortStats.studentsStruggling,
      totalStudents: n.cohortStats.totalStudents,
      averageScore: n.cohortStats.averageScore,
      prerequisites: n.prerequisites
    }));

  // Interdisciplinary bridges count
  let totalBridges = 0;
  db.nodes.forEach(n => {
    if (n.interdisciplinaryBridges) {
      totalBridges += n.interdisciplinaryBridges.length;
    }
  });

  const cohortAverage = Math.round(
    db.nodes.reduce((acc, curr) => acc + (curr.cohortStats?.averageScore || 70), 0) / (totalNodes || 1)
  );

  res.json({
    cohortAverage,
    totalNodes,
    masteredCount,
    inProgressCount,
    lockedCount,
    bottlenecks,
    totalBridges,
    totalCohortStudents: 150,
    meshHealth: cohortAverage >= 70 ? "Óptima" : "Atención Requerida en Nodos Críticos"
  });
});

// 8. Student profile
app.get('/api/student', (req, res) => {
  res.json(db.student);
});

// 9. Reset database
app.post('/api/reset', (req, res) => {
  const initial = fs.readFileSync(INITIAL_PATH, 'utf-8');
  db.nodes = JSON.parse(initial);
  db.student = { ...INITIAL_STUDENT };
  recomputeNodeStatuses();
  saveDatabase();
  res.json({ success: true, nodes: db.nodes, student: db.student });
});

// Static assets for production
const clientDist = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`[SynapseEdu Backend] Running on http://localhost:${PORT}`);
});
