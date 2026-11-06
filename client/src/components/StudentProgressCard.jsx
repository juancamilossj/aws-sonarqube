import React, { useState } from 'react';
import { Award, Zap, Flame, Compass, ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react';

export default function StudentProgressCard({ student, nodes = [] }) {
  const [collapsed, setCollapsed] = useState(false);

  if (!student) return null;

  const totalNodes = nodes.length;
  const masteredCount = nodes.filter(n => n.status === 'mastered').length;
  const inProgressCount = nodes.filter(n => n.status === 'in_progress').length;
  const masteryPercentage = totalNodes > 0 ? Math.round((masteredCount / totalNodes) * 100) : 0;

  // XP progress to next level
  const prevLevelXp = (student.level - 1) * 500;
  const currentTierXp = student.xp - prevLevelXp;
  const tierTargetXp = 500;
  const xpPercent = Math.min(100, Math.max(0, Math.round((currentTierXp / tierTargetXp) * 100)));

  return (
    <div className="absolute top-24 left-6 z-20 w-80 bg-slate-950/85 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-4 shadow-2xl shadow-cyan-950/50 transition-all select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center font-bold text-slate-950 text-sm shadow-md shadow-cyan-500/30">
            {student.name.charAt(0)}
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5 font-['Rajdhani']">
              {student.name}
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            </h3>
            <p className="text-[11px] text-cyan-400 font-mono tracking-wide">
              {student.title}
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
        <div className="mt-3 space-y-3">
          {/* XP & Level Progress */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-400 font-mono flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Nivel {student.level}
              </span>
              <span className="text-cyan-400 font-mono font-bold">
                {student.xp} XP <span className="text-slate-500 font-normal">/ {student.nextLevelXp}</span>
              </span>
            </div>
            {/* Progress Bar */}
            <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 via-sky-400 to-purple-500 transition-all duration-500 shadow-sm shadow-cyan-400"
                style={{ width: `${xpPercent}%` }}
              />
            </div>
          </div>

          {/* Key Cognitive Metrics Grid */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-2.5">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-0.5">
                <Compass className="w-3.5 h-3.5 text-cyan-400" />
                <span>Dominio Global</span>
              </div>
              <div className="text-lg font-bold text-cyan-300 font-['Orbitron']">
                {masteryPercentage}%
              </div>
              <div className="text-[10px] text-slate-500">
                {masteredCount} de {totalNodes} neuronas
              </div>
            </div>

            <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-2.5">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-0.5">
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                <span>Racha Sináptica</span>
              </div>
              <div className="text-lg font-bold text-orange-400 font-['Orbitron']">
                {student.streakDays} <span className="text-xs text-orange-300">días</span>
              </div>
              <div className="text-[10px] text-slate-500">
                +15% bonus sinapsis
              </div>
            </div>
          </div>

          {/* Quick Status Legend */}
          <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-900">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400"></span>
              {masteredCount} Dominados
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-400 shadow-sm shadow-purple-400"></span>
              {inProgressCount} En Progreso
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-600"></span>
              {totalNodes - masteredCount - inProgressCount} Bloqueados
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
