import React, { useState } from 'react';
import { X, Share2, ArrowRight, Zap, Lightbulb } from 'lucide-react';
import { neuralAudio } from '../utils/AudioPlayer';

export default function CreateSynapseModal({ isOpen, onClose, onCreateSynapse, existingNodes = [] }) {
  const [sourceId, setSourceId] = useState(existingNodes[0]?.id || '');
  const [targetId, setTargetId] = useState(existingNodes[1]?.id || '');
  const [isInterdisciplinary, setIsInterdisciplinary] = useState(false);
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!sourceId || !targetId || sourceId === targetId) {
      alert("Por favor selecciona dos neuronas diferentes para formar la sinapsis.");
      return;
    }

    onCreateSynapse({
      sourceId,
      targetId,
      isInterdisciplinary,
      note: description.trim()
    });

    neuralAudio.playSynapsePulse();
    onClose();
  };

  const sourceNode = existingNodes.find(n => n.id === sourceId);
  const targetNode = existingNodes.find(n => n.id === targetId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md select-none">
      <div className="relative w-full max-w-lg bg-slate-950 border border-cyan-500/40 rounded-3xl shadow-2xl shadow-cyan-950/60 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-slate-100 font-['Rajdhani']">
              Establecer Conexión Sináptica
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3 items-center">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Neurona Origen
              </label>
              <select
                value={sourceId}
                onChange={(e) => setSourceId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-400"
              >
                {existingNodes.map(node => (
                  <option key={node.id} value={node.id}>
                    {node.title} ({node.cluster.split('&')[0]})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Neurona Destino
              </label>
              <select
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-400"
              >
                {existingNodes.map(node => (
                  <option key={node.id} value={node.id}>
                    {node.title} ({node.cluster.split('&')[0]})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Visual Preview */}
          <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-center gap-3 text-xs font-bold text-slate-200">
            <span className="text-cyan-400 truncate max-w-[150px]">{sourceNode?.title || 'Origen'}</span>
            <ArrowRight className="w-4 h-4 text-slate-500" />
            <span className="text-purple-400 truncate max-w-[150px]">{targetNode?.title || 'Destino'}</span>
          </div>

          {/* Type of Synapse */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Tipo de Enlace Sináptico
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div
                onClick={() => setIsInterdisciplinary(false)}
                className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                  !isInterdisciplinary
                    ? 'bg-cyan-950/40 border-cyan-400 text-cyan-200'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400'
                }`}
              >
                <div className="font-bold flex items-center gap-1.5 mb-1">
                  <Zap className="w-3.5 h-3.5 text-cyan-400" />
                  Prerrequisito Estricto
                </div>
                <p className="text-[10px] leading-tight text-slate-400">
                  El alumno debe dominar el origen para desbloquear el destino.
                </p>
              </div>

              <div
                onClick={() => setIsInterdisciplinary(true)}
                className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                  isInterdisciplinary
                    ? 'bg-amber-950/40 border-amber-400 text-amber-200'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400'
                }`}
              >
                <div className="font-bold flex items-center gap-1.5 mb-1">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                  Puente Interdisciplinar
                </div>
                <p className="text-[10px] leading-tight text-slate-400">
                  Conexión conceptual libre entre áreas aparentemente no relacionadas.
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Razón Pedagógica / Vínculo Conceptual
            </label>
            <textarea
              rows={3}
              placeholder="Ej: Explica cómo los conceptos del nodo origen fundamentan o inspiran los del destino..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 resize-none"
            />
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
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/20 transition-all"
            >
              Crear Axón Sináptico
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
