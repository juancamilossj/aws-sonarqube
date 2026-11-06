import React, { useState } from 'react';
import {
  AlertTriangle,
  TrendingUp,
  Share2,
  PlusCircle,
  Activity,
  Users,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  CheckCircle2
} from 'lucide-react';
import { neuralAudio } from '../utils/AudioPlayer';

export default function TeacherPanel({
  analytics,
  onSelectNodeById,
  onOpenCreateNode,
  onOpenCreateSynapse,
  nodes = []
}) {
  const [collapsed, setCollapsed] = useState(false);

  if (!analytics) return null;

  return (
    <div className="absolute top-24 right-6 z-20 w-96 max-h-[85vh] flex flex-col bg-slate-950/90 backdrop-blur-xl border border-amber-500/30 rounded-2xl shadow-2xl shadow-amber-950/40 select-none overflow-hidden transition-all">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-b border-amber-500/20 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 font-['Rajdhani'] flex items-center gap-1.5">
              Telemetría Institucional
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                EN VIVO
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Cohorte Alfa 2026 ({analytics.totalCohortStudents} Estudiantes)
            </p>
          </div>
        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
        >
          {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
      </div>

      {!collapsed && (
        <div className="p-4 overflow-y-auto space-y-4 max-h-[calc(85vh-75px)]">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5 text-center">
              <div className="text-[10px] text-slate-400 mb-0.5">Promedio Cohorte</div>
              <div className="text-xl font-black text-amber-400 font-['Orbitron']">
                {analytics.cohortAverage}%
              </div>
              <div className="text-[9px] text-slate-500">rendimiento global</div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5 text-center">
              <div className="text-[10px] text-slate-400 mb-0.5">Cuellos Botella</div>
              <div className="text-xl font-black text-rose-400 font-['Orbitron']">
                {analytics.bottlenecks?.length || 0}
              </div>
              <div className="text-[9px] text-slate-500">nodos con rezago</div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5 text-center">
              <div className="text-[10px] text-slate-400 mb-0.5">Puentes Interdisc.</div>
              <div className="text-xl font-black text-purple-400 font-['Orbitron']">
                {analytics.totalBridges || 0}
              </div>
              <div className="text-[9px] text-slate-500">sinergias activas</div>
            </div>
          </div>

          {/* Critical Bottlenecks Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5 uppercase tracking-wider font-mono">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                Cuellos de Botella Cognitivos
              </h4>
              <span className="text-[10px] text-rose-400 font-mono">
                {analytics.bottlenecks?.length} Detectados
              </span>
            </div>

            {analytics.bottlenecks && analytics.bottlenecks.length > 0 ? (
              <div className="space-y-2">
                {analytics.bottlenecks.map((bn) => (
                  <div
                    key={bn.id}
                    onClick={() => {
                      onSelectNodeById(bn.id);
                      neuralAudio.playAlert();
                    }}
                    className="group cursor-pointer bg-rose-950/20 hover:bg-rose-950/40 border border-rose-500/30 hover:border-rose-400 rounded-xl p-3 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="text-xs font-bold text-rose-200 group-hover:text-rose-100 flex items-center gap-1.5">
                          {bn.title}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Clúster: <span className="text-slate-300">{bn.cluster}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="inline-block px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-mono font-bold">
                          {bn.struggleRate}% rezagados
                        </span>
                        <div className="text-[9px] text-slate-500 mt-0.5">
                          {bn.studentsStruggling}/{bn.totalStudents} estudiantes
                        </div>
                      </div>
                    </div>

                    {/* Prerequisite Root-Cause Insight */}
                    {bn.prerequisites && bn.prerequisites.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-rose-500/20 flex items-center gap-1.5 text-[10px] text-amber-300/90">
                        <Lightbulb className="w-3 h-3 text-amber-400 flex-shrink-0" />
                        <span>
                          Causa Raíz Probable: Reforzar prerrequisito previo en la cadena sináptica.
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>No hay cuellos de botella críticos activos.</span>
              </div>
            )}
          </div>

          {/* Curriculum Modification Quick Actions */}
          <div className="pt-2 border-t border-slate-800 space-y-2">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
              Gestión Dinámica de Red
            </h4>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onOpenCreateNode}
                className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-200 text-xs font-semibold transition-all"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Nueva Neurona</span>
              </button>

              <button
                onClick={onOpenCreateSynapse}
                className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-200 text-xs font-semibold transition-all"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Crear Sinapsis</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
