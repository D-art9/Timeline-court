import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { ExternalLink, Award, Shield, Zap, X } from 'lucide-react';

interface Player {
  id: string;
  name: string;
  team: string;
  position: string;
  role: string;
  stats: {
    ppg: number;
    rpg: number;
    apg: number;
    bpg?: number;
    spg?: number;
  };
}

const playersList: Player[] = [
  {
    id: '2544',
    name: 'LeBron James',
    team: 'Lakers',
    position: 'Forward',
    role: 'Point Forward / Playmaker',
    stats: { ppg: 25.7, rpg: 7.3, apg: 8.3, spg: 1.3 },
  },
  {
    id: '201939',
    name: 'Stephen Curry',
    team: 'Warriors',
    position: 'Guard',
    role: 'Primary Sharpshooter / Off-ball threat',
    stats: { ppg: 26.4, rpg: 4.5, apg: 5.1, spg: 0.9 },
  },
  {
    id: '201142',
    name: 'Kevin Durant',
    team: 'Suns',
    position: 'Forward',
    role: 'Elite Scoring Specialist',
    stats: { ppg: 27.1, rpg: 6.6, apg: 5.0, bpg: 1.2 },
  },
  {
    id: '203999',
    name: 'Nikola Jokic',
    team: 'Nuggets',
    position: 'Center',
    role: 'Facilitator Center / Post Playmaker',
    stats: { ppg: 26.4, rpg: 12.4, apg: 9.0, spg: 1.4 },
  },
  {
    id: '1629029',
    name: 'Luka Doncic',
    team: 'Mavericks',
    position: 'Guard-Forward',
    role: 'Heliocentric Offensive Engine',
    stats: { ppg: 33.9, rpg: 9.2, apg: 9.8, spg: 1.4 },
  },
  {
    id: '203507',
    name: 'Giannis Antetokounmpo',
    team: 'Bucks',
    position: 'Forward',
    role: 'Paint Dominator / Transition Finisher',
    stats: { ppg: 30.4, rpg: 11.5, apg: 6.5, bpg: 1.1 },
  },
  {
    id: '1628369',
    name: 'Jayson Tatum',
    team: 'Celtics',
    position: 'Forward',
    role: 'Two-Way Scoring Wing',
    stats: { ppg: 26.9, rpg: 8.1, apg: 4.9, spg: 1.0 },
  },
  {
    id: '203076',
    name: 'Anthony Davis',
    team: 'Lakers',
    position: 'Forward-Center',
    role: 'Defensive Anchor / Roller',
    stats: { ppg: 24.7, rpg: 12.6, apg: 3.5, bpg: 2.3 },
  },
];

export const PlayerTicker: React.FC = () => {
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [hoveredPlayerId, setHoveredPlayerId] = useState<string | null>(null);

  // Duplicating the list to create a seamless vertical scroll loop
  const scrollList = [...playersList, ...playersList];

  return (
    <div className="relative flex flex-col h-[calc(100vh-120px)] w-full bg-transparent overflow-hidden px-1">
      {/* Title */}
      <div className="mb-6 pb-3 z-10 border-b border-zinc-850">
        <h3 className="text-sm font-black uppercase tracking-widest text-brand-offwhite flex items-center gap-2">
          <Award className="h-4.5 w-4.5 text-brand-blue" />
          Featured Stars
        </h3>
        <p className="text-[10px] text-brand-offwhite/40 mt-1">Hover to freeze • Click to inspect</p>
      </div>

      {/* Scrolling container */}
      <div className="relative flex-grow overflow-hidden">
        {/* Top & Bottom shadows blending with main page dark background #09090b */}
        <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-[#0B0F19] to-transparent z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#0B0F19] to-transparent z-10 pointer-events-none" />

        <div className="flex flex-col gap-4 py-4 animate-scroll-y hover:[animation-play-state:paused]">
          {scrollList.map((player, idx) => (
            <div
              key={`${player.id}-${idx}`}
              onMouseEnter={() => setHoveredPlayerId(player.id)}
              onMouseLeave={() => setHoveredPlayerId(null)}
              onClick={() => setSelectedPlayer(player)}
              className="group flex items-center gap-4 rounded-2xl hover:bg-zinc-900/60 hover:border-zinc-800 border border-transparent p-2.5 pr-5 transition-all duration-300 cursor-pointer relative shadow-sm hover:shadow-brand-blue/5"
            >
              {/* Circular Player Headshot */}
              <div
                className="h-14 w-14 shrink-0 rounded-full overflow-hidden flex items-center justify-center relative shadow-md group-hover:border-brand-blue transition-all duration-300"
                style={{ backgroundColor: '#18181b', border: '2px solid #27272a' }}
              >
                <img
                  src={`https://cdn.nba.com/headshots/nba/latest/1040x760/${player.id}.png`}
                  alt={player.name}
                  className="h-16 w-16 object-cover object-top translate-y-1 scale-125"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>

              {/* Player Name and Team */}
              <div className="flex-grow overflow-hidden">
                <h4 className="text-xs font-black text-brand-offwhite group-hover:text-white truncate uppercase tracking-tight">
                  {player.name}
                </h4>
                <p className="text-[9px] text-zinc-500 truncate uppercase font-bold tracking-widest mt-0.5">{player.team}</p>
              </div>

              {/* Hover Tooltip Popup Indicator - Shifted to LEFT because ticker is stuck to the RIGHT */}
              {hoveredPlayerId === player.id && (
                <div
                  className="absolute right-full mr-5 top-1/2 -translate-y-1/2 z-50 w-72 rounded-3xl p-5 shadow-2xl pointer-events-none animate-fade-in bg-zinc-950/95 border border-zinc-850/80 backdrop-blur-xl"
                >
                  <div className="flex items-center gap-3.5 mb-3">
                    <div
                      className="h-12 w-12 shrink-0 rounded-full overflow-hidden flex items-center justify-center border border-zinc-800"
                      style={{ backgroundColor: '#000000' }}
                    >
                      <img
                        src={`https://cdn.nba.com/headshots/nba/latest/1040x760/${player.id}.png`}
                        className="h-14 w-14 object-cover object-top translate-y-1 scale-125"
                        alt={player.name}
                      />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white">{player.name}</h4>
                      <p className="text-[9px] text-brand-offwhite/50 tracking-wider mt-0.5 uppercase">{player.position}</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-[10px]">
                    <div className="flex justify-between pb-1.5 border-b border-zinc-900">
                      <span className="text-brand-offwhite/40">Role</span>
                      <span className="text-brand-offwhite font-bold text-right">{player.role.split(' / ')[0]}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-brand-offwhite/40">PPG / RPG / APG</span>
                      <span className="text-brand-blue font-black">
                        {player.stats.ppg} / {player.stats.rpg} / {player.stats.apg}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Detail Inspector Modal - Rendered at Root body using Portal to bypass CSS Stacking Context */}
      {selectedPlayer && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in">
          <div
            className="relative w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-6 animate-scale-in"
            style={{ backgroundColor: '#18181b', border: '1px solid #27272a' }}
          >
            {/* Close */}
            <button
              onClick={() => setSelectedPlayer(null)}
              className="absolute top-4 right-4 text-brand-offwhite/60 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Profile Info */}
            <div className="flex gap-4 items-center">
              <div
                className="h-20 w-20 rounded-2xl overflow-hidden flex items-center justify-center"
                style={{ backgroundColor: '#000000', border: '1px solid #27272a' }}
              >
                <img
                  src={`https://cdn.nba.com/headshots/nba/latest/1040x760/${selectedPlayer.id}.png`}
                  alt={selectedPlayer.name}
                  className="h-24 w-24 object-cover object-top translate-y-1.5 scale-125"
                />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white leading-none">{selectedPlayer.name}</h3>
                <p className="text-xs text-brand-offwhite/70">{selectedPlayer.team} • {selectedPlayer.position}</p>
                <span className="inline-flex items-center gap-1 rounded bg-brand-blue/10 border border-brand-blue/20 px-2.5 py-0.5 text-[10px] font-bold text-brand-blue">
                  <Shield className="h-3 w-3" />
                  {selectedPlayer.role}
                </span>
              </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-3 gap-3">
              <div
                className="p-3 rounded-2xl text-center space-y-1"
                style={{ backgroundColor: '#09090b', border: '1px solid #27272a' }}
              >
                <span className="text-[10px] uppercase font-bold tracking-wider text-brand-offwhite/50">Points</span>
                <p className="text-xl font-extrabold text-brand-blue">{selectedPlayer.stats.ppg}</p>
                <span className="text-[8px] text-brand-offwhite/40">Per Game</span>
              </div>
              <div
                className="p-3 rounded-2xl text-center space-y-1"
                style={{ backgroundColor: '#09090b', border: '1px solid #27272a' }}
              >
                <span className="text-[10px] uppercase font-bold tracking-wider text-brand-offwhite/50">Rebounds</span>
                <p className="text-xl font-extrabold text-brand-green">{selectedPlayer.stats.rpg}</p>
                <span className="text-[8px] text-brand-offwhite/40">Per Game</span>
              </div>
              <div
                className="p-3 rounded-2xl text-center space-y-1"
                style={{ backgroundColor: '#09090b', border: '1px solid #27272a' }}
              >
                <span className="text-[10px] uppercase font-bold tracking-wider text-brand-offwhite/50">Assists</span>
                <p className="text-xl font-extrabold text-brand-purple">{selectedPlayer.stats.apg}</p>
                <span className="text-[8px] text-brand-offwhite/40">Per Game</span>
              </div>
            </div>

            {/* Extra attributes */}
            <div
              className="rounded-2xl p-4 space-y-3.5"
              style={{ backgroundColor: 'rgba(9, 9, 11, 0.4)', border: '1px solid #27272a' }}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="text-brand-offwhite/60 flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-brand-orange" />
                  Efficiency Index
                </span>
                <span className="font-bold text-brand-offwhite">A+ Rating</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-brand-offwhite/60">Playstyle Classification</span>
                <span className="font-bold text-brand-offwhite">{selectedPlayer.role.split(' / ')[0]}</span>
              </div>
            </div>

            {/* Button Link to NBA website */}
            <a
              href={`https://www.nba.com/player/${selectedPlayer.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full rounded-xl bg-white hover:bg-brand-lightgray py-3 text-xs font-bold text-black transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              View Full Stats on NBA.com
            </a>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
