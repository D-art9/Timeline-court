import React, { useState, useEffect } from 'react';
import { Bookmark, Trash2, Cpu, Sparkles } from 'lucide-react';

interface SimulationRecord {
  teamA: string;
  teamB: string;
  scoreA: number;
  scoreB: number;
  winner: string;
  probability: number;
  engineMode: 'statistical' | 'ml';
  timestamp: string;
}

export const SavedMatchupsPage: React.FC = () => {
  const [logs, setLogs] = useState<SimulationRecord[]>([]);

  useEffect(() => {
    const loaded = localStorage.getItem('nba_simulation_logs');
    if (loaded) {
      try {
        setLogs(JSON.parse(loaded));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const clearHistory = () => {
    if (window.confirm('Are you sure you want to clear simulation logs?')) {
      localStorage.removeItem('nba_simulation_logs');
      setLogs([]);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
            Simulated Games Feed
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Review past positional simulations, margins, and analytical logs generated.
          </p>
        </div>
        
        {logs.length > 0 && (
          <button
            onClick={clearHistory}
            className="flex items-center gap-2 rounded-xl border border-red-900/30 hover:border-red-500 bg-red-950/10 hover:bg-red-950/30 px-4 py-2.5 text-xs font-bold text-red-400 transition-all self-start md:self-auto"
          >
            <Trash2 className="h-4 w-4" />
            Clear Simulation History
          </button>
        )}
      </div>

      <div className="bg-bg-card border border-bg-border rounded-3xl p-6">
        {logs.length === 0 ? (
          <div className="text-center py-12 space-y-4">
            <Bookmark className="h-12 w-12 text-zinc-700 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">No Simulations Stored</h3>
              <p className="text-xs text-zinc-500 max-w-xs mx-auto">
                Head over to the Matchup Arena page to run simulation algorithms.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
            {logs.map((record, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-bg-dark/45 border border-bg-border/60 hover:border-zinc-700 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-grow">
                  <div className="flex items-center gap-2">
                    {record.engineMode === 'ml' ? (
                      <span className="flex items-center gap-1 text-[8px] font-black text-brand-purple bg-brand-purple/10 border border-brand-purple/20 px-2 py-0.5 rounded uppercase">
                        <Sparkles className="h-2.5 w-2.5" />
                        ML Model
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[8px] font-black text-brand-blue bg-brand-blue/10 border border-brand-blue/20 px-2 py-0.5 rounded uppercase">
                        <Cpu className="h-2.5 w-2.5" />
                        Stat Matrix
                      </span>
                    )}
                    <span className="text-[10px] text-zinc-500 font-bold">{record.timestamp}</span>
                  </div>

                  <h3 className="text-sm font-bold text-white">
                    {record.teamA} <span className="text-zinc-500">vs</span> {record.teamB}
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Winner: <span className="text-brand-green font-bold">{record.winner}</span> ({record.probability}% probability share)
                  </p>
                </div>

                <div className="bg-zinc-950/80 border border-zinc-850 px-4 py-2.5 rounded-xl text-center self-stretch sm:self-auto flex flex-col justify-center min-w-[100px]">
                  <span className="text-[8px] text-zinc-500 uppercase font-black tracking-wider">Final Score</span>
                  <span className="text-lg font-black text-white mt-0.5">
                    {record.scoreA} - {record.scoreB}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
