import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import NeuralCanvas from './components/NeuralCanvas';
import StudentProgressCard from './components/StudentProgressCard';
import TeacherPanel from './components/TeacherPanel';
import NodeDetailModal from './components/NodeDetailModal';
import CreateNodeModal from './components/CreateNodeModal';
import CreateSynapseModal from './components/CreateSynapseModal';
import ClusterLegend from './components/ClusterLegend';
import { neuralAudio } from './utils/AudioPlayer';
import { Brain, Sparkles, RefreshCw, AlertCircle } from 'lucide-react';

export default function App() {
  const [role, setRole] = useState('student'); // 'student' | 'teacher'
  const [nodes, setNodes] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [student, setStudent] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Selection
  const [activeCluster, setActiveCluster] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNode, setSelectedNode] = useState(null);

  // Modals
  const [isCreateNodeOpen, setIsCreateNodeOpen] = useState(false);
  const [isCreateSynapseOpen, setIsCreateSynapseOpen] = useState(false);

  // Toast Notification
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch all core data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [nodesRes, studentRes, analyticsRes] = await Promise.all([
        fetch('/api/nodes'),
        fetch('/api/student'),
        fetch('/api/analytics')
      ]);

      if (!nodesRes.ok || !studentRes.ok || !analyticsRes.ok) {
        throw new Error('Error al conectar con el servidor sináptico');
      }

      const nodesData = await nodesRes.json();
      const studentData = await studentRes.json();
      const analyticsData = await analyticsRes.json();

      setNodes(nodesData.nodes || []);
      setClusters(nodesData.clusters || []);
      setStudent(studentData);
      setAnalytics(analyticsData);
    } catch (err) {
      console.error(err);
      setError('No se pudo establecer conexión con el Conectoma. Asegúrate de que el servidor esté activo.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle selecting a node (with audio feedback)
  const handleSelectNode = (node) => {
    setSelectedNode(node);
    neuralAudio.playNodeSelect();
  };

  const handleSelectNodeById = (nodeId) => {
    const target = nodes.find(n => n.id === nodeId);
    if (target) {
      setSelectedNode(target);
      neuralAudio.playNodeSelect();
    }
  };

  // Complete diagnostic challenge on a node
  const handleCompleteNode = async (nodeId) => {
    try {
      const res = await fetch(`/api/nodes/${nodeId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.success) {
        setNodes(data.nodes);
        setStudent(data.student);

        // Update selected node state
        const updated = data.nodes.find(n => n.id === nodeId);
        if (updated) setSelectedNode(updated);

        // Refresh analytics
        const anRes = await fetch('/api/analytics');
        if (anRes.ok) setAnalytics(await anRes.json());

        showToast(`¡Neurona activada! +${updated?.xpReward || 150} Neuro-XP`, 'success');
      }
    } catch (err) {
      console.error(err);
      showToast('Error al transmitir la activación al servidor', 'error');
    }
  };

  // Create new node (Teacher action)
  const handleCreateNode = async (newNodeData) => {
    try {
      const res = await fetch('/api/nodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNodeData)
      });
      const data = await res.json();
      if (data.success) {
        setNodes(data.nodes);
        if (data.node) setSelectedNode(data.node);

        const anRes = await fetch('/api/analytics');
        if (anRes.ok) setAnalytics(await anRes.json());

        showToast(`Nueva neurona "${newNodeData.title}" integrada al conectoma`, 'success');
      }
    } catch (err) {
      console.error(err);
      showToast('Error al integrar la neurona', 'error');
    }
  };

  // Create synapse (Teacher action)
  const handleCreateSynapse = async (synapseData) => {
    try {
      const res = await fetch('/api/synapses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(synapseData)
      });
      const data = await res.json();
      if (data.success) {
        setNodes(data.nodes);

        const anRes = await fetch('/api/analytics');
        if (anRes.ok) setAnalytics(await anRes.json());

        showToast('Enlace sináptico materializado con éxito', 'success');
      }
    } catch (err) {
      console.error(err);
      showToast('Error al enlazar la sinapsis', 'error');
    }
  };

  // Update node position in state when dragged
  const handleNodePositionChange = (nodeId, x, y) => {
    setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, x, y } : n));
  };

  // Reset Network to initial state
  const handleResetNetwork = async () => {
    if (!window.confirm('¿Deseas restablecer la red neuronal a su estado base inicial?')) return;
    try {
      const res = await fetch('/api/reset', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setNodes(data.nodes);
        setStudent(data.student);
        setSelectedNode(null);

        const anRes = await fetch('/api/analytics');
        if (anRes.ok) setAnalytics(await anRes.json());

        neuralAudio.playLevelUp();
        showToast('Conectoma reiniciado a la configuración original', 'info');
      }
    } catch (err) {
      console.error(err);
      showToast('Error al restablecer la red', 'error');
    }
  };

  // Loading Screen
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#070913] text-cyan-400 select-none">
        <div className="relative flex items-center justify-center w-24 h-24 mb-6">
          <div className="absolute inset-0 rounded-full border-2 border-cyan-400/20 border-t-cyan-400 animate-spin" />
          <Brain className="w-10 h-10 text-cyan-300 animate-pulse" />
        </div>
        <h2 className="text-xl font-black tracking-widest uppercase font-['Orbitron'] bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
          Iniciando Conectoma Neural...
        </h2>
        <p className="text-xs text-slate-400 mt-2 font-mono">
          Sincronizando sinapsis y mapa cognitivo institucional
        </p>
      </div>
    );
  }

  // Error Screen
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#070913] text-slate-100 p-6 select-none">
        <div className="p-6 max-w-md bg-slate-950 border border-rose-500/40 rounded-3xl shadow-2xl text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
          <h3 className="text-lg font-bold text-slate-100 font-['Rajdhani']">
            Fallo de Enlace Sináptico
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            {error}
          </p>
          <button
            onClick={fetchData}
            className="px-6 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all"
          >
            Reconectar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden flex flex-col bg-[#070913]">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl border backdrop-blur-xl shadow-2xl flex items-center gap-2 text-xs font-mono font-bold animate-bounce ${
          toast.type === 'success' ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200' :
          toast.type === 'error' ? 'bg-rose-950/80 border-rose-500 text-rose-200' :
          'bg-cyan-950/80 border-cyan-500 text-cyan-200'
        }`}>
          <Sparkles className="w-3.5 h-3.5" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Main Futuristic Header */}
      <Header
        role={role}
        onRoleChange={setRole}
        clusters={clusters}
        activeCluster={activeCluster}
        onClusterChange={setActiveCluster}
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
        onResetNetwork={handleResetNetwork}
        onOpenCreateNode={() => setIsCreateNodeOpen(true)}
        onOpenCreateSynapse={() => setIsCreateSynapseOpen(true)}
      />

      {/* Main Interactive Neural Canvas */}
      <div className="relative flex-1 w-full h-full">
        <NeuralCanvas
          nodes={nodes}
          selectedNode={selectedNode}
          onSelectNode={handleSelectNode}
          role={role}
          highlightCluster={activeCluster}
          searchQuery={searchQuery}
          onNodePositionChange={handleNodePositionChange}
        />

        {/* Student Progress HUD (Student Mode) */}
        {role === 'student' && (
          <StudentProgressCard
            student={student}
            nodes={nodes}
          />
        )}

        {/* Teacher Institutional Telemetry (Teacher Mode) */}
        {role === 'teacher' && (
          <TeacherPanel
            analytics={analytics}
            onSelectNodeById={handleSelectNodeById}
            onOpenCreateNode={() => setIsCreateNodeOpen(true)}
            onOpenCreateSynapse={() => setIsCreateSynapseOpen(true)}
            nodes={nodes}
          />
        )}

        {/* Floating Cluster Legend & Filter Dock */}
        <ClusterLegend
          nodes={nodes}
          activeCluster={activeCluster}
          onSelectCluster={setActiveCluster}
        />
      </div>

      {/* Node Detail / Activation Challenge Modal */}
      {selectedNode && (
        <NodeDetailModal
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
          onCompleteNode={handleCompleteNode}
          allNodes={nodes}
          role={role}
          onSelectNodeById={handleSelectNodeById}
        />
      )}

      {/* Teacher: Create Node Modal */}
      <CreateNodeModal
        isOpen={isCreateNodeOpen}
        onClose={() => setIsCreateNodeOpen(false)}
        onCreateNode={handleCreateNode}
        existingNodes={nodes}
      />

      {/* Teacher: Create Synapse Modal */}
      <CreateSynapseModal
        isOpen={isCreateSynapseOpen}
        onClose={() => setIsCreateSynapseOpen(false)}
        onCreateSynapse={handleCreateSynapse}
        existingNodes={nodes}
      />
    </div>
  );
}
