import React, { useState, useEffect } from 'react';
import { players } from '../data/players';
import type { Player } from '../data/players';
import { api } from '../data/api';
import { createPortal } from 'react-dom';
import { Swords, ChevronRight, X } from 'lucide-react';

interface SavedTeam {
  id?: string;
  name: string;
  roster: Record<string, Player | null>;
}

const PRESET_TEAMS: SavedTeam[] = [
  {
    name: '1996 Chicago Bulls',
    roster: {
      PG: players.find(p => p.id === 'robertson-62') || null,
      SG: players.find(p => p.id === 'mj-96') || null,
      SF: players.find(p => p.id === 'bird-86') || null,
      PF: players.find(p => p.id === 'duncan-03') || null,
      C: players.find(p => p.id === 'hakeem-94') || null,
    }
  },
  {
    name: '2017 Golden State Warriors',
    roster: {
      PG: players.find(p => p.id === 'curry-16') || null,
      SG: players.find(p => p.id === 'kobe-08') || null,
      SF: players.find(p => p.id === 'durant-14') || null,
      PF: players.find(p => p.id === 'giannis-20') || null,
      C: players.find(p => p.id === 'jokic-24') || null,
    }
  }
];

const generatePlayByPlay = (
  teamAName: string,
  teamBName: string,
  rosterA: any[],
  rosterB: any[],
  winner: string,
  scoreA: number,
  scoreB: number,
  mvpName: string
): string[] => {
  const centerA = rosterA.find(p => p.position === 'C')?.name || 'Center A';
  const centerB = rosterB.find(p => p.position === 'C')?.name || 'Center B';
  const pgA = rosterA.find(p => p.position === 'PG')?.name || 'Guard A';
  const pgB = rosterB.find(p => p.position === 'PG')?.name || 'Guard B';
  const scorerA = rosterA.find(p => p.position === 'SG' || p.position === 'SF')?.name || rosterA[0]?.name || 'Scorer A';
  const scorerB = rosterB.find(p => p.position === 'SG' || p.position === 'SF')?.name || rosterB[0]?.name || 'Scorer B';

  const clutchScoreA = Math.round(scoreA * 0.9);
  const clutchScoreB = Math.round(scoreB * 0.9);

  return [
    `[Q1 12:00] Tip-off won by ${centerA} over ${centerB}...`,
    `[Q1 08:34] ${pgA} assists ${scorerA} for a fastbreak layup.`,
    `[Q2 04:12] Block! ${centerB} denies ${scorerA} at the rim.`,
    `[Q3 09:15] MVP Run: ${mvpName} hits 3 consecutive shots!`,
    `[Q4 02:40] Clutch! ${pgB} hits a deep three. Score: ${clutchScoreA} - ${clutchScoreB}.`,
    `[Q4 00:00] Final Buzzer! ${winner} wins the matchup. Final Score: ${scoreA} - ${scoreB}.`
  ];
};

const positionCoordinates: Record<string, { top: string; left: string }> = {
  PG: { top: '80%', left: '50%' },
  SG: { top: '60%', left: '25%' },
  SF: { top: '60%', left: '75%' },
  PF: { top: '35%', left: '30%' },
  C: { top: '25%', left: '50%' }
};

const getRealNbaId = (id: string): string => {
  const clean = id.toLowerCase();
  if (clean.includes('mj') || clean.includes('jordan')) return '893';
  if (clean.includes('lebron') || clean.includes('james')) return '2544';
  if (clean.includes('kobe') || clean.includes('bryant')) return '977';
  if (clean.includes('curry')) return '201939';
  if (clean.includes('shaq') || clean.includes('oneal')) return '406';
  if (clean.includes('hakeem') || clean.includes('olajuwon')) return '349';
  if (clean.includes('bird')) return '1449';
  if (clean.includes('duncan')) return '1495';
  if (clean.includes('jokic')) return '203999';
  if (clean.includes('giannis') || clean.includes('antet')) return '203507';
  if (clean.includes('durant')) return '201142';
  if (clean.includes('robertson')) return '78007';
  return id.split('-')[0];
};

const CourtMarkings = ({ color }: { color: string }) => (
  <div className="absolute inset-0 pointer-events-none opacity-25">
    {/* Outlines */}
    <div className="absolute inset-0 border-2 rounded-2xl" style={{ borderColor: color }} />
    {/* Center Line at bottom */}
    <div className="absolute bottom-0 left-0 right-0 border-b-2" style={{ borderColor: color }} />
    {/* Free Throw Key */}
    <div className="absolute top-0 left-[30%] right-[30%] h-[35%] border-b-2 border-x-2" style={{ borderColor: color }}>
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full border-2" style={{ borderColor: color }} />
    </div>
    {/* 3-Point Arc */}
    <div className="absolute top-0 left-[10%] right-[10%] bottom-[20%] rounded-b-full border-b-2 border-x-2" style={{ borderColor: color, borderTop: 'none' }} />
  </div>
);

const Hoop = ({ color, transformStyle }: { color: string; transformStyle: string }) => (
  <div 
    className="absolute top-2 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none origin-bottom" 
    style={{ transform: transformStyle }}
  >
    <div className="w-1 h-12 bg-zinc-800 border-r border-zinc-700" />
    <div className="w-14 h-10 bg-white/10 border-2 rounded flex items-center justify-center relative backdrop-blur-sm shadow-lg" style={{ borderColor: color }}>
      <div className="w-5 h-4 border absolute bottom-1.5" style={{ borderColor: color }} />
      <div className="absolute bottom-0.5 w-4 h-4 rounded-full border border-orange-500 origin-center" style={{ transform: 'rotateX(90deg)' }}>
        <div className="w-full h-4 border border-white/20 border-dashed rounded-b-full opacity-60 translate-y-0.5" />
      </div>
    </div>
  </div>
);

const PlayerNode = ({ 
  player, 
  position, 
  color, 
  transformStyle, 
  onClick 
}: { 
  player: Player | null; 
  position: string; 
  color: string; 
  transformStyle: string; 
  onClick: () => void 
}) => {
  const headshotUrl = player 
    ? `https://cdn.nba.com/headshots/nba/latest/1040x760/${getRealNbaId(player.id)}.png`
    : '';

  return (
    <div 
      onClick={onClick}
      className={`absolute flex flex-col items-center cursor-pointer transition-all duration-300 group`}
      style={{
        top: positionCoordinates[position].top,
        left: positionCoordinates[position].left,
        transform: 'translateX(-50%) translateY(-50%)',
        transformStyle: 'preserve-3d'
      }}
    >
      <div 
        className="w-10 h-4 rounded-full blur-[3px] absolute bottom-0 -translate-y-1 opacity-70 transition-transform group-hover:scale-125" 
        style={{ backgroundColor: color }}
      />
      
      <div 
        className="flex flex-col items-center transition-transform duration-300 group-hover:scale-110 origin-bottom"
        style={{ transform: transformStyle }}
      >
        <div className="relative flex flex-col items-center">
          <span 
            className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider text-black mb-1 z-10"
            style={{ backgroundColor: color }}
          >
            {position}
          </span>
          
          <div className="h-12 w-12 rounded-full border-2 bg-zinc-950/90 flex items-center justify-center overflow-hidden shadow-2xl relative" style={{ borderColor: color }}>
            {player ? (
              <>
                <img
                  src={headshotUrl}
                  alt={player.name}
                  className="h-14 w-14 object-cover object-top translate-y-1.5 scale-125 transition-transform"
                  onError={(e) => {
                    (e.target as HTMLElement).style.opacity = '0';
                  }}
                />
                <span className="absolute font-black text-zinc-700 text-[10px] tracking-tighter uppercase pointer-events-none select-none z-[-1]">
                  {player.name.split(' ').map(n => n[0]).join('')}
                </span>
              </>
            ) : (
              <span className="text-[8px] text-zinc-650 font-bold uppercase tracking-wider">Empty</span>
            )}
          </div>
          
          {player && (
            <div className="mt-1.5 px-2 py-0.5 rounded bg-zinc-950/95 border border-white/10 shadow-lg max-w-[100px] text-center backdrop-blur-md">
              <span className="text-[9.5px] font-bold text-white block truncate tracking-wide select-none">{player.name}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const MatchupsPage: React.FC = () => {
  const [userTeams, setUserTeams] = useState<SavedTeam[]>([]);
  const [teamA, setTeamA] = useState<SavedTeam | null>(PRESET_TEAMS[0]);
  const [teamB, setTeamB] = useState<SavedTeam | null>(PRESET_TEAMS[1]);
  const [engineMode, setEngineMode] = useState<'statistical' | 'ml'>('statistical');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simProgress, setSimProgress] = useState(0);
  const [flipResult, setFlipResult] = useState(false);
  const [simResult, setSimResult] = useState<{
    winner: string;
    loser: string;
    scoreA: number;
    scoreB: number;
    probability: number;
    mvp: Player;
    log: string[];
    positionBattles?: Array<{ position: string; winner: string; details: string }>;
  } | null>(null);

  const [activeSelectionPanel, setActiveSelectionPanel] = useState<'A' | 'B' | null>(null);
  const [inspectPlayer, setInspectPlayer] = useState<Player | null>(null);
  const [visibleCommentary, setVisibleCommentary] = useState<string[]>([]);


  const loadData = async () => {
    try {
      const dbPlayers = await api.getPlayers();
      const dbTeams = await api.getTeams();
      if (Array.isArray(dbTeams)) {
        const mapped = dbTeams.map((t: any) => {
          const playersList = t.team_players_details || t.team_players;
          if (playersList) {
            const roster: Record<string, Player | null> = { PG: null, SG: null, SF: null, PF: null, C: null };
            playersList.forEach((tp: any) => {
              const pId = typeof tp.player === 'object' ? tp.player.id : tp.player;
              const found = dbPlayers.find(p => String(p.id) === String(pId)) || players.find(p => String(p.id) === String(pId));
              if (found) {
                roster[tp.lineup_position as 'PG' | 'SG' | 'SF' | 'PF' | 'C'] = found;
              }
            });
            return { id: t.id, name: t.name, roster };
          }
          return t;
        });
        setUserTeams(mapped);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const allAvailableTeams = [...PRESET_TEAMS, ...userTeams];

  const handleSelectTeam = (team: SavedTeam) => {
    if (activeSelectionPanel === 'A') {
      setTeamA(team);
    } else if (activeSelectionPanel === 'B') {
      setTeamB(team);
    }
    setActiveSelectionPanel(null);
  };

  const runSimulation = () => {
    if (!teamA || !teamB) {
      alert('Please select both teams!');
      return;
    }
    setIsSimulating(true);
    setSimProgress(0);
    setFlipResult(false);
    setSimResult(null);
    setVisibleCommentary([]);


    const interval = setInterval(() => {
      setSimProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 15;
      });
    }, 100);

    completeSimulation(interval);
  };

  const completeSimulation = async (intervalId: any) => {
    try {
      const idA = (teamA as any).id || teamA!.name;
      const idB = (teamB as any).id || teamB!.name;

      const res = await api.simulateMatchup(idA, idB, engineMode === 'ml' ? 'ml' : 'rule_based');
      
      clearInterval(intervalId);
      setSimProgress(100);

      const isAWinner = res.winner === teamA!.name || res.score_a > res.score_b;
      const winnerName = isAWinner ? teamA!.name : teamB!.name;
      const loserName = isAWinner ? teamB!.name : teamA!.name;

      let mvpObj = players[0];
      if (res.mvp) {
        const found = players.find(p => p.id === (typeof res.mvp === 'object' ? res.mvp.id : res.mvp));
        if (found) mvpObj = found;
      }

      // Generate Play-By-Play Commentary
      const rosterA = Object.values(teamA!.roster).filter(Boolean) as Player[];
      const rosterB = Object.values(teamB!.roster).filter(Boolean) as Player[];
      const commentary = generatePlayByPlay(
        teamA!.name,
        teamB!.name,
        rosterA,
        rosterB,
        winnerName,
        res.score_a,
        res.score_b,
        mvpObj.name
      );

      // Reveal commentary line-by-line
      let lineIdx = 0;
      const revealInterval = setInterval(() => {
        if (lineIdx < commentary.length) {
          setVisibleCommentary(prev => [...prev, commentary[lineIdx]]);
          lineIdx++;
        } else {
          clearInterval(revealInterval);
          
          setSimResult({
            winner: winnerName,
            loser: loserName,
            scoreA: res.score_a,
            scoreB: res.score_b,
            probability: isAWinner ? (res.probability_a || 58) : (res.probability_b || 42),
            mvp: mvpObj,
            log: commentary,
            positionBattles: res.position_battles
          });

          // Trigger flip reveal animation delay
          setTimeout(() => {
            setFlipResult(true);
          }, 300);

          setIsSimulating(false);
        }
      }, 850);

      // Save record
      const simulationRecord = {
        teamA: teamA!.name,
        teamB: teamB!.name,
        scoreA: res.score_a,
        scoreB: res.score_b,
        winner: winnerName,
        probability: isAWinner ? (res.probability_a || 58) : (res.probability_b || 42),
        engineMode,
        timestamp: new Date().toLocaleDateString()
      };
      const existing = localStorage.getItem('nba_simulation_logs');
      let logs = [];
      if (existing) {
        try {
          logs = JSON.parse(existing);
        } catch (e) {}
      }
      localStorage.setItem('nba_simulation_logs', JSON.stringify([simulationRecord, ...logs]));

    } catch (e) {
      console.error(e);
      alert('Error connecting simulation API.');
      setIsSimulating(false);
    }
  };

  const renderHorizontalStatBar = (label: string, value: number, max: number, colorClass: string) => {
    const pct = Math.min((value / max) * 100, 100);
    return (
      <div className="space-y-0.5">
        <div className="flex justify-between text-[8px] text-zinc-550 font-bold uppercase">
          <span>{label}</span>
          <span>{value}</span>
        </div>
        <div className="w-full bg-black/60 h-1.5 rounded-full overflow-hidden border border-white/[0.04]">
          <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${pct}%` }} />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in font-sans pr-2">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            Matchup Simulation Arena
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Select two custom rosters and run statistics or ML predictions inside the orbital cockpit.
          </p>
        </div>
      </div>

      {/* Suspended Jumbotron Console (Centered, Clean, No Skew) */}
      <div className="flex justify-center items-center w-full z-20">
        <div className="w-full max-w-lg h-[240px]">
          <div className="relative w-full h-full" style={{ perspective: '1000px', transformStyle: 'preserve-3d' }}>
            <div 
              className="w-full h-full relative"
              style={{ 
                transform: flipResult ? 'rotateY(180deg)' : 'rotateY(0deg)',
                transformStyle: 'preserve-3d',
                transition: 'transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
              }}
            >
              {/* Front Side: Control Deck / Live Ticker */}
              <div 
                className="absolute inset-0 bg-[#0B0F19]/90 border border-white/10 rounded-3xl p-5 backdrop-blur-lg flex flex-col justify-between shadow-2xl"
                style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
              >
                <div className="space-y-4">
                  {/* Subtle Engine Model Select */}
                  <div className="flex items-center justify-center gap-1.5 text-[9px] text-zinc-550 py-1 bg-zinc-950/40 rounded-xl border border-white/[0.03] max-w-[190px] mx-auto">
                    <span className="font-semibold uppercase tracking-wider text-zinc-500 scale-90">Engine:</span>
                    <button
                      onClick={() => setEngineMode('statistical')}
                      className={`px-1.5 py-0.5 rounded-lg text-[8px] font-black uppercase transition-all cursor-pointer ${
                        engineMode === 'statistical'
                          ? 'bg-zinc-900 border border-zinc-800 text-white'
                          : 'border-transparent text-zinc-550 hover:text-zinc-350'
                      }`}
                    >
                      Rule Based
                    </button>
                    <button
                      onClick={() => setEngineMode('ml')}
                      className={`px-1.5 py-0.5 rounded-lg text-[8px] font-black uppercase transition-all cursor-pointer ${
                        engineMode === 'ml'
                          ? 'bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 text-[#8B5CF6]'
                          : 'border-transparent text-zinc-550 hover:text-zinc-350'
                      }`}
                    >
                      Neural Model
                    </button>
                  </div>

                  {/* Simulation Ticker / Action */}
                  {!isSimulating && visibleCommentary.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-1">
                      <div className="relative flex justify-center items-center h-24 w-24 group animate-pulse-slow">
                        <div className="absolute inset-0 rounded-full border border-dashed border-[#8B5CF6]/30 group-hover:border-[#8B5CF6]/80 group-hover:animate-spin" style={{ animationDuration: '16s' }} />
                        <div className="absolute inset-2 rounded-full border border-dashed border-[#06B6D4]/30 group-hover:border-[#06B6D4]/80 group-hover:animate-spin" style={{ animationDuration: '8s', animationDirection: 'reverse' }} />
                        <button
                          onClick={runSimulation}
                          className="absolute inset-3 rounded-full bg-black/90 border border-white/5 hover:border-white/20 text-white hover:text-[#06B6D4] transition-all flex flex-col items-center justify-center shadow-2xl cursor-pointer"
                        >
                          <Swords className="h-4 w-4 text-zinc-400 group-hover:scale-110 transition-transform" />
                          <span className="text-[9px] font-black uppercase tracking-widest mt-0.5">Simulate</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2.5 w-full">
                      {/* Progress Bar */}
                      <div className="space-y-0.5 w-full">
                        <div className="flex justify-between items-center text-[8px] text-[#06B6D4] font-black uppercase tracking-wider">
                          <span>Jumbotron Engine</span>
                          <span>{simProgress < 100 ? `Loading: ${simProgress}%` : 'Live Play-by-Play'}</span>
                        </div>
                        <div className="w-full bg-zinc-950 border border-zinc-900 h-1 rounded-full overflow-hidden">
                          <div className="bg-gradient-to-r from-[#06B6D4] to-[#8B5CF6] h-full transition-all duration-150" style={{ width: `${simProgress}%` }} />
                        </div>
                      </div>

                      {/* Scrolling Monospaced Console */}
                      <div className="w-full bg-black/60 border border-white/[0.04] rounded-2xl p-2.5 h-[115px] overflow-y-auto text-left space-y-1.5 font-mono shadow-inner scrollbar-none">
                        {visibleCommentary.map((line, idx) => (
                          <div 
                            key={idx} 
                            className={`text-[9px] leading-relaxed animate-fade-in ${
                              idx === visibleCommentary.length - 1 ? 'text-[#06B6D4] font-bold' : 'text-zinc-550'
                            }`}
                          >
                            {line}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="text-[8px] text-zinc-650 text-center font-bold uppercase tracking-widest mb-1.5">
                  Suspended Suspense Console
                </div>
              </div>

              {/* Back Side: Scoreboard & MVP (rotated 180deg) */}
              <div 
                className="absolute inset-0 bg-[#0F1424]/95 border border-white/10 rounded-3xl p-4 backdrop-blur-xl flex flex-col justify-between shadow-2xl"
                style={{ 
                  backfaceVisibility: 'hidden', 
                  WebkitBackfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)' 
                }}
              >
                {simResult ? (
                  <div className="flex flex-col h-full justify-between space-y-2">
                    {/* Gauge Probability Matrix */}
                    <div className="text-center space-y-1 flex items-center justify-between gap-4">
                      {/* Left: Prob Graph */}
                      <div className="relative h-14 w-24 flex items-center justify-center shrink-0">
                        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 50">
                          <path d="M 10 45 A 40 40 0 0 1 90 45" fill="none" stroke="#27272a" strokeWidth="5" strokeLinecap="round" />
                          <path 
                            d="M 10 45 A 40 40 0 0 1 90 45" 
                            fill="none" 
                            stroke="#06B6D4" 
                            strokeWidth="5" 
                            strokeLinecap="round" 
                            strokeDasharray="125"
                            strokeDashoffset={125 - (125 * (simResult.probability / 100))}
                            className="transition-all duration-1000"
                          />
                        </svg>
                        <div className="text-center z-10 pt-2.5">
                          <span className="text-sm font-black text-white leading-none">{simResult.probability}%</span>
                          <p className="text-[6px] text-[#06B6D4] font-bold uppercase tracking-wider">Court Efficiency</p>
                        </div>
                      </div>

                      {/* Right: Scores */}
                      <div className="text-right flex-grow">
                        <h3 className="text-xs font-black text-white uppercase tracking-tight truncate">{simResult.winner} Wins!</h3>
                        <div className="flex justify-end gap-2.5 text-xs font-black text-white mt-0.5">
                          <span className="text-[#06B6D4]">{simResult.scoreA}</span>
                          <span className="text-zinc-650">vs</span>
                          <span className="text-[#F59E0B]">{simResult.scoreB}</span>
                        </div>
                      </div>
                    </div>

                    {/* MVP card */}
                    <div className="p-2 bg-black/40 border border-white/[0.04] rounded-xl flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-zinc-900 border border-zinc-850 flex items-center justify-center font-black text-[#06B6D4] text-[9px]">
                        {simResult.mvp.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="min-w-0 flex-1 text-left">
                        <span className="text-[6px] text-[#F59E0B] font-bold uppercase block">Simulation MVP</span>
                        <h4 className="text-[9px] font-black text-white leading-tight truncate">{simResult.mvp.name}</h4>
                      </div>
                    </div>

                    {/* Play-again reset button */}
                    <button
                      onClick={() => {
                        setFlipResult(false);
                        setSimResult(null);
                        setVisibleCommentary([]);
                      }}
                      className="w-full py-2 rounded-xl bg-white hover:bg-zinc-200 text-black font-extrabold text-[9px] uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      Reset Arena Matchup
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-xs text-zinc-500">
                    Empty Scoreboard
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3D double court arena - Side by Side (No overlays in center!) */}
      <div 
        className="relative w-full min-h-[480px] rounded-3xl border border-white/5 bg-[#080d1a]/20 backdrop-blur-xl overflow-hidden p-6 flex flex-col justify-between"
        style={{ perspective: '1200px', transformStyle: 'preserve-3d' }}
      >
        {/* Top Header inside Arena */}
        <div className="flex justify-between items-center z-10 w-full mb-4">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-widest text-[#06B6D4] font-black">Team Alpha</span>
            <h3 className="text-xl font-black text-white truncate max-w-[200px]">{teamA ? teamA.name : 'Select Team A'}</h3>
            <button 
              onClick={() => setActiveSelectionPanel('A')}
              className="text-[9px] text-[#06B6D4] font-bold uppercase tracking-wider hover:text-white mt-1 border border-[#06B6D4]/30 px-2 py-1 rounded-lg bg-[#06B6D4]/5 transition-all text-left w-fit cursor-pointer"
            >
              Change Team
            </button>
          </div>
          
          <div className="flex flex-col items-end gap-1">
            <span className="text-[10px] uppercase tracking-widest text-[#F59E0B] font-black">Team Beta</span>
            <h3 className="text-xl font-black text-white truncate max-w-[200px] text-right">{teamB ? teamB.name : 'Select Team B'}</h3>
            <button 
              onClick={() => setActiveSelectionPanel('B')}
              className="text-[9px] text-[#F59E0B] font-bold uppercase tracking-wider hover:text-white mt-1 border border-[#F59E0B]/30 px-2 py-1 rounded-lg bg-[#F59E0B]/5 transition-all text-right w-fit cursor-pointer"
            >
              Change Team
            </button>
          </div>
        </div>

        {/* 3D Scene Viewport */}
        <div className="relative flex-grow flex items-center justify-between w-full h-[400px] overflow-visible" style={{ transformStyle: 'preserve-3d' }}>
          {/* Team Alpha Tilted Court (49% Width, full visibility) */}
          <div 
            className="absolute left-0 w-[49%] h-[380px] rounded-3xl transition-all duration-700"
            style={{
              transform: 'rotateX(55deg) rotateY(0deg) translateZ(0px)',
              transformStyle: 'preserve-3d',
              background: 'radial-gradient(circle at center, #0e172a 0%, #030712 100%)',
              border: '1px solid rgba(6, 182, 212, 0.15)',
              boxShadow: '0 25px 60px rgba(6, 182, 212, 0.04)'
            }}
          >
            <CourtMarkings color="#06B6D4" />
            <Hoop color="#06B6D4" transformStyle="rotateX(-55deg) rotateY(0deg)" />
            {Object.entries(teamA?.roster || { PG: null, SG: null, SF: null, PF: null, C: null }).map(([pos, player]) => (
              <PlayerNode
                key={pos}
                player={player}
                position={pos}
                color="#06B6D4"
                transformStyle="rotateX(-55deg) rotateY(0deg)"
                onClick={() => player && setInspectPlayer(player)}
              />
            ))}
          </div>

          {/* Team Beta Tilted Court (49% Width, full visibility) */}
          <div 
            className="absolute right-0 w-[49%] h-[380px] rounded-3xl transition-all duration-700"
            style={{
              transform: 'rotateX(55deg) rotateY(0deg) translateZ(0px)',
              transformStyle: 'preserve-3d',
              background: 'radial-gradient(circle at center, #0e172a 0%, #030712 100%)',
              border: '1px solid rgba(245, 158, 11, 0.15)',
              boxShadow: '0 25px 60px rgba(245, 158, 11, 0.04)'
            }}
          >
            <CourtMarkings color="#F59E0B" />
            <Hoop color="#F59E0B" transformStyle="rotateX(-55deg) rotateY(0deg)" />
            {Object.entries(teamB?.roster || { PG: null, SG: null, SF: null, PF: null, C: null }).map(([pos, player]) => (
              <PlayerNode
                key={pos}
                player={player}
                position={pos}
                color="#F59E0B"
                transformStyle="rotateX(-55deg) rotateY(0deg)"
                onClick={() => player && setInspectPlayer(player)}
              />
            ))}
          </div>
        </div>

        {/* Lower layout showing Positional Battles & Log below the arena once simulation finishes */}
        {simResult && flipResult && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-white/5 z-10 animate-fade-in">
            {/* Positional Battles */}
            {simResult.positionBattles && (
              <div className="space-y-3 bg-[#0B0F19]/40 border border-white/5 rounded-3xl p-5 shadow-inner">
                <span className="text-[10px] text-zinc-400 font-black uppercase tracking-widest block">Positional Battles Matchups</span>
                <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
                  {simResult.positionBattles.map((battle, idx) => {
                    const playerA = teamA?.roster[battle.position as 'PG' | 'SG' | 'SF' | 'PF' | 'C'];
                    const playerB = teamB?.roster[battle.position as 'PG' | 'SG' | 'SF' | 'PF' | 'C'];
                    const isWinnerA = battle.winner === 'Team A' || battle.winner === teamA?.name;
                    
                    return (
                      <div key={idx} className="flex flex-col gap-1 p-2.5 rounded-xl bg-black/30 border border-white/[0.03] hover:border-white/10 transition-all text-xs">
                        <div className="flex items-center justify-between font-bold">
                          <span className="text-[10px] font-black text-zinc-550 uppercase">{battle.position}</span>
                          <div className="flex items-center gap-2 text-white">
                            <span className={isWinnerA ? 'text-[#06B6D4] font-black' : 'text-zinc-600'}>
                              {playerA ? playerA.name : 'Roster Alpha'}
                            </span>
                            <span className="text-[#F59E0B] font-black mx-1">
                              {isWinnerA ? '>' : '<'}
                            </span>
                            <span className={!isWinnerA ? 'text-[#F59E0B] font-black' : 'text-zinc-600'}>
                              {playerB ? playerB.name : 'Roster Beta'}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] text-zinc-550 leading-normal">{battle.details}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* AI Explanation Log */}
            <div className="space-y-3 bg-[#0B0F19]/40 border border-white/5 rounded-3xl p-5 shadow-inner flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-[#F59E0B] font-black uppercase tracking-widest block mb-3">Simulation Performance Log</span>
                <div className="text-[10px] text-zinc-400 leading-relaxed font-mono whitespace-pre-wrap max-h-[210px] overflow-y-auto pr-1">
                  {simResult.log.join('\n')}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Drawer Overlay for team selection portal */}
      {activeSelectionPanel && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-zinc-950 border border-white/5 p-6 space-y-6 animate-scale-in shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-white font-display">Select Roster</h3>
                <p className="text-xs text-zinc-500">Choose from preset builds or your custom designs</p>
              </div>
              <button
                onClick={() => setActiveSelectionPanel(null)}
                className="p-2 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
              {allAvailableTeams.map((team, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectTeam(team)}
                  className="flex items-center justify-between p-4 rounded-2xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-850 hover:border-zinc-700 transition-all cursor-pointer group"
                >
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-[#06B6D4] transition-colors">
                      {team.name}
                    </h4>
                    <p className="text-[10px] text-zinc-500">Roster populated</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-zinc-500 group-hover:text-white transition-colors" />
                </div>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Roster Player Stats Detail Inspector Modal */}
      {inspectPlayer && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in">
          <div className="relative w-full max-w-xl rounded-3xl bg-[#0B0F19] border border-white/10 p-8 shadow-2xl space-y-6 animate-scale-in">
            {/* Ambient Background Radial */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-56 h-56 rounded-full bg-brand-blue/10 blur-[80px]" />
            
            <button
              onClick={() => setInspectPlayer(null)}
              className="absolute top-5 right-5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Profile Info Header */}
            <div className="flex gap-5 items-center relative z-10">
              <div className="h-24 w-24 rounded-2xl bg-[#18181b] border border-white/10 flex items-center justify-center relative overflow-hidden shadow-lg">
                <img
                  src={`https://cdn.nba.com/headshots/nba/latest/1040x760/${getRealNbaId(inspectPlayer.id)}.png`}
                  alt={inspectPlayer.name}
                  className="h-28 w-28 object-cover object-top translate-y-2.5 scale-125"
                  onError={(e) => {
                    (e.target as HTMLElement).style.opacity = '0';
                  }}
                />
                {/* Fallback initials if headshot image fails */}
                <span className="absolute font-black text-zinc-750 text-xl tracking-tighter uppercase pointer-events-none select-none z-[-1]">
                  {inspectPlayer.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-cyber-cyan font-black uppercase tracking-wider bg-cyber-cyan/10 px-2 py-0.5 rounded border border-cyber-cyan/25">
                  {inspectPlayer.era}
                </span>
                <h3 className="text-2xl font-black text-white leading-tight mt-1">{inspectPlayer.name}</h3>
                <p className="text-xs text-zinc-400">Position: {inspectPlayer.id.split('-')[1]?.toUpperCase() || 'PLAYER'}</p>
              </div>
            </div>

            {/* Primary Stats Grid */}
            <div className="grid grid-cols-3 gap-4 relative z-10">
              <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.04] text-center space-y-1.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Points Per Game</span>
                <p className="text-3xl font-black text-cyber-cyan tracking-tight">{inspectPlayer.ppg}</p>
                <span className="text-[9px] text-zinc-650 font-bold block">PPG Baseline</span>
              </div>
              <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.04] text-center space-y-1.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Rebounds Per Game</span>
                <p className="text-3xl font-black text-[#8B5CF6] tracking-tight">{inspectPlayer.rpg}</p>
                <span className="text-[9px] text-zinc-650 font-bold block">RPG Baseline</span>
              </div>
              <div className="p-4 rounded-2xl bg-[#F59E0B]/10 border border-[#F59E0B]/20 text-center space-y-1.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-gold">True Shooting</span>
                <p className="text-3xl font-black text-amber-gold tracking-tight">{inspectPlayer.ts}%</p>
                <span className="text-[9px] text-amber-gold/60 font-bold block">TS% Efficiency</span>
              </div>
            </div>

            {/* Advanced Basketball Attributes */}
            <div className="rounded-2xl p-5 bg-black/40 border border-white/[0.04] space-y-4 relative z-10 text-xs">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Court Metrics</span>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex justify-between items-center py-1 border-b border-white/[0.02]">
                  <span className="text-zinc-400">Assists Per Game</span>
                  <span className="font-extrabold text-white">{inspectPlayer.apg} APG</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-white/[0.02]">
                  <span className="text-zinc-400">Net Roster Rating</span>
                  <span className="font-extrabold text-white">+{inspectPlayer.netRating || '0.0'} NET</span>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

