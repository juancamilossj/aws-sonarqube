import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { JWT_SECRET, verifyToken } from '../middleware/auth.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const USERS_FILE = path.join(__dirname, '..', 'data', 'users.json');

// Helper to load users
function getUsers() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
    }
  } catch (e) {
    console.error('Error reading users file:', e);
  }
  return [];
}

// Helper to save users
function saveUsers(users) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving users file:', e);
  }
}

// 1. Login Endpoint
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Debes proporcionar correo electrónico y contraseña' });
  }

  const users = getUsers();
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());

  if (!user) {
    return res.status(401).json({ error: 'Credenciales inválidas: Usuario no registrado en el conectoma' });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).json({ error: 'Credenciales inválidas: Contraseña incorrecta' });
  }

  // Token payload
  const payload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    cohort: user.cohort,
    studentId: user.studentId,
    title: user.title,
    level: user.level,
    department: user.department
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

  res.json({
    success: true,
    message: `Autenticación exitosa. Bienvenido, ${user.name}`,
    token,
    user: payload
  });
});

// 2. Register Endpoint
router.post('/register', async (req, res) => {
  const { name, email, password, role = 'student', cohort } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Nombre, correo y contraseña son obligatorios' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe contener al menos 6 caracteres' });
  }

  const users = getUsers();
  const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
  if (existing) {
    return res.status(409).json({ error: 'Este correo ya se encuentra registrado en el sistema' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const userId = `usr-${Date.now().toString(36)}`;

  const newUser = {
    id: userId,
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password: hashedPassword,
    role: role === 'teacher' ? 'teacher' : 'student',
    cohort: cohort || (role === 'teacher' ? 'Cuerpo Docente Institucional' : 'Cohorte Beta 2026'),
    studentId: role === 'student' ? `std-${Math.floor(1000 + Math.random() * 9000)}-neuro` : undefined,
    title: role === 'teacher' ? 'Docente Investigador' : 'Iniciado de Red',
    level: 1,
    xp: 0,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  saveUsers(users);

  const payload = {
    id: newUser.id,
    name: newUser.name,
    email: newUser.email,
    role: newUser.role,
    cohort: newUser.cohort,
    studentId: newUser.studentId,
    title: newUser.title,
    level: newUser.level
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

  res.status(201).json({
    success: true,
    message: 'Usuario registrado e integrado al conectoma con éxito',
    token,
    user: payload
  });
});

// 3. Current User Profile (/me)
router.get('/me', verifyToken, (req, res) => {
  const users = getUsers();
  const user = users.find(u => u.id === req.user.id);

  if (!user) {
    return res.status(404).json({ error: 'Usuario no encontrado en la base de datos' });
  }

  const safeUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    cohort: user.cohort,
    studentId: user.studentId,
    title: user.title,
    level: user.level,
    xp: user.xp,
    department: user.department
  };

  res.json({
    success: true,
    user: safeUser
  });
});

// 4. Quick Demo Login (Student or Teacher)
router.post('/demo/:role', (req, res) => {
  const { role } = req.params;
  const users = getUsers();
  const user = users.find(u => u.role === (role === 'teacher' ? 'teacher' : 'student'));

  if (!user) {
    return res.status(404).json({ error: 'Cuenta demo no disponible' });
  }

  const payload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    cohort: user.cohort,
    studentId: user.studentId,
    title: user.title,
    level: user.level,
    department: user.department
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

  res.json({
    success: true,
    message: `Sesión demo iniciada como ${user.name} (${user.role === 'teacher' ? 'Docente' : 'Estudiante'})`,
    token,
    user: payload
  });
});

export default router;
