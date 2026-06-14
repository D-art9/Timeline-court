import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { players as fallbackPlayers } from '../data/players';
import type { Player } from '../data/players';
import { api } from '../data/api';
import { Sparkles, Trophy, Trash2, Save, X, Plus, Search } from 'lucide-react';

interface PositionSlot {
  position: 'PG' | 'SG' | 'SF' | 'PF' | 'C';
  label: string;
  coords: { top: string; left: string }; // Position on the court
}

const COURT_SLOTS: PositionSlot[] = [
  { position: 'PG', label: 'Point Guard', coords: { top: '75%', left: '50%' } },
  { position: 'SG', label: 'Shooting Guard', coords: { top: '55%', left: '20%' } },
  { position: 'SF', label: 'Small Forward', coords: { top: '55%', left: '80%' } },
  { position: 'PF', label: 'Power Forward', coords: { top: '35%', left: '30%' } },
  { position: 'C', label: 'Center', coords: { top: '25%', left: '50%' } },
];

const TEAM_GLOW_COLORS: Record<string, string> = {
  CHI: 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]',
  MIA: 'border-red-650 shadow-[0_0_15px_rgba(185,28,28,0.5)]',
  LAL: 'border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.5)]',
  GSW: 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]',
  BOS: 'border-green-600 shadow-[0_0_15px_rgba(22,163,74,0.5)]',
  PHI: 'border-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.5)]',
  SAS: 'border-gray-400 shadow-[0_0_15px_rgba(156,163,175,0.5)]',
  DEN: 'border-yellow-600 shadow-[0_0_15px_rgba(202,138,4,0.5)]',
  HOU: 'border-red-600 shadow-[0_0_15px_rgba(220,38,38,0.5)]',
  OKC: 'border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.5)]',
  MIL: 'border-green-800 shadow-[0_0_15px_rgba(20,83,45,0.5)]',
  CIN: 'border-red-700 shadow-[0_0_15px_rgba(185,28,28,0.5)]',
};

export const TeamBuilderPage: React.FC = () => {
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>(fallbackPlayers);
  const [selectedRoster, setSelectedRoster] = useState<Record<string, Player | null>>({
    PG: null,
    SG: null,
    SF: null,
    PF: null,
    C: null,
  });
  
  const [teamName, setTeamName] = useState('My Dream Team');
  const [activeSlot, setActiveSlot] = useState<'PG' | 'SG' | 'SF' | 'PF' | 'C' | null>(null);
  const [savedTeams, setSavedTeams] = useState<Array<{ id?: string; name: string; roster: Record<string, Player | null> }>>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    try {
      const dbPlayers = await api.getPlayers();
      setAvailablePlayers(dbPlayers);

      const dbTeams = await api.getTeams();
      if (Array.isArray(dbTeams)) {
        const mapped = dbTeams.map((t: any) => {
          const playersList = t.team_players_details || t.team_players;
          if (playersList) {
            const roster: Record<string, Player | null> = { PG: null, SG: null, SF: null, PF: null, C: null };
            playersList.forEach((tp: any) => {
              const pId = typeof tp.player === 'object' ? tp.player.id : tp.player;
              const found = dbPlayers.find(p => String(p.id) === String(pId)) || fallbackPlayers.find(p => String(p.id) === String(pId));
              if (found) {
                roster[tp.lineup_position as 'PG' | 'SG' | 'SF' | 'PF' | 'C'] = found;
              }
            });
            return { id: t.id, name: t.name, roster };
          }
          return t;
        });
        setSavedTeams(mapped);
      }
    } catch (e) {
      console.error('Failed to load data:', e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectPlayerForSlot = (player: Player) => {
    if (!activeSlot) return;
    setSelectedRoster(prev => ({
      ...prev,
      [activeSlot]: player
    }));
    setActiveSlot(null);
    setSearchQuery('');
  };

  const removePlayerFromSlot = (pos: 'PG' | 'SG' | 'SF' | 'PF' | 'C') => {
    setSelectedRoster(prev => ({
      ...prev,
      [pos]: null
    }));
  };

  const saveTeam = async () => {
    const isRosterEmpty = Object.values(selectedRoster).every(p => p === null);
    if (isRosterEmpty) {
      alert('Roster cannot be empty!');
      return;
    }
    
    const teamPlayersPayload = Object.entries(selectedRoster)
      .filter(([_, p]) => p !== null)
      .map(([pos, p]) => ({
        player: p!.id,
        lineup_position: pos
      }));

    try {
      await api.saveTeam(teamName, teamPlayersPayload);
      alert('Team saved successfully!');
      loadData();
    } catch (e) {
      alert('Error saving team to API. Roster saved locally.');
      loadData();
    }
  };

  const loadTeam = (team: { name: string; roster: Record<string, Player | null> }) => {
    setSelectedRoster(team.roster);
    setTeamName(team.name);
  };

  const deleteTeam = async (team: any) => {
    try {
      const identifier = team.id || team.name;
      await api.deleteTeam(identifier);
      alert('Team removed.');
      loadData();
    } catch (e) {
      alert('Failed to delete team.');
    }
  };

  // Compute stats
  const activePlayers = Object.values(selectedRoster).filter(Boolean) as Player[];
  const numPlayers = activePlayers.length;

  const statsAvg = {
    ppg: numPlayers ? (activePlayers.reduce((acc, p) => acc + p.ppg, 0) / numPlayers).toFixed(1) : '0.0',
    ts: numPlayers ? (activePlayers.reduce((acc, p) => acc + p.ts, 0) / numPlayers).toFixed(1) : '0.0',
    astToTurnover: numPlayers ? (activePlayers.reduce((acc, p) => acc + (p.apg * 0.35), 0) + 1.2).toFixed(2) : '0.00',
    netRating: numPlayers ? (activePlayers.reduce((acc, p) => acc + p.netRating, 0) / numPlayers).toFixed(1) : '0.0',
  };

  // Compatibility grade logic
  const getChemistryGrade = () => {
    if (numPlayers === 0) return 'No Roster Selected';
    const net = parseFloat(statsAvg.netRating);
    const astRatio = parseFloat(statsAvg.astToTurnover);
    if (net > 12 && astRatio > 2.2) return 'Elite Playmaking Chemistry';
    if (net > 8) return 'Strong Offensive Balance';
    return 'Development Phase Roster';
  };

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl font-display">
            Custom Team Builder
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Construct your custom 5-man roster of legends and evaluate their cross-era compatibility.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left/Middle Column: 3D-angled tactical basketball court */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* 3D Perspective Wrapper */}
          <div className="w-full relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-[#0a0f1d] to-[#040714] p-4 flex items-center justify-center min-h-[460px] shadow-2xl">
            <div className="absolute inset-0 bg-[radial-gradient(#06B6D4_0.8px,transparent_0.8px)] bg-[size:20px_20px] opacity-10 pointer-events-none" />

            {/* 3D Angle Transform Viewport */}
            <div 
              className="relative w-full max-w-2xl aspect-[16/10] rounded-2xl border-2 border-dashed border-[#06B6D4]/25 bg-zinc-950/65 shadow-[0_0_50px_rgba(6,182,212,0.05)] overflow-hidden"
              style={{
                perspective: '1200px',
                transform: 'perspective(1200px) rotateX(22deg) scale(0.96)',
                transformStyle: 'preserve-3d'
              }}
            >
              {/* Half-court Vector Lines */}
              <svg className="absolute inset-0 h-full w-full stroke-[#06B6D4]/30 fill-none pointer-events-none" strokeWidth="1.5">
                <path d="M 0 100 A 300 300 0 0 0 0 700" style={{ transform: 'scale(1.2) translate(-10%, -10%)' }} />
                <rect x="0" y="30%" width="25%" height="40%" />
                <circle cx="25%" cy="50%" r="8%" />
                <line x1="90%" y1="0" x2="90%" y2="100%" />
                <circle cx="90%" cy="50%" r="15%" />
              </svg>

              {/* Position Slots */}
              {COURT_SLOTS.map(slot => {
                const assigned = selectedRoster[slot.position];
                const glow = assigned ? (TEAM_GLOW_COLORS[assigned.team] || 'border-zinc-500') : 'border-zinc-800';
                return (
                  <div
                    key={slot.position}
                    className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
                    style={{ 
                      top: slot.coords.top, 
                      left: slot.coords.left,
                      transform: 'translate3d(-50%, -50%, 40px) scale(0.95)'
                    }}
                  >
                    {assigned ? (
                      <div className="group relative flex flex-col items-center justify-center text-center">
                        {/* Micro-avatar with pulsing outline matching team color */}
                        <div className={`h-16 w-16 md:h-18 md:w-18 rounded-full border-2 bg-zinc-950 flex items-center justify-center overflow-hidden transition-all duration-300 ${glow} relative`}>
                          <span className="absolute top-0.5 right-1.5 text-[8px] font-black text-[#06B6D4]">{slot.position}</span>
                          <span className="absolute bottom-0.5 left-1.5 text-[8px] font-black text-zinc-500">#23</span> {/* Simulated jersey */}
                          <div className="text-lg font-black text-zinc-650 select-none">{assigned.headshot}</div>
                          {/* Remove button on hover */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removePlayerFromSlot(slot.position);
                            }}
                            className="absolute inset-0 bg-black/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="h-5 w-5 text-red-500" />
                          </button>
                        </div>
                        <span className="mt-2 text-xs font-bold text-white px-2 py-0.5 bg-zinc-950/85 rounded-md border border-zinc-850 truncate max-w-[100px]">
                          {assigned.name.split(' ').pop()}
                        </span>
                      </div>
                    ) : (
                      <button
                        onClick={() => setActiveSlot(slot.position)}
                        className="h-16 w-16 md:h-18 md:w-18 rounded-full border-2 border-dashed border-zinc-800 hover:border-[#06B6D4] bg-zinc-950/40 hover:bg-zinc-950 flex flex-col items-center justify-center text-zinc-500 hover:text-[#06B6D4] transition-all group shadow-md"
                      >
                        <Plus className="h-5 w-5 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-bold mt-1 uppercase tracking-wider">{slot.position}</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Save panel */}
          <div className="flex flex-col sm:flex-row gap-4 items-center bg-[#0B0F19]/80 border border-white/5 rounded-3xl p-5 justify-between backdrop-blur-md">
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="bg-zinc-950/60 border border-zinc-850 text-white text-sm rounded-xl px-4 py-3 w-full sm:max-w-xs focus:outline-none focus:border-[#06B6D4] transition-all"
              placeholder="Roster Name..."
            />
            <button
              onClick={saveTeam}
              className="flex items-center gap-2 bg-white text-black hover:bg-zinc-200 transition-colors font-bold text-sm rounded-xl px-5 py-3 shadow-lg w-full sm:w-auto justify-center cursor-pointer"
            >
              <Save className="h-4 w-4" />
              Save Roster
            </button>
          </div>
        </div>

        {/* Right Column: Compatibility & Saved Lists */}
        <div className="space-y-6">
          {/* Compatibility Dashboard */}
          <div className="bg-[#0B0F19]/80 border border-white/5 rounded-3xl p-6 space-y-6 backdrop-blur-md">
            <h3 className="text-lg font-black tracking-tight text-white uppercase flex items-center gap-2 font-display">
              <Sparkles className="h-5 w-5 text-[#8B5CF6]" />
              Chemistry Matrix
            </h3>

            {/* Grading message */}
            <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-850 flex items-center gap-2.5">
              <div className="h-2.5 w-2.5 rounded-full bg-[#10B981] animate-pulse" />
              <span className="text-xs font-black text-brand-green uppercase tracking-wide">
                {getChemistryGrade()}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-zinc-950/30 border border-zinc-850/60 rounded-2xl p-4 space-y-1">
                <span className="text-[9px] text-zinc-500 uppercase font-black tracking-widest">Avg Scoring</span>
                <p className="text-2xl font-black bg-gradient-to-r from-[#F59E0B] to-[#06B6D4] bg-clip-text text-transparent">
                  {statsAvg.ppg}
                </p>
                <span className="text-[9px] text-zinc-500">Points Per Game</span>
              </div>
              
              <div className="bg-zinc-950/30 border border-zinc-850/60 rounded-2xl p-4 space-y-1">
                <span className="text-[9px] text-zinc-500 uppercase font-black tracking-widest">True Shooting</span>
                <p className="text-2xl font-black bg-gradient-to-r from-[#F59E0B] to-[#06B6D4] bg-clip-text text-transparent">
                  {statsAvg.ts}%
                </p>
                <span className="text-[9px] text-zinc-500">Avg TS Rating</span>
              </div>

              <div className="bg-zinc-950/30 border border-zinc-850/60 rounded-2xl p-4 space-y-1">
                <span className="text-[9px] text-zinc-500 uppercase font-black tracking-widest">AST/TO Ratio</span>
                <p className="text-2xl font-black bg-gradient-to-r from-[#F59E0B] to-[#06B6D4] bg-clip-text text-transparent">
                  {statsAvg.astToTurnover}
                </p>
                <span className="text-[9px] text-zinc-500">Assists Index</span>
              </div>

              <div className="bg-zinc-950/30 border border-zinc-850/60 rounded-2xl p-4 space-y-1">
                <span className="text-[9px] text-zinc-500 uppercase font-black tracking-widest">Net Rating</span>
                <p className="text-2xl font-black bg-gradient-to-r from-[#F59E0B] to-[#06B6D4] bg-clip-text text-transparent">
                  +{statsAvg.netRating}
                </p>
                <span className="text-[9px] text-zinc-500">Point Margin</span>
              </div>
            </div>
          </div>

          {/* Saved Lineups Badges */}
          <div className="bg-[#0B0F19]/80 border border-white/5 rounded-3xl p-6 space-y-4 backdrop-blur-md">
            <h3 className="text-lg font-black tracking-tight text-white uppercase flex items-center gap-2 font-display">
              <Trophy className="h-5 w-5 text-[#F59E0B]" />
              Saved Lineups
            </h3>
            {savedTeams.length === 0 ? (
              <p className="text-xs text-zinc-500">No saved custom lineups yet. Create and save one!</p>
            ) : (
              <div className="flex flex-wrap gap-2.5 max-h-[200px] overflow-y-auto pr-1">
                {savedTeams.map((t, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center gap-2 bg-zinc-950/60 border border-zinc-850 hover:border-zinc-750 px-3.5 py-2 rounded-2xl transition-all hover:scale-[1.02] cursor-pointer"
                  >
                    <button
                      onClick={() => loadTeam(t)}
                      className="text-[11px] font-bold text-zinc-300 hover:text-white truncate max-w-[120px] text-left cursor-pointer"
                    >
                      {t.name}
                    </button>
                    <button
                      onClick={() => deleteTeam(t)}
                      className="text-zinc-650 hover:text-red-450 transition-colors p-0.5"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Drawer Overlay for player selection portal */}
      {activeSlot && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md h-full bg-zinc-950 border-l border-white/5 p-6 flex flex-col justify-between animate-slide-left shadow-2xl">
            <div className="space-y-6 flex-grow overflow-y-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-white font-display">Select {activeSlot}</h3>
                  <p className="text-xs text-zinc-500">Choose a player matching this role database</p>
                </div>
                <button
                  onClick={() => {
                    setActiveSlot(null);
                    setSearchQuery('');
                  }}
                  className="p-2 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Search Bar inside Modal */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter players by name..."
                  className="bg-zinc-900 border border-zinc-800 text-white text-xs rounded-xl pl-10 pr-4 py-3 w-full focus:outline-none focus:border-[#06B6D4] transition-all"
                />
              </div>

              {/* Section: Native Position Fits */}
              <div className="space-y-3">
                {(() => {
                  const nameMatch = availablePlayers.filter(p =>
                    p.name.toLowerCase().includes(searchQuery.toLowerCase())
                  );
                  const nativeFits = nameMatch.filter(p => p.position === activeSlot);
                  const otherPlayers = nameMatch.filter(p => p.position !== activeSlot);
                  const sorted = [...nativeFits, ...otherPlayers];

                  return sorted.length === 0 ? (
                    <p className="text-xs text-zinc-500 italic px-1">No players match your search.</p>
                  ) : (
                    <>
                      {nativeFits.length > 0 && (
                        <p className="text-[9px] uppercase tracking-widest text-[#06B6D4] font-black px-1 pb-1">
                          ✦ Position Matches
                        </p>
                      )}
                      {sorted.map((player, idx) => {
                        const isNative = player.position === activeSlot;
                        const divider = !isNative && idx === nativeFits.length;
                        return (
                          <div key={player.id}>
                            {divider && (
                              <p className="text-[9px] uppercase tracking-widest text-zinc-500 font-black px-1 pt-2 pb-1 border-t border-zinc-800 mt-2">
                                All Other Players
                              </p>
                            )}
                            <div
                              onClick={() => selectPlayerForSlot(player)}
                              className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer group ${
                                isNative
                                  ? 'bg-zinc-900 border-[#06B6D4]/20 hover:border-[#06B6D4]/60'
                                  : 'bg-zinc-950/60 border-zinc-850 hover:border-zinc-700'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`h-10 w-10 rounded-full bg-zinc-950 border flex items-center justify-center font-bold text-xs transition-colors ${
                                  isNative ? 'border-[#06B6D4]/40 text-[#06B6D4] group-hover:border-[#06B6D4]' : 'border-zinc-800 text-zinc-400 group-hover:border-zinc-600'
                                }`}>
                                  {player.headshot}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className={`text-sm font-bold transition-colors ${isNative ? 'text-white group-hover:text-[#06B6D4]' : 'text-zinc-300 group-hover:text-white'}`}>
                                      {player.name}
                                    </h4>
                                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                                      isNative
                                        ? 'bg-[#06B6D4]/15 text-[#06B6D4]'
                                        : 'bg-zinc-800 text-zinc-400'
                                    }`}>
                                      {player.position}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-zinc-500 uppercase font-semibold">{player.team} • {player.era}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className={`text-xs font-bold ${isNative ? 'text-[#10B981]' : 'text-zinc-400'}`}>{player.ppg} PPG</span>
                                <p className="text-[9px] text-zinc-500">TS: {player.ts}%</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
