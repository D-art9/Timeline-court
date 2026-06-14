import React, { useState } from 'react';
import { players } from '../data/players';
import type { Player } from '../data/players';
import { Search, Shuffle } from 'lucide-react';

export const PlayersPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEra, setFilterEra] = useState('All');
  
  // H2H comparison slots
  const [playerA, setPlayerA] = useState<Player | null>(players[0]);
  const [playerB, setPlayerB] = useState<Player | null>(players[1]);

  const filteredPlayers = players.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.team.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesEra = filterEra === 'All' || p.era === filterEra;
    return matchesSearch && matchesEra;
  });

  const getStatsAdvantage = (valA: number, valB: number) => {
    if (valA > valB) return 'A';
    if (valB > valA) return 'B';
    return 'Tie';
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
            Player Registry & Comparison
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Query the legendary index database and compare historical players side-by-side.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: List with search/filter */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-bg-card border border-bg-border rounded-3xl p-5 space-y-4">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search database..."
                className="bg-bg-dark border border-bg-border text-white text-xs rounded-xl pl-10 pr-4 py-3 w-full focus:outline-none focus:border-brand-blue"
              />
            </div>

            <div>
              <label className="block text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-2">Filter by Era</label>
              <select
                value={filterEra}
                onChange={(e) => setFilterEra(e.target.value)}
                className="bg-bg-dark border border-bg-border text-white text-xs rounded-xl px-4 py-3 w-full focus:outline-none focus:border-brand-blue"
              >
                <option value="All">All Eras</option>
                <option value="1960s">1960s</option>
                <option value="1970s">1970s</option>
                <option value="1980s">1980s</option>
                <option value="1990s">1990s</option>
                <option value="2000s">2000s</option>
                <option value="Modern">Modern Era</option>
              </select>
            </div>
          </div>

          {/* Player list feed */}
          <div className="bg-bg-card border border-bg-border rounded-3xl p-5 space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {filteredPlayers.map(p => (
              <div
                key={p.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-bg-dark/40 border border-bg-border/60 hover:bg-bg-dark/80 transition-colors"
              >
                <div>
                  <h4 className="text-xs font-bold text-white">{p.name}</h4>
                  <p className="text-[9px] text-zinc-500 uppercase">{p.position} • {p.team} • {p.era}</p>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setPlayerA(p)}
                    className="px-2 py-1 bg-brand-blue/10 border border-brand-blue/20 text-[9px] text-brand-blue font-bold rounded-md hover:bg-brand-blue/25"
                  >
                    Set A
                  </button>
                  <button
                    onClick={() => setPlayerB(p)}
                    className="px-2 py-1 bg-brand-purple/10 border border-brand-purple/20 text-[9px] text-brand-purple font-bold rounded-md hover:bg-brand-purple/25"
                  >
                    Set B
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Head-to-Head Comparison Matrix */}
        <div className="lg:col-span-2 bg-bg-card border border-bg-border rounded-3xl p-6 space-y-6">
          <h3 className="text-lg font-black tracking-tight text-white uppercase flex items-center gap-2">
            <Shuffle className="h-5 w-5 text-brand-orange" />
            Head-to-Head Comparison
          </h3>

          <div className="grid grid-cols-2 gap-8 relative">
            <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 border-l border-dashed border-bg-border/60 hidden sm:block" />

            {/* Slot A */}
            <div className="space-y-4">
              <span className="text-[10px] text-brand-blue font-bold uppercase tracking-wider block">Player A</span>
              {playerA ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center font-black text-brand-blue">
                      {playerA.headshot}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white leading-tight">{playerA.name}</h4>
                      <p className="text-[10px] text-zinc-500 uppercase">{playerA.team} • {playerA.position}</p>
                    </div>
                  </div>

                  <div className="space-y-3.5 pt-4 border-t border-bg-border/40">
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-500">Points Per Game</span>
                      <span className={`font-black ${getStatsAdvantage(playerA.ppg, playerB?.ppg || 0) === 'A' ? 'text-brand-green' : 'text-zinc-300'}`}>
                        {playerA.ppg}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-500">Rebounds Per Game</span>
                      <span className={`font-black ${getStatsAdvantage(playerA.rpg, playerB?.rpg || 0) === 'A' ? 'text-brand-green' : 'text-zinc-300'}`}>
                        {playerA.rpg}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-500">Assists Per Game</span>
                      <span className={`font-black ${getStatsAdvantage(playerA.apg, playerB?.apg || 0) === 'A' ? 'text-brand-green' : 'text-zinc-300'}`}>
                        {playerA.apg}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-500">True Shooting %</span>
                      <span className={`font-black ${getStatsAdvantage(playerA.ts, playerB?.ts || 0) === 'A' ? 'text-brand-green' : 'text-zinc-300'}`}>
                        {playerA.ts}%
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-500">Net Rating</span>
                      <span className={`font-black ${getStatsAdvantage(playerA.netRating, playerB?.netRating || 0) === 'A' ? 'text-brand-green' : 'text-zinc-300'}`}>
                        +{playerA.netRating}
                      </span>
                    </div>
                  </div>

                  {/* Strengths & Weaknesses */}
                  <div className="pt-4 border-t border-bg-border/40 space-y-2">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Key Playstyle Features</span>
                    <div className="flex flex-wrap gap-1.5">
                      {playerA.strengths.map((s, idx) => (
                        <span key={idx} className="bg-brand-green/10 border border-brand-green/20 text-brand-green text-[9px] font-bold px-2 py-0.5 rounded">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-zinc-500">No player selected in Slot A</p>
              )}
            </div>

            {/* Slot B */}
            <div className="space-y-4">
              <span className="text-[10px] text-brand-purple font-bold uppercase tracking-wider block">Player B</span>
              {playerB ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center font-black text-brand-purple">
                      {playerB.headshot}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white leading-tight">{playerB.name}</h4>
                      <p className="text-[10px] text-zinc-500 uppercase">{playerB.team} • {playerB.position}</p>
                    </div>
                  </div>

                  <div className="space-y-3.5 pt-4 border-t border-bg-border/40">
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-500">Points Per Game</span>
                      <span className={`font-black ${getStatsAdvantage(playerB.ppg, playerA?.ppg || 0) === 'B' ? 'text-brand-green' : 'text-zinc-300'}`}>
                        {playerB.ppg}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-500">Rebounds Per Game</span>
                      <span className={`font-black ${getStatsAdvantage(playerB.rpg, playerA?.rpg || 0) === 'B' ? 'text-brand-green' : 'text-zinc-300'}`}>
                        {playerB.rpg}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-500">Assists Per Game</span>
                      <span className={`font-black ${getStatsAdvantage(playerB.apg, playerA?.apg || 0) === 'B' ? 'text-brand-green' : 'text-zinc-300'}`}>
                        {playerB.apg}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-500">True Shooting %</span>
                      <span className={`font-black ${getStatsAdvantage(playerB.ts, playerA?.ts || 0) === 'B' ? 'text-brand-green' : 'text-zinc-300'}`}>
                        {playerB.ts}%
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-500">Net Rating</span>
                      <span className={`font-black ${getStatsAdvantage(playerB.netRating, playerA?.netRating || 0) === 'B' ? 'text-brand-green' : 'text-zinc-300'}`}>
                        +{playerB.netRating}
                      </span>
                    </div>
                  </div>

                  {/* Strengths & Weaknesses */}
                  <div className="pt-4 border-t border-bg-border/40 space-y-2">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Key Playstyle Features</span>
                    <div className="flex flex-wrap gap-1.5">
                      {playerB.strengths.map((s, idx) => (
                        <span key={idx} className="bg-brand-purple/10 border border-brand-purple/20 text-brand-purple text-[9px] font-bold px-2 py-0.5 rounded">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-zinc-500">No player selected in Slot B</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
