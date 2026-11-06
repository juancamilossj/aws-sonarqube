import React, { useState } from 'react';
import { X, Plus, BookOpen, Layers } from 'lucide-react';
import { neuralAudio } from '../utils/AudioPlayer';

export default function CreateNodeModal({ isOpen, onClose, onCreateNode, existingNodes = [] }) {
  const [title, setTitle] = useState('');
  const [cluster, setCluster] = useState('IA & Algoritmos');
  const [level, setLevel] = useState('Intermedio');
  const [summary, setSummary] = useState('');
  const [selectedPrereq, setSelectedPrereq] = useState([]);
  const [xpReward, setXpReward] = useState(150);

  if (!isOpen) return null;

  const clusterColors = {
    'IA & Algoritmos': '#a855f7',
    'Matemáticas & Lógica': '#00f2fe',
    'Bio-Sistemas & Neuro': '#10b981',
    'Ética & Sociedad Digital': '#f59e0b',
    'Física & Dinámica': '#06b6d4'
  };

  const handleTogglePrereq = (nodeId) => {
    if (selectedPrereq.includes(nodeId)) {
      setSelectedPrereq(selectedPrereq.filter(id => id !== nodeId));
    } else {
      setSelectedPrereq([...selectedPrereq, nodeId]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    onCreateNode({
      title: title.trim(),
      cluster,
      clusterColor: clusterColors[cluster] || '#00f2fe',
      level,
      summary: summary.trim() || 'Competencia curricular integrada a la matriz del conectoma.',
      prerequisites: selectedPrereq,
      xpReward: Number(xpReward) || 150
    });

    neuralAudio.playLevelUp();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md select-none">
      <div className="relative w-full max-w-lg bg-slate-950 border border-purple-500/40 rounded-3xl shadow-2xl shadow-purple-950/60 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-purple-400" />
            <h3 className="text-base font-bold text-slate-100 font-['Rajdhani']">
              Inyectar Nueva Neurona Curricular
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Nombre de la Competencia / Concepto
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Visión Artificial & Redes Convolucionales"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Dominio / Clúster
              </label>
              <select
                value={cluster}
                onChange={(e) => setCluster(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-purple-400"
              >
                <option value="IA & Algoritmos">IA & Algoritmos</option>
                <option value="Matemáticas & Lógica">Matemáticas & Lógica</option>
                <option value="Bio-Sistemas & Neuro">Bio-Sistemas & Neuro</option>
                <option value="Ética & Sociedad Digital">Ética & Sociedad Digital</option>
                <option value="Física & Dinámica">Física & Dinámica</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Nivel Cognitivo
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-purple-400"
              >
                <option value="Básico">Básico</option>
                <option value="Intermedio">Intermedio</option>
                <option value="Avanzado">Avanzado</option>
                <option value="Nivel Maestro">Nivel Maestro</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Resumen Epistemológico / Justificación
            </label>
            <textarea
              rows={3}
              placeholder="Explica qué habilidad o concepto comprende el estudiante y cómo se inserta en el mapa..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-400 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Prerrequisitos en la Red (Nodos Previos Requeridos)
            </label>
            <div className="max-h-36 overflow-y-auto border border-slate-800 rounded-xl p-2 bg-slate-900/60 space-y-1">
              {existingNodes.map(node => (
                <label
                  key={node.id}
                  className="flex items-center gap-2 text-xs text-slate-300 hover:text-slate-100 p-1.5 rounded hover:bg-slate-800/60 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedPrereq.includes(node.id)}
                    onChange={() => handleTogglePrereq(node.id)}
                    className="rounded text-purple-600 focus:ring-purple-500 bg-slate-950 border-slate-700"
                  />
                  <span>{node.title}</span>
                  <span className="text-[10px] text-slate-500 ml-auto">{node.cluster}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-purple-500/20 transition-all"
            >
              Integrar al Conectoma
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
