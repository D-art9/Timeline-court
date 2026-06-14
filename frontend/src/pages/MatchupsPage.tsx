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

      setSimResult({
        winner: winnerName,
        loser: loserName,
        scoreA: res.score_a,
        scoreB: res.score_b,
        probability: isAWinner ? (res.probability_a || 58) : (res.probability_b || 42),
        mvp: mvpObj,
        log: [
          `Tip-off won by ${winnerName}.`,
          `Positional Battles: Matchup system run with ${engineMode} matrix.`,
          ...res.position_battles.map((b: any) => `Position: ${b.position} winner: ${b.winner} (${b.details})`),
          `Final Score: ${teamA!.name} ${res.score_a} - ${teamB!.name} ${res.score_b}.`
        ],
        positionBattles: res.position_battles
      });

      // Trigger flip reveal animation delay
      setTimeout(() => {
        setFlipResult(true);
      }, 300);

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
    } finally {
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

      {/* Main Asymmetrical Cockpit Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Team Alpha (Left Roster Card) */}
        <div className="lg:col-span-4 rounded-3xl border border-[#06B6D4]/15 bg-[#0B0F19]/40 backdrop-blur-xl p-5 space-y-6 shadow-[0_0_50px_rgba(6,182,212,0.02)]">
          <div className="pb-3 border-b border-[#06B6D4]/15">
            <span className="text-[9px] uppercase tracking-widest text-[#06B6D4] font-black">Roster Alpha</span>
            <h3 className="text-lg font-black text-white truncate">{teamA ? teamA.name : 'Select Team A'}</h3>
          </div>

          <div className="space-y-4">
            {teamA && Object.entries(teamA.roster).map(([pos, player]) => (
              <div
                key={pos}
                onClick={() => player && setInspectPlayer(player)}
                className={`p-3.5 rounded-2xl bg-zinc-950/40 border border-zinc-900/60 hover:border-[#06B6D4]/30 hover:bg-zinc-900/40 transition-all space-y-3 ${player ? 'cursor-pointer' : ''}`}
              >
                <div className="flex justify-between items-center pb-2 border-b border-zinc-900">
                  <span className="text-xs font-black text-[#06B6D4] uppercase">{pos}</span>
                  <span className="text-xs font-bold text-white truncate max-w-[130px] group-hover:text-[#06B6D4]">{player ? player.name : 'Empty Slot'}</span>
                </div>

                {player ? (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    {renderHorizontalStatBar('PPG', player.ppg, 35, 'bg-gradient-to-r from-[#06B6D4] to-cyan-600')}
                    {renderHorizontalStatBar('RPG', player.rpg, 25, 'bg-gradient-to-r from-[#06B6D4] to-cyan-600')}
                    {renderHorizontalStatBar('APG', player.apg, 15, 'bg-gradient-to-r from-[#06B6D4] to-cyan-600')}
                    {renderHorizontalStatBar('TS%', player.ts, 100, 'bg-gradient-to-r from-[#06B6D4] to-cyan-600')}
                  </div>
                ) : (
                  <p className="text-[10px] text-zinc-650 italic">No player assigned to this position</p>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={() => setActiveSelectionPanel('A')}
            className="w-full py-3.5 rounded-xl border border-[#06B6D4]/20 hover:border-[#06B6D4]/50 bg-zinc-950/60 hover:bg-zinc-950 text-xs font-bold text-zinc-300 hover:text-white transition-all cursor-pointer uppercase tracking-wider"
          >
            Change Team Alpha
          </button>
        </div>

        {/* Central Orbital Control Deck */}
        <div className="lg:col-span-4 flex flex-col items-center justify-center space-y-6">
          <div className="bg-[#0B0F19]/85 border border-white/5 rounded-3xl p-6 w-full backdrop-blur-md space-y-6 text-center relative overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-[radial-gradient(#8B5CF6_0.5px,transparent_0.5px)] bg-[size:16px_16px] opacity-10 pointer-events-none" />

            {/* Toggle switch between engine types */}
            <div className="space-y-2">
              <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold block">Engine Model</span>
              <div className="flex bg-zinc-950 border border-zinc-900 p-1 rounded-2xl w-full max-w-[280px] mx-auto">
                <button
                  onClick={() => setEngineMode('statistical')}
                  className={`flex-1 text-center py-2 text-[10px] font-black uppercase rounded-xl transition-all cursor-pointer ${
                    engineMode === 'statistical'
                      ? 'bg-zinc-900 text-white shadow-inner border border-zinc-800'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  Stat Matrix
                </button>
                <button
                  onClick={() => setEngineMode('ml')}
                  className={`flex-1 text-center py-2 text-[10px] font-black uppercase rounded-xl transition-all cursor-pointer ${
                    engineMode === 'ml'
                      ? 'bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 text-[#8B5CF6]'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  Neural ML
                </button>
              </div>
            </div>

            {/* Circular Orbit Button */}
            <div className="relative flex justify-center items-center h-44 w-44 mx-auto my-4 group animate-pulse-slow">
              {/* Spinning neon hover ring */}
              <div className="absolute inset-0 rounded-full border border-dashed border-[#8B5CF6]/20 group-hover:border-[#8B5CF6]/80 group-hover:animate-spin" style={{ animationDuration: '16s' }} />
              <div className="absolute inset-2 rounded-full border border-dashed border-[#06B6D4]/20 group-hover:border-[#06B6D4]/80 group-hover:animate-spin" style={{ animationDuration: '8s', animationDirection: 'reverse' }} />

              <button
                onClick={runSimulation}
                disabled={isSimulating}
                className="absolute inset-5 rounded-full bg-black/80 border border-white/5 hover:border-white/20 text-white hover:text-[#06B6D4] transition-all flex flex-col items-center justify-center gap-1 shadow-2xl cursor-pointer disabled:opacity-50"
              >
                <Swords className="h-6 w-6 text-zinc-400 group-hover:scale-115 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-widest mt-1">Simulate</span>
              </button>
            </div>

            {/* Active Simulation Loading Ticks */}
            {isSimulating && (
              <div className="space-y-2 py-2 animate-pulse">
                <span className="text-[9px] text-[#06B6D4] font-black uppercase tracking-widest">Orbital Compute: {simProgress}%</span>
                <div className="w-full max-w-[180px] bg-zinc-950 border border-zinc-900 h-1.5 rounded-full overflow-hidden mx-auto">
                  <div className="bg-gradient-to-r from-[#06B6D4] to-[#8B5CF6] h-full transition-all duration-150" style={{ width: `${simProgress}%` }} />
                </div>
              </div>
            )}
          </div>

          {/* Simulation Flip Reveal Outcome Panel */}
          <div className="w-full perspective-[1000px]">
            {simResult && (
              <div 
                className={`w-full bg-[#0F1424]/90 border border-white/[0.03] rounded-3xl p-5 backdrop-blur-xl space-y-6 transition-all duration-700 transform shadow-2xl ${
                  flipResult ? 'rotateY-0 scale-100 opacity-100' : 'rotateY-90 scale-95 opacity-0 pointer-events-none'
                }`}
              >
                {/* 1. Double-gauge radial progress chart (win probabilities) */}
                <div className="text-center space-y-4">
                  <span className="text-[9px] text-zinc-550 font-bold uppercase tracking-widest block">Probability Matrix</span>
                  
                  {/* Gauge Drawing in SVG */}
                  <div className="relative h-24 w-44 mx-auto flex items-center justify-center">
                    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 50">
                      {/* Arc Base */}
                      <path d="M 10 45 A 40 40 0 0 1 90 45" fill="none" stroke="#27272a" strokeWidth="6" strokeLinecap="round" />
                      {/* Team A (Cyan) Progress Arc */}
                      <path 
                        d="M 10 45 A 40 40 0 0 1 90 45" 
                        fill="none" 
                        stroke="#06B6D4" 
                        strokeWidth="6" 
                        strokeLinecap="round" 
                        strokeDasharray="125"
                        strokeDashoffset={125 - (125 * (simResult.probability / 100))}
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <div className="text-center z-10 pt-4">
                      <span className="text-2xl font-black text-white leading-none">{simResult.probability}%</span>
                      {/* Win Share renamed to basketball-centric COURT EFFICIENCY */}
                      <p className="text-[9px] text-cyber-cyan font-bold uppercase tracking-widest mt-1">Court Efficiency</p>
                    </div>
                  </div>

                  <h3 className="text-lg font-black text-white uppercase tracking-tight">{simResult.winner} WINS!</h3>
                  <div className="flex justify-center gap-4 text-xs font-black text-white pt-2">
                    <span className="text-[#06B6D4]">{simResult.scoreA}</span>
                    <span className="text-zinc-650">vs</span>
                    <span className="text-[#F59E0B]">{simResult.scoreB}</span>
                  </div>
                </div>

                {/* MVP card */}
                <div className="p-3 bg-black/40 border border-white/[0.04] rounded-2xl flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-zinc-900 border border-zinc-850 flex items-center justify-center font-black text-[#06B6D4] text-xs">
                    {simResult.mvp.headshot}
                  </div>
                  <div>
                    <span className="text-[8px] text-[#F59E0B] font-bold uppercase">Simulation MVP</span>
                    <h4 className="text-xs font-black text-white leading-tight">{simResult.mvp.name}</h4>
                  </div>
                </div>

                {/* Matchup battles comparison section: Team A vs Team B details */}
                {simResult.positionBattles && (
                  <div className="space-y-3 border-t border-white/[0.04] pt-5">
                    <span className="text-[10px] text-zinc-400 font-black uppercase tracking-widest block mb-1">Positional Battles Matchups</span>
                    <div className="space-y-3">
                      {simResult.positionBattles.map((battle, idx) => {
                        const playerA = teamA?.roster[battle.position as 'PG' | 'SG' | 'SF' | 'PF' | 'C'];
                        const playerB = teamB?.roster[battle.position as 'PG' | 'SG' | 'SF' | 'PF' | 'C'];
                        const isWinnerA = battle.winner === 'Team A' || battle.winner === teamA?.name;
                        
                        return (
                          <div key={idx} className="flex flex-col gap-1.5 p-3 rounded-2xl bg-black/30 border border-white/[0.03] hover:border-white/10 transition-all">
                            <div className="flex items-center justify-between text-sm font-extrabold">
                              <span className="text-sm font-black text-zinc-500 uppercase">{battle.position}</span>
                              <div className="flex items-center gap-2.5 text-white">
                                <span className={isWinnerA ? 'text-cyber-cyan font-black text-base' : 'text-zinc-550'}>
                                  {playerA ? playerA.name : 'Roster Alpha'}
                                </span>
                                <span className="text-amber-gold font-black text-lg mx-1.5">
                                  {isWinnerA ? '>' : '<'}
                                </span>
                                <span className={!isWinnerA ? 'text-amber-gold font-black text-base' : 'text-zinc-550'}>
                                  {playerB ? playerB.name : 'Roster Beta'}
                                </span>
                              </div>
                            </div>
                            <span className="text-xs text-zinc-400 font-medium">{battle.details}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 2. AI Explanation box (Structured Markdown) */}
                <div className="p-4 bg-black/40 border border-white/[0.04] rounded-2xl max-h-[140px] overflow-y-auto pr-1">
                  <span className="text-[9px] text-zinc-550 font-black uppercase tracking-widest block mb-2">Analyst Matrix Log</span>
                  <div className="text-[10px] text-zinc-400 leading-relaxed whitespace-pre-wrap">
                    {simResult.log.join('\n')}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Team Beta (Right Roster Card) */}
        <div className="lg:col-span-4 rounded-3xl border border-[#F59E0B]/15 bg-[#0B0F19]/40 backdrop-blur-xl p-5 space-y-6 shadow-[0_0_50px_rgba(245,158,11,0.02)]">
          <div className="pb-3 border-b border-[#F59E0B]/15">
            <span className="text-[9px] uppercase tracking-widest text-[#F59E0B] font-black">Roster Beta</span>
            <h3 className="text-lg font-black text-white truncate">{teamB ? teamB.name : 'Select Team B'}</h3>
          </div>

          <div className="space-y-4">
            {teamB && Object.entries(teamB.roster).map(([pos, player]) => (
              <div
                key={pos}
                onClick={() => player && setInspectPlayer(player)}
                className={`p-3.5 rounded-2xl bg-zinc-950/40 border border-zinc-900/60 hover:border-[#F59E0B]/30 hover:bg-zinc-900/40 transition-all space-y-3 ${player ? 'cursor-pointer' : ''}`}
              >
                <div className="flex justify-between items-center pb-2 border-b border-zinc-900">
                  <span className="text-xs font-black text-[#F59E0B] uppercase">{pos}</span>
                  <span className="text-xs font-bold text-white truncate max-w-[130px] group-hover:text-[#F59E0B]">{player ? player.name : 'Empty Slot'}</span>
                </div>

                {player ? (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    {renderHorizontalStatBar('PPG', player.ppg, 35, 'bg-gradient-to-r from-[#F59E0B] to-amber-600')}
                    {renderHorizontalStatBar('RPG', player.rpg, 25, 'bg-gradient-to-r from-[#F59E0B] to-amber-600')}
                    {renderHorizontalStatBar('APG', player.apg, 15, 'bg-gradient-to-r from-[#F59E0B] to-amber-600')}
                    {renderHorizontalStatBar('TS%', player.ts, 100, 'bg-gradient-to-r from-[#F59E0B] to-amber-600')}
                  </div>
                ) : (
                  <p className="text-[10px] text-zinc-650 italic">No player assigned to this position</p>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={() => setActiveSelectionPanel('B')}
            className="w-full py-3.5 rounded-xl border border-[#F59E0B]/20 hover:border-[#F59E0B]/50 bg-zinc-950/60 hover:bg-zinc-950 text-xs font-bold text-zinc-300 hover:text-white transition-all cursor-pointer uppercase tracking-wider"
          >
            Change Team Beta
          </button>
        </div>

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
                  src={`https://cdn.nba.com/headshots/nba/latest/1040x760/${inspectPlayer.id.split('-')[0]}.png`}
                  alt={inspectPlayer.name}
                  className="h-28 w-28 object-cover object-top translate-y-2.5 scale-125"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
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

