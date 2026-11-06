import React, { useState } from 'react';
import {
  Brain,
  GraduationCap,
  Sparkles,
  Volume2,
  VolumeX,
  RotateCcw,
  Search,
  BookOpen,
  Share2,
  ShieldAlert
} from 'lucide-react';
import { neuralAudio } from '../utils/AudioPlayer';

export default function Header({
  role,
  onRoleChange,
  clusters = [],
  activeCluster,
  onClusterChange,
  onSearch,
  searchQuery,
  onResetNetwork,
  onOpenCreateNode,
  onOpenCreateSynapse
}) {
  const [isMuted, setIsMuted] = useState(false);

  const toggleSound = () => {
    const muted = neuralAudio.toggleMute();
    setIsMuted(muted);
    if (!muted) {
      neuralAudio.playNodeSelect();
    }
  };

  const handleRoleToggle = (newRole) => {
    onRoleChange(newRole);
    neuralAudio.playNodeSelect();
  };

  return (
    <header className="relative z-30 w-full bg-[#070913]/90 backdrop-blur-xl border-b border-cyan-500/20 px-4 py-3 select-none">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">

        {/* Logo & Brand */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-600/30 border border-cyan-400/40 shadow-lg shadow-cyan-500/20 group">
            <Brain className="w-6 h-6 text-cyan-400 transition-transform group-hover:scale-110" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full animate-ping opacity-75"></span>
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full"></span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-wider bg-gradient-to-r from-cyan-400 via-sky-200 to-purple-400 bg-clip-text text-transparent font-['Orbitron']">
                SYNAPSE<span className="text-cyan-400">EDU</span>
              </h1>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                Nexus v2.6
              </span>
            </div>
            <p className="text-xs text-slate-400 font-['Rajdhani'] font-medium">
              Red Neuronal Cognitiva Interdisciplinaria
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative flex-1 max-w-md w-full">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-cyan-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar competencia, concepto o sinapsis..."
              value={searchQuery}
              onChange={(e) => onSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-900/80 border border-slate-700/80 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all font-sans"
            />
          </div>
        </div>

        {/* Role Switcher & Audio Controls */}
        <div className="flex items-center gap-3">
          {/* Mode Switch (Estudiante vs Docente) */}
          <div className="flex bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => handleRoleToggle('student')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                role === 'student'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md shadow-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Estudiante</span>
            </button>

            <button
              onClick={() => handleRoleToggle('teacher')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                role === 'teacher'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 shadow-md shadow-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Docente</span>
            </button>
          </div>

          {/* Teacher Quick Actions */}
          {role === 'teacher' && (
            <div className="hidden lg:flex items-center gap-2">
              <button
                onClick={onOpenCreateNode}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-500/40 hover:bg-purple-500/30 transition-all"
                title="Añadir nueva neurona curricular"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>+ Neurona</span>
              </button>
              <button
                onClick={onOpenCreateSynapse}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-all"
                title="Conectar sinapsis o puente interdisciplinar"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>+ Sinapsis</span>
              </button>
            </div>
          )}

          {/* Audio FX Toggle */}
          <button
            onClick={toggleSound}
            title={isMuted ? "Activar audio sináptico" : "Silenciar audio"}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-400 transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>

          {/* Reset Mesh Button */}
          <button
            onClick={onResetNetwork}
            title="Restablecer Conectoma a Estado Inicial"
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-amber-400 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Domain Cluster Selector Pills */}
      <div className="max-w-7xl mx-auto mt-2.5 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider whitespace-nowrap mr-1">
          Filtro Clúster:
        </span>
        <button
          onClick={() => {
            onClusterChange('all');
            neuralAudio.playNodeSelect();
          }}
          className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
            activeCluster === 'all'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400 shadow-sm shadow-cyan-500/20'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          Todo el Conectoma
        </button>
        {clusters.map((cluster) => (
          <button
            key={cluster}
            onClick={() => {
              onClusterChange(cluster);
              neuralAudio.playNodeSelect();
            }}
            className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              activeCluster === cluster
                ? 'bg-purple-500/25 text-purple-200 border border-purple-400 shadow-sm shadow-purple-500/20'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {cluster}
          </button>
        ))}
      </div>
    </header>
  );
}
