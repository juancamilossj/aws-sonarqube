import React from 'react';

export default function ClusterLegend({ nodes = [], activeCluster, onSelectCluster }) {
  const clusterData = [
    { name: 'Matemáticas & Lógica', color: '#00f2fe' },
    { name: 'IA & Algoritmos', color: '#a855f7' },
    { name: 'Bio-Sistemas & Neuro', color: '#10b981' },
    { name: 'Ética & Sociedad Digital', color: '#f59e0b' },
    { name: 'Física & Dinámica', color: '#06b6d4' }
  ];

  return (
    <div className="absolute bottom-6 left-6 z-20 hidden lg:flex items-center gap-3 bg-slate-950/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl px-4 py-2.5 shadow-xl select-none">
      <span className="text-[10px] font-mono uppercase text-slate-500 font-bold tracking-wider">
        Dimensiones:
      </span>

      <div className="flex items-center gap-2">
        {clusterData.map(c => {
          const count = nodes.filter(n => n.cluster === c.name).length;
          const isActive = activeCluster === c.name;

          return (
            <button
              key={c.name}
              onClick={() => onSelectCluster(isActive ? 'all' : c.name)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs transition-all ${
                isActive
                  ? 'bg-slate-800 text-slate-100 border border-slate-600 shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full shadow-sm"
                style={{ backgroundColor: c.color, boxShadow: `0 0 8px ${c.color}aa` }}
              />
              <span className="font-['Rajdhani'] font-semibold">{c.name.split('&')[0]}</span>
              <span className="text-[10px] text-slate-500 font-mono">({count})</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
