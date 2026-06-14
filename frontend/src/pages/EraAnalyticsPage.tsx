import React, { useState, useRef, useCallback } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Cpu, Info, Zap, Clock, TrendingUp, ChevronDown } from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
interface PlayerNode {
  id: number;
  name: string;
  cluster: number;
  era: 'Early Modern' | 'Pace Transition' | 'Three-Point Era';
  position: 'PG' | 'SG' | 'SF' | 'PF' | 'C';
  nx: number; // normalised x [0,1]
  ny: number; // normalised y [0,1]
  ppg: number;
  rpg: number;
  apg: number;
  attrs: string[];
}

interface ViewBox { x: number; y: number; w: number; h: number; }

// ─────────────────────────────────────────────────────────────
// Static Config
// ─────────────────────────────────────────────────────────────
const VB_W = 1000;
const VB_H = 620;
const PAD  = 64;
const PW   = VB_W - 2 * PAD;
const PH   = VB_H - 2 * PAD;

const CLUSTER_DEFS: Record<number, { name: string; color: string; bg: string; desc: string }> = {
  0: { name: 'Elite Perimeter Scorers',   color: '#06B6D4', bg: 'rgba(6,182,212,0.07)',  desc: 'High-volume shot creators with elite efficiency from the perimeter.' },
  1: { name: 'Dominant Big Men',           color: '#8B5CF6', bg: 'rgba(139,92,246,0.07)', desc: 'Interior forces who control the paint on both ends of the floor.' },
  2: { name: '3-and-D Wings',              color: '#10B981', bg: 'rgba(16,185,129,0.07)', desc: 'Elite defenders who reliably hit catch-and-shoot threes.' },
  3: { name: 'High-Usage Superstars',      color: '#F59E0B', bg: 'rgba(245,158,11,0.07)', desc: 'All-time greats who carry franchises with unmatched usage & impact.' },
  4: { name: 'Versatile Supporting Stars', color: '#EC4899', bg: 'rgba(236,72,153,0.07)', desc: 'Multi-dimensional players who elevate teams without top usage.' },
};

const ERA_DEFS: Record<string, { color: string; label: string }> = {
  'Early Modern':    { color: '#94A3B8', label: '2000–2004' },
  'Pace Transition': { color: '#38BDF8', label: '2005–2012' },
  'Three-Point Era': { color: '#C084FC', label: '2013–2020' },
};

// Cluster background ellipses [cx, cy, rx, ry] in normalised coords
const CLUSTER_ELLIPSES: Record<number, [number, number, number, number]> = {
  0: [0.790, 0.765, 0.135, 0.130],
  1: [0.205, 0.235, 0.145, 0.145],
  2: [0.755, 0.295, 0.130, 0.140],
  3: [0.535, 0.840, 0.135, 0.125],
  4: [0.380, 0.625, 0.145, 0.140],
};

// ─────────────────────────────────────────────────────────────
// Player Dataset  (Era-Normalised PCA 2-D Projection)
// ─────────────────────────────────────────────────────────────
const PLAYER_NODES: PlayerNode[] = [
  // Cluster 0 – Elite Perimeter Scorers
  { id:  1, name: 'Stephen Curry',         cluster:0, era:'Three-Point Era',  position:'PG', nx:0.88, ny:0.82, ppg:29.4, rpg:5.4, apg:6.3,  attrs:['Unlimited Range','Elite Handles','Off-ball Movement'] },
  { id:  2, name: 'James Harden',          cluster:0, era:'Three-Point Era',  position:'SG', nx:0.80, ny:0.72, ppg:27.1, rpg:6.6, apg:7.2,  attrs:['Step-back Creation','High Volume','FT Drawing'] },
  { id:  3, name: 'Damian Lillard',        cluster:0, era:'Three-Point Era',  position:'PG', nx:0.75, ny:0.78, ppg:24.3, rpg:4.3, apg:6.2,  attrs:['Clutch Gene','Logo Range','Pick-and-Roll'] },
  { id:  4, name: 'Steve Nash',            cluster:0, era:'Pace Transition',  position:'PG', nx:0.70, ny:0.88, ppg:17.7, rpg:3.3, apg:10.4, attrs:['Elite Facilitator','High TS%','Motion Offense'] },
  { id:  5, name: 'Ray Allen',             cluster:0, era:'Pace Transition',  position:'SG', nx:0.86, ny:0.68, ppg:18.9, rpg:4.1, apg:3.4,  attrs:['Elite Shooter','Off-ball Cuts','Clutch 3PT'] },
  { id:  6, name: 'Kyrie Irving',          cluster:0, era:'Three-Point Era',  position:'PG', nx:0.78, ny:0.65, ppg:23.8, rpg:3.8, apg:5.7,  attrs:['Handle Wizard','Floater Specialist','Mid-range'] },
  { id:  7, name: 'Tracy McGrady',         cluster:0, era:'Early Modern',     position:'SG', nx:0.73, ny:0.75, ppg:25.6, rpg:6.2, apg:5.3,  attrs:['Isolation Scoring','Athletic Burst','Midrange Elite'] },

  // Cluster 1 – Dominant Big Men
  { id:  8, name: "Shaquille O'Neal",      cluster:1, era:'Early Modern',     position:'C',  nx:0.10, ny:0.18, ppg:27.1, rpg:12.5, apg:2.8, attrs:['Unstoppable Post','Rim Dominance','Physical Force'] },
  { id:  9, name: 'Tim Duncan',            cluster:1, era:'Early Modern',     position:'PF', nx:0.22, ny:0.28, ppg:22.2, rpg:12.7, apg:3.2, attrs:['Fundamental Excellence','Bank Shot','Two-Way Anchor'] },
  { id: 10, name: 'Kevin Garnett',         cluster:1, era:'Pace Transition',  position:'PF', nx:0.16, ny:0.20, ppg:20.0, rpg:10.1, apg:3.7, attrs:['Defensive Anchor','Versatile Scoring','Vocal Leader'] },
  { id: 11, name: 'Hakeem Olajuwon',       cluster:1, era:'Early Modern',     position:'C',  nx:0.14, ny:0.33, ppg:21.8, rpg:11.1, apg:2.5, attrs:['Dream Shake','Elite Shot-blocker','Post Footwork'] },
  { id: 12, name: 'David Robinson',        cluster:1, era:'Early Modern',     position:'C',  nx:0.28, ny:0.15, ppg:21.1, rpg:10.6, apg:2.5, attrs:['Athletic Center','Rim Protection','Transition Threat'] },
  { id: 13, name: 'Nikola Jokic',          cluster:1, era:'Three-Point Era',  position:'C',  nx:0.32, ny:0.35, ppg:25.6, rpg:11.0, apg:6.5, attrs:['Playmaking Center','Elite IQ','Historic Passer'] },
  { id: 14, name: 'Joel Embiid',           cluster:1, era:'Three-Point Era',  position:'C',  nx:0.24, ny:0.22, ppg:27.1, rpg:11.3, apg:3.5, attrs:['Two-Way Force','Post Scoring','Perimeter Shooter'] },

  // Cluster 2 – 3-and-D Wings
  { id: 15, name: 'Kawhi Leonard',         cluster:2, era:'Three-Point Era',  position:'SF', nx:0.80, ny:0.30, ppg:21.2, rpg:6.4, apg:2.9, attrs:['Elite Defender','Catch-and-Shoot','Isolation Scoring'] },
  { id: 16, name: 'Klay Thompson',         cluster:2, era:'Three-Point Era',  position:'SG', nx:0.85, ny:0.42, ppg:21.0, rpg:3.7, apg:2.3, attrs:['Elite Shooter','Off-ball Movement','On-ball Defense'] },
  { id: 17, name: 'Paul George',           cluster:2, era:'Three-Point Era',  position:'SF', nx:0.72, ny:0.22, ppg:20.4, rpg:6.4, apg:3.8, attrs:['Wing Defender','Mid-range','Three-point Volume'] },
  { id: 18, name: 'Jayson Tatum',          cluster:2, era:'Three-Point Era',  position:'SF', nx:0.68, ny:0.38, ppg:23.0, rpg:8.0, apg:4.5, attrs:['Shot Creation','Defensive Versatility','Clutch'] },
  { id: 19, name: 'Jimmy Butler',          cluster:2, era:'Three-Point Era',  position:'SG', nx:0.65, ny:0.28, ppg:19.3, rpg:5.8, apg:4.4, attrs:['Two-way Intensity','Mid-range','FT Drawing'] },
  { id: 20, name: 'Scottie Pippen',        cluster:2, era:'Early Modern',     position:'SF', nx:0.77, ny:0.18, ppg:17.5, rpg:6.4, apg:5.2, attrs:['Two-Way Versatility','Team Defense','Playmaking Wing'] },

  // Cluster 3 – High-Usage Superstars
  { id: 21, name: 'LeBron James',          cluster:3, era:'Pace Transition',  position:'SF', nx:0.52, ny:0.88, ppg:27.2, rpg:7.5, apg:7.4, attrs:['Transcendent Playmaking','Athletic Dominance','Two-Way Elite'] },
  { id: 22, name: 'Michael Jordan',        cluster:3, era:'Early Modern',     position:'SG', nx:0.62, ny:0.92, ppg:30.1, rpg:6.2, apg:5.3, attrs:['Scoring Mastery','Elite Defense','Clutch Gene'] },
  { id: 23, name: 'Kobe Bryant',           cluster:3, era:'Pace Transition',  position:'SG', nx:0.58, ny:0.78, ppg:25.0, rpg:5.2, apg:4.7, attrs:['Shot Creation','Footwork','On-ball Defense'] },
  { id: 24, name: 'Dwyane Wade',           cluster:3, era:'Pace Transition',  position:'SG', nx:0.48, ny:0.80, ppg:22.0, rpg:4.7, apg:5.4, attrs:['Athletic Slasher','Transition','FT Drawing'] },
  { id: 25, name: 'Allen Iverson',         cluster:3, era:'Early Modern',     position:'PG', nx:0.56, ny:0.95, ppg:26.7, rpg:3.7, apg:6.2, attrs:['Iso Creator','Speed & Quickness','High Usage'] },
  { id: 26, name: 'Giannis Antetokounmpo', cluster:3, era:'Three-Point Era',   position:'PF', nx:0.44, ny:0.85, ppg:27.8, rpg:11.0, apg:5.7, attrs:['Athletic Dominance','Interior Force','Defensive Anchor'] },
  { id: 27, name: 'Kevin Durant',          cluster:3, era:'Three-Point Era',  position:'SF', nx:0.54, ny:0.72, ppg:27.1, rpg:7.3, apg:4.2, attrs:['Three-level Scoring','Unstoppable','Versatile Wing'] },

  // Cluster 4 – Versatile Supporting Stars
  { id: 28, name: 'Pau Gasol',             cluster:4, era:'Pace Transition',  position:'PF', nx:0.45, ny:0.55, ppg:17.8, rpg:9.2, apg:3.5, attrs:['Face-up Scoring','High IQ','Low-post Finesse'] },
  { id: 29, name: 'Chris Bosh',            cluster:4, era:'Pace Transition',  position:'PF', nx:0.35, ny:0.68, ppg:19.2, rpg:8.5, apg:2.0, attrs:['Spacing Big','Mid-range','Transition Finisher'] },
  { id: 30, name: 'Shawn Marion',          cluster:4, era:'Pace Transition',  position:'SF', nx:0.28, ny:0.58, ppg:15.2, rpg:9.7, apg:1.9, attrs:['Unorthodox Scorer','Transition Threat','Defensive Versatility'] },
  { id: 31, name: 'Andre Iguodala',        cluster:4, era:'Three-Point Era',  position:'SF', nx:0.42, ny:0.65, ppg:12.0, rpg:5.2, apg:4.3, attrs:['3-and-D Versatility','Playmaking Wing','Championship IQ'] },
  { id: 32, name: 'Chris Paul',            cluster:4, era:'Pace Transition',  position:'PG', nx:0.32, ny:0.75, ppg:18.6, rpg:4.5, apg:9.4, attrs:['Floor General','Mid-range Elite','Defensive PG'] },
  { id: 33, name: 'Carmelo Anthony',       cluster:4, era:'Pace Transition',  position:'SF', nx:0.38, ny:0.52, ppg:22.5, rpg:6.2, apg:2.9, attrs:['Isolation Scorer','Post Scoring','Mid-range Elite'] },
  { id: 34, name: 'Dirk Nowitzki',         cluster:4, era:'Pace Transition',  position:'PF', nx:0.48, ny:0.58, ppg:21.3, rpg:7.5, apg:3.0, attrs:['Iconic Fadeaway','Stretch 4 Pioneer','Clutch Scorer'] },
];

// ─────────────────────────────────────────────────────────────
// NBA CDN ID Mapping (for player headshots)
// ─────────────────────────────────────────────────────────────
const NBA_IDS: Record<number, number> = {
  1: 201939, 2: 201935, 3: 203081, 4: 959,    5: 951,
  6: 202681, 7: 1503,   8: 406,    9: 1495,   10: 708,
  11: 165,   12: 303,   13: 203999,14: 203954, 15: 202695,
  16: 202691,17: 202331,18: 1628369,19: 202710,20: 1628384,
  21: 2544,  22: 893,   23: 977,   24: 2548,   25: 947,
  26: 203507,27: 201142,28: 2200,  29: 2547,   30: 1890,
  31: 2738,  32: 101108,33: 2546,  34: 1717,
};

const headshotUrl = (nodeId: number) =>
  `https://cdn.nba.com/headshots/nba/latest/1040x760/${NBA_IDS[nodeId] ?? 0}.png`;

interface BaselineStats {
  ppg: { mean: number; std: number };
  apg: { mean: number; std: number };
  rpg: { mean: number; std: number };
}

interface ProjectionResult {
  player_name: string;
  player_position: 'PG' | 'SG' | 'SF' | 'PF' | 'C';
  original_era: string;
  projected_era: string;
  source_pace: number;
  target_pace: number;
  original_ppg: number;
  original_apg: number;
  original_rpg: number;
  original_ppg_per100: number;
  original_apg_per100: number;
  original_rpg_per100: number;
  source_baselines: BaselineStats;
  target_baselines: BaselineStats;
  z_scores: { ppg: number; apg: number; rpg: number };
  base_projected_per100: { ppg: number; apg: number; rpg: number };
  base_projected_raw: { ppg: number; apg: number; rpg: number };
  dqi: number;
  projected_ppg: number;
  projected_apg: number;
  projected_rpg: number;
}

const TARGET_ERAS = ['1980s', '1990s', '2000s', 'Modern'] as const;
type TargetEra = typeof TARGET_ERAS[number];

const ERA_PACE: Record<string, number> = {
  'Early Modern': 92.5, 'Pace Transition': 95.0, 'Three-Point Era': 98.0,
  '1980s': 101.0, '1990s': 91.0, '2000s': 93.0, 'Modern': 100.0,
};

const ERA_ORTG: Record<string, number> = {
  'Early Modern': 105.0, 'Pace Transition': 108.0, 'Three-Point Era': 112.0,
  '1980s': 107.0, '1990s': 106.0, '2000s': 107.0, 'Modern': 114.0,
};

// Historical league-wide position baselines for source eras (representing the actual NBA league averages)
const POSITION_SOURCE_BASELINES: Record<'Early Modern' | 'Pace Transition' | 'Three-Point Era', Record<'PG' | 'SG' | 'SF' | 'PF' | 'C', BaselineStats>> = {
  'Early Modern': {
    PG: { ppg: { mean: 11.8, std: 4.2 }, apg: { mean: 4.8, std: 1.8 }, rpg: { mean: 2.8, std: 1.0 } },
    SG: { ppg: { mean: 12.5, std: 4.5 }, apg: { mean: 2.6, std: 1.1 }, rpg: { mean: 3.2, std: 1.2 } },
    SF: { ppg: { mean: 12.2, std: 4.3 }, apg: { mean: 2.2, std: 0.9 }, rpg: { mean: 4.8, std: 1.6 } },
    PF: { ppg: { mean: 12.0, std: 4.0 }, apg: { mean: 1.6, std: 0.8 }, rpg: { mean: 7.2, std: 2.1 } },
    C:  { ppg: { mean: 10.8, std: 3.6 }, apg: { mean: 1.2, std: 0.6 }, rpg: { mean: 7.8, std: 2.4 } },
  },
  'Pace Transition': {
    PG: { ppg: { mean: 12.5, std: 4.5 }, apg: { mean: 5.2, std: 1.9 }, rpg: { mean: 3.0, std: 1.1 } },
    SG: { ppg: { mean: 13.2, std: 4.7 }, apg: { mean: 2.8, std: 1.2 }, rpg: { mean: 3.5, std: 1.3 } },
    SF: { ppg: { mean: 12.8, std: 4.4 }, apg: { mean: 2.4, std: 1.0 }, rpg: { mean: 5.1, std: 1.7 } },
    PF: { ppg: { mean: 12.5, std: 4.2 }, apg: { mean: 1.8, std: 0.8 }, rpg: { mean: 7.5, std: 2.2 } },
    C:  { ppg: { mean: 11.2, std: 3.8 }, apg: { mean: 1.4, std: 0.7 }, rpg: { mean: 8.0, std: 2.5 } },
  },
  'Three-Point Era': {
    PG: { ppg: { mean: 13.8, std: 4.8 }, apg: { mean: 5.6, std: 2.0 }, rpg: { mean: 3.2, std: 1.2 } },
    SG: { ppg: { mean: 14.1, std: 4.9 }, apg: { mean: 3.0, std: 1.2 }, rpg: { mean: 3.7, std: 1.3 } },
    SF: { ppg: { mean: 13.5, std: 4.6 }, apg: { mean: 2.6, std: 1.1 }, rpg: { mean: 5.4, std: 1.8 } },
    PF: { ppg: { mean: 13.0, std: 4.3 }, apg: { mean: 2.0, std: 0.9 }, rpg: { mean: 6.8, std: 2.0 } },
    C:  { ppg: { mean: 12.2, std: 4.0 }, apg: { mean: 1.6, std: 0.8 }, rpg: { mean: 7.6, std: 2.3 } },
  },
};

// Historical position baselines for target eras: PPG, APG, RPG averages and standard deviations
const POSITION_TARGET_BASELINES: Record<TargetEra, Record<'PG' | 'SG' | 'SF' | 'PF' | 'C', BaselineStats>> = {
  '1980s': {
    PG: { ppg: { mean: 13.8, std: 4.1 }, apg: { mean: 7.2, std: 2.3 }, rpg: { mean: 3.2, std: 1.1 } },
    SG: { ppg: { mean: 15.6, std: 4.5 }, apg: { mean: 3.5, std: 1.3 }, rpg: { mean: 3.8, std: 1.2 } },
    SF: { ppg: { mean: 14.8, std: 4.2 }, apg: { mean: 3.1, std: 1.1 }, rpg: { mean: 5.5, std: 1.8 } },
    PF: { ppg: { mean: 13.5, std: 3.8 }, apg: { mean: 2.1, std: 0.9 }, rpg: { mean: 8.2, std: 2.4 } },
    C:  { ppg: { mean: 12.8, std: 3.5 }, apg: { mean: 1.8, std: 0.8 }, rpg: { mean: 9.1, std: 2.8 } },
  },
  '1990s': {
    PG: { ppg: { mean: 12.2, std: 3.8 }, apg: { mean: 6.5, std: 2.1 }, rpg: { mean: 3.0, std: 1.0 } },
    SG: { ppg: { mean: 14.1, std: 4.2 }, apg: { mean: 3.2, std: 1.2 }, rpg: { mean: 3.6, std: 1.1 } },
    SF: { ppg: { mean: 13.4, std: 3.9 }, apg: { mean: 2.8, std: 1.0 }, rpg: { mean: 5.1, std: 1.6 } },
    PF: { ppg: { mean: 12.5, std: 3.5 }, apg: { mean: 1.9, std: 0.8 }, rpg: { mean: 7.8, std: 2.2 } },
    C:  { ppg: { mean: 11.9, std: 3.2 }, apg: { mean: 1.6, std: 0.7 }, rpg: { mean: 8.7, std: 2.5 } },
  },
  '2000s': {
    PG: { ppg: { mean: 12.9, std: 3.9 }, apg: { mean: 5.8, std: 1.9 }, rpg: { mean: 3.1, std: 1.0 } },
    SG: { ppg: { mean: 14.5, std: 4.3 }, apg: { mean: 3.0, std: 1.1 }, rpg: { mean: 3.7, std: 1.2 } },
    SF: { ppg: { mean: 13.8, std: 4.0 }, apg: { mean: 2.6, std: 0.9 }, rpg: { mean: 5.3, std: 1.6 } },
    PF: { ppg: { mean: 13.0, std: 3.6 }, apg: { mean: 1.8, std: 0.8 }, rpg: { mean: 7.9, std: 2.2 } },
    C:  { ppg: { mean: 11.5, std: 3.1 }, apg: { mean: 1.4, std: 0.6 }, rpg: { mean: 8.3, std: 2.4 } },
  },
  'Modern': {
    PG: { ppg: { mean: 16.5, std: 5.1 }, apg: { mean: 6.2, std: 2.0 }, rpg: { mean: 3.8, std: 1.3 } },
    SG: { ppg: { mean: 15.2, std: 4.8 }, apg: { mean: 3.2, std: 1.1 }, rpg: { mean: 4.1, std: 1.2 } },
    SF: { ppg: { mean: 14.8, std: 4.5 }, apg: { mean: 2.9, std: 1.0 }, rpg: { mean: 5.8, std: 1.8 } },
    PF: { ppg: { mean: 13.9, std: 4.1 }, apg: { mean: 2.2, std: 0.9 }, rpg: { mean: 7.2, std: 2.1 } },
    C:  { ppg: { mean: 13.2, std: 3.8 }, apg: { mean: 2.0, std: 0.8 }, rpg: { mean: 8.5, std: 2.5 } },
  },
};

// ─────────────────────────────────────────────────────────────
// Coordinate Helpers
// ─────────────────────────────────────────────────────────────
const toSVG = (nx: number, ny: number) => ({
  x: PAD + nx * PW,
  y: PAD + (1 - ny) * PH,
});

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────
export const EraAnalyticsPage: React.FC = () => {
  const svgRef   = useRef<SVGSVGElement>(null);
  const [vb, setVb] = useState<ViewBox>({ x: 0, y: 0, w: VB_W, h: VB_H });
  const [hovered, setHovered]           = useState<PlayerNode | null>(null);
  const [pinned,  setPinned]            = useState<PlayerNode | null>(null);
  const [tooltipPos, setTooltipPos]     = useState({ x: 0, y: 0 });
  const [activeCluster, setActiveCluster] = useState<number | null>(null);
  const [activeEra,     setActiveEra]     = useState<string | null>(null);
  const [isDragging, setIsDragging]     = useState(false);
  const dragRef = useRef({ x: 0, y: 0, vb: vb });

  // ── Time Machine state ───────────────────────────────────
  const [tmPlayerId, setTmPlayerId]   = useState<number>(1);
  const [tmTargetEra, setTmTargetEra] = useState<TargetEra>('1990s');
  const [tmActive,    setTmActive]    = useState<boolean>(false);
  const [tmResult,    setTmResult]    = useState<ProjectionResult | null>(null);
  const [tmLoading,   setTmLoading]   = useState<boolean>(false);
  const [showMathModal, setShowMathModal] = useState<boolean>(false);

  const getZBadge = (z: number) => {
    if (z > 2.0) return { label: 'All-Time Elite · Top 2%', color: '#F59E0B', bg: '#F59E0B15', border: '#F59E0B50', icon: '⭐' };
    if (z > 1.0) return { label: 'All-Star Level',          color: '#06B6D4', bg: '#06B6D415', border: '#06B6D450', icon: '🔵' };
    return             { label: 'Era Average',               color: '#64748B', bg: '#64748B15', border: '#64748B50', icon: '◾' };
  };

  const runProjection = async () => {
    const player = PLAYER_NODES.find(p => p.id === tmPlayerId);
    if (!player) return;
    setTmLoading(true);
    setTmActive(true);
    setShowMathModal(true);
    await new Promise(r => setTimeout(r, 1200));

    const pos = player.position;
    const sourceEra = player.era;

    // Era Pace metrics
    const paceSource = ERA_PACE[sourceEra] || 95.0;
    const paceTarget = ERA_PACE[tmTargetEra] || 95.0;

    // Fetch Source and Target Baselines
    const sourceBaselinesRaw = POSITION_SOURCE_BASELINES[sourceEra][pos];
    const targetBaselinesRaw = POSITION_TARGET_BASELINES[tmTargetEra][pos];

    // Convert Player stats to Per-100 Possessions space
    const sourceFactor = 100 / paceSource;
    const playerPpgPer100 = player.ppg * sourceFactor;
    const playerApgPer100 = player.apg * sourceFactor;
    const playerRpgPer100 = player.rpg * sourceFactor;

    // Convert Source Baselines to Per-100 space
    const sourceBaselinesPer100: BaselineStats = {
      ppg: { mean: sourceBaselinesRaw.ppg.mean * sourceFactor, std: sourceBaselinesRaw.ppg.std * sourceFactor },
      apg: { mean: sourceBaselinesRaw.apg.mean * sourceFactor, std: sourceBaselinesRaw.apg.std * sourceFactor },
      rpg: { mean: sourceBaselinesRaw.rpg.mean * sourceFactor, std: sourceBaselinesRaw.rpg.std * sourceFactor },
    };

    // Convert Target Baselines to Per-100 space
    const targetFactor = 100 / paceTarget;
    const targetBaselinesPer100: BaselineStats = {
      ppg: { mean: targetBaselinesRaw.ppg.mean * targetFactor, std: targetBaselinesRaw.ppg.std * targetFactor },
      apg: { mean: targetBaselinesRaw.apg.mean * targetFactor, std: targetBaselinesRaw.apg.std * targetFactor },
      rpg: { mean: targetBaselinesRaw.rpg.mean * targetFactor, std: targetBaselinesRaw.rpg.std * targetFactor },
    };

    // Calculate Z-Scores in Per-100 space
    const zppg = parseFloat(((playerPpgPer100 - sourceBaselinesPer100.ppg.mean) / sourceBaselinesPer100.ppg.std).toFixed(2));
    const zapg = parseFloat(((playerApgPer100 - sourceBaselinesPer100.apg.mean) / sourceBaselinesPer100.apg.std).toFixed(2));
    const zrpg = parseFloat(((playerRpgPer100 - sourceBaselinesPer100.rpg.mean) / sourceBaselinesPer100.rpg.std).toFixed(2));

    // Translate in Per-100 space
    const basePpgPer100 = targetBaselinesPer100.ppg.mean + zppg * targetBaselinesPer100.ppg.std;
    const baseApgPer100 = targetBaselinesPer100.apg.mean + zapg * targetBaselinesPer100.apg.std;
    const baseRpgPer100 = targetBaselinesPer100.rpg.mean + zrpg * targetBaselinesPer100.rpg.std;

    // Convert back to Target Era Raw stats (Team pace translation)
    const rawPpgTarget = basePpgPer100 * (paceTarget / 100);
    const rawApgTarget = baseApgPer100 * (paceTarget / 100);
    const rawRpgTarget = baseRpgPer100 * (paceTarget / 100);

    // Calculate Defensive Quality Index (DQI)
    const ortgSource = ERA_ORTG[sourceEra] || 110.0;
    const ortgTarget = ERA_ORTG[tmTargetEra] || 110.0;
    const dqi = parseFloat((ortgTarget / ortgSource).toFixed(4));

    // Calculate Final Projected values scaled by DQI
    const finalPpg = parseFloat((rawPpgTarget * dqi).toFixed(1));
    const finalApg = parseFloat((rawApgTarget * dqi).toFixed(1));
    const finalRpg = parseFloat((rawRpgTarget * dqi).toFixed(1));

    setTmResult({
      player_name:   player.name,
      player_position: pos,
      original_era:  player.era,
      projected_era: tmTargetEra,
      source_pace:   paceSource,
      target_pace:   paceTarget,
      original_ppg:  player.ppg,
      original_apg:  player.apg,
      original_rpg:  player.rpg,
      original_ppg_per100: parseFloat(playerPpgPer100.toFixed(1)),
      original_apg_per100: parseFloat(playerApgPer100.toFixed(1)),
      original_rpg_per100: parseFloat(playerRpgPer100.toFixed(1)),
      source_baselines: sourceBaselinesRaw,
      target_baselines: targetBaselinesRaw,
      z_scores: { ppg: zppg, apg: zapg, rpg: zrpg },
      base_projected_per100: {
        ppg: parseFloat(basePpgPer100.toFixed(1)),
        apg: parseFloat(baseApgPer100.toFixed(1)),
        rpg: parseFloat(baseRpgPer100.toFixed(1)),
      },
      base_projected_raw: {
        ppg: parseFloat(rawPpgTarget.toFixed(1)),
        apg: parseFloat(rawApgTarget.toFixed(1)),
        rpg: parseFloat(rawRpgTarget.toFixed(1)),
      },
      dqi: dqi,
      projected_ppg: finalPpg,
      projected_apg: finalApg,
      projected_rpg: finalRpg,
    });
    setTmLoading(false);
  };

  // ── Zoom via mouse wheel ──────────────────────────────────
  const handleWheel = useCallback((e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const svg = svgRef.current;
    if (!svg) return;
    const rect   = svg.getBoundingClientRect();
    const factor = e.deltaY > 0 ? 1.18 : 0.85;
    setVb(prev => {
      const mx = ((e.clientX - rect.left) / rect.width)  * prev.w + prev.x;
      const my = ((e.clientY - rect.top)  / rect.height) * prev.h + prev.y;
      const nw = Math.min(VB_W * 4, Math.max(VB_W * 0.25, prev.w * factor));
      const nh = Math.min(VB_H * 4, Math.max(VB_H * 0.25, prev.h * factor));
      return {
        x: mx - (mx - prev.x) * (nw / prev.w),
        y: my - (my - prev.y) * (nh / prev.h),
        w: nw, h: nh,
      };
    });
  }, []);

  // ── Pan via drag ──────────────────────────────────────────
  const handleMouseDown = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if ((e.target as SVGElement).tagName === 'circle') return;
    setIsDragging(true);
    dragRef.current = { x: e.clientX, y: e.clientY, vb: vb };
  }, [vb]);

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDragging) return;
    const svg  = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const dx   = (e.clientX - dragRef.current.x) / rect.width  * dragRef.current.vb.w;
    const dy   = (e.clientY - dragRef.current.y) / rect.height * dragRef.current.vb.h;
    setVb({ ...dragRef.current.vb, x: dragRef.current.vb.x - dx, y: dragRef.current.vb.y - dy });
  }, [isDragging]);

  const stopDrag = useCallback(() => setIsDragging(false), []);

  // ── Reset ────────────────────────────────────────────────
  const resetView = () => setVb({ x: 0, y: 0, w: VB_W, h: VB_H });

  // ── Filtered players ──────────────────────────────────────
  const visible = PLAYER_NODES.filter(p => {
    if (activeCluster !== null && p.cluster !== activeCluster) return false;
    if (activeEra     !== null && p.era     !== activeEra)     return false;
    return true;
  });

  // ── Node hover ────────────────────────────────────────────
  const onNodeEnter = (e: React.MouseEvent, p: PlayerNode) => {
    setHovered(p);
    setTooltipPos({ x: e.clientX, y: e.clientY });
  };
  const onNodeMove  = (e: React.MouseEvent) => {
    setTooltipPos({ x: e.clientX, y: e.clientY });
  };
  const onNodeLeave = () => setHovered(null);
  const onNodeClick = (p: PlayerNode) => setPinned(prev => prev?.id === p.id ? null : p);

  const displayed = pinned ?? hovered;

  return (
    <div className="space-y-6 animate-fade-in font-sans">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Cpu className="h-5 w-5 text-[#06B6D4]" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-[#06B6D4] font-black">
              Era-Normalised · Autoencoder · K-Means
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl font-display">
            NBA Embedding Space
          </h1>
          <p className="mt-1 text-sm text-zinc-400 max-w-2xl">
            Players normalised against era peers, compressed to a 6-D autoencoder embedding, then projected to 2-D via PCA.
            Proximity indicates basketball similarity across generations.
          </p>
        </div>
        {/* Zoom Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => setVb(prev => ({ ...prev, w: prev.w * 0.8, h: prev.h * 0.8 }))}
            className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-[#06B6D4]/40 text-zinc-400 hover:text-[#06B6D4] transition-all cursor-pointer">
            <ZoomIn className="h-4 w-4" />
          </button>
          <button onClick={() => setVb(prev => ({ ...prev, w: prev.w * 1.2, h: prev.h * 1.2 }))}
            className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-[#06B6D4]/40 text-zinc-400 hover:text-[#06B6D4] transition-all cursor-pointer">
            <ZoomOut className="h-4 w-4" />
          </button>
          <button onClick={resetView}
            className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-600 text-zinc-400 hover:text-white transition-all cursor-pointer">
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Filters ────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 items-center">
        <span className="text-[9px] uppercase tracking-widest text-zinc-600 font-black">Era</span>
        {Object.entries(ERA_DEFS).map(([era, def]) => (
          <button key={era} onClick={() => setActiveEra(prev => prev === era ? null : era)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all cursor-pointer"
            style={{
              borderColor: activeEra === era ? def.color : '#3f3f46',
              color:       activeEra === era ? def.color : '#a1a1aa',
              background:  activeEra === era ? `${def.color}18` : 'transparent',
            }}>
            <span className="h-2 w-2 rounded-full" style={{ background: def.color }} />
            {era} <span className="opacity-60">{def.label}</span>
          </button>
        ))}
        <span className="text-[9px] uppercase tracking-widest text-zinc-600 font-black ml-2">Cluster</span>
        {Object.entries(CLUSTER_DEFS).map(([ci, def]) => (
          <button key={ci} onClick={() => setActiveCluster(prev => prev === Number(ci) ? null : Number(ci))}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all cursor-pointer"
            style={{
              borderColor: activeCluster === Number(ci) ? def.color : '#3f3f46',
              color:       activeCluster === Number(ci) ? def.color : '#a1a1aa',
              background:  activeCluster === Number(ci) ? `${def.color}18` : 'transparent',
            }}>
            <span className="h-2 w-2 rounded-full" style={{ background: def.color }} />
            {def.name}
          </button>
        ))}
      </div>

      {/* ── Main Panel ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-5">

        {/* ── SVG Plot ───────────────────────────────────── */}
        <div className="relative rounded-3xl overflow-hidden border border-white/5 bg-[#070B14] shadow-2xl"
          style={{ aspectRatio: '16/10' }}>

          {/* Axis labels */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[9px] text-zinc-600 uppercase tracking-widest pointer-events-none select-none">
            ← Interior / Physical &nbsp;·&nbsp; Perimeter / Spacing →
          </div>
          <div className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] text-zinc-600 uppercase tracking-widest pointer-events-none select-none"
            style={{ writingMode: 'vertical-rl', transform: 'translateY(-50%) rotate(180deg)' }}>
            ↑ Role Player &nbsp;·&nbsp; High Usage ↑
          </div>

          <svg
            ref={svgRef}
            viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
            className="w-full h-full"
            style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={stopDrag}
            onMouseLeave={stopDrag}
          >
            <defs>
              {Object.entries(CLUSTER_DEFS).map(([ci, def]) => (
                <radialGradient key={ci} id={`glow-${ci}`} cx="50%" cy="50%" r="50%">
                  <stop offset="0%"   stopColor={def.color} stopOpacity="0.9" />
                  <stop offset="100%" stopColor={def.color} stopOpacity="0.1" />
                </radialGradient>
              ))}
              <filter id="blur-sm">
                <feGaussianBlur stdDeviation="8" />
              </filter>
            </defs>

            {/* Subtle dot grid */}
            {Array.from({ length: 11 }).map((_, ix) =>
              Array.from({ length: 8 }).map((_, iy) => {
                const gx = PAD + ix * (PW / 10);
                const gy = PAD + iy * (PH / 7);
                return <circle key={`${ix}-${iy}`} cx={gx} cy={gy} r="1.2" fill="#ffffff" opacity="0.04" />;
              })
            )}

            {/* Cluster background ellipses (no label here — labels rendered last) */}
            {Object.entries(CLUSTER_ELLIPSES).map(([ci, [enx, eny, erx, ery]]) => {
              if (activeCluster !== null && activeCluster !== Number(ci)) return null;
              const c   = CLUSTER_DEFS[Number(ci)];
              const cx  = PAD + enx * PW;
              const cy  = PAD + (1 - eny) * PH;
              const rx  = erx * PW;
              const ry  = ery * PH;
              return (
                <g key={ci}>
                  {/* Blurred glow behind */}
                  <ellipse cx={cx} cy={cy} rx={rx * 0.8} ry={ry * 0.8}
                    fill={c.color} opacity="0.04" filter="url(#blur-sm)" />
                  {/* Dashed outline */}
                  <ellipse cx={cx} cy={cy} rx={rx} ry={ry}
                    fill={c.bg} stroke={c.color} strokeWidth="0.8"
                    strokeDasharray="6 4" strokeOpacity="0.25" />
                </g>
              );
            })}

            {/* Player dots */}
            {PLAYER_NODES.map(p => {
              const sv    = toSVG(p.nx, p.ny);
              const cdef  = CLUSTER_DEFS[p.cluster];
              const edef  = ERA_DEFS[p.era];
              const isVis = visible.some(v => v.id === p.id);
              const isHov = hovered?.id === p.id;
              const isPin = pinned?.id  === p.id;
              const active = isHov || isPin;
              const r     = active ? 12 : 8.5;
              const opacity = isVis ? 1 : 0.12;

              return (
                <g key={p.id} style={{ cursor: 'pointer' }}
                  onMouseEnter={e => isVis && onNodeEnter(e, p)}
                  onMouseMove={onNodeMove}
                  onMouseLeave={onNodeLeave}
                  onClick={() => isVis && onNodeClick(p)}>

                  {/* Era ring */}
                  <circle cx={sv.x} cy={sv.y} r={r + 5}
                    fill="none" stroke={edef.color}
                    strokeWidth={active ? 2.5 : 1.8}
                    opacity={isVis ? (active ? 1 : 0.55) : 0.08} />

                  {/* Glow */}
                  {active && (
                    <circle cx={sv.x} cy={sv.y} r={32}
                      fill={cdef.color} opacity="0.22" filter="url(#blur-sm)" />
                  )}
                  {/* Always-on soft glow */}
                  {isVis && !active && (
                    <circle cx={sv.x} cy={sv.y} r={14}
                      fill={cdef.color} opacity="0.08" filter="url(#blur-sm)" />
                  )}

                  {/* Main dot */}
                  <circle cx={sv.x} cy={sv.y} r={r}
                    fill={active ? cdef.color : `url(#glow-${p.cluster})`}
                    stroke={cdef.color} strokeWidth={active ? 2 : 1}
                    opacity={opacity}
                    style={{ transition: 'r 0.15s ease' }} />

                  {/* Name label — always visible for visible nodes */}
                  {isVis && (
                    <text x={sv.x} y={sv.y - r - 7}
                      textAnchor="middle" fill={active ? cdef.color : '#ffffff'}
                      fontSize={active ? 13 : 10}
                      fontWeight="800"
                      fontFamily="system-ui"
                      opacity={active ? 1 : 0.7}
                      style={{ pointerEvents: 'none', userSelect: 'none' }}>
                      {p.name.split(' ').slice(-1)[0]}
                    </text>
                  )}
                </g>
              );
            })}
            {/* ── Cluster labels — rendered LAST so they sit on top of all dots ── */}
            {Object.entries(CLUSTER_ELLIPSES).map(([ci, [enx, eny, erx, ery]]) => {
              if (activeCluster !== null && activeCluster !== Number(ci)) return null;
              const c    = CLUSTER_DEFS[Number(ci)];
              const cx   = PAD + enx * PW;
              const cy   = PAD + (1 - eny) * PH;
              const ry   = ery * PH;
              const label = c.name.toUpperCase();
              // Estimate pill width: ~7.2px per char at fontSize=11, plus 24px padding
              const pillW = label.length * 7.2 + 24;
              const pillH = 20;
              // Clusters near the top of SVG (ny > 0.7 → cy small) → label goes BELOW
              const goBelow = eny > 0.7;
              const labelY  = goBelow ? cy + ry + 28 : cy - ry - 14;
              // Clamp x so pill doesn't clip SVG edge
              const labelX  = Math.min(Math.max(cx, pillW / 2 + 4), VB_W - pillW / 2 - 4);
              return (
                <g key={`lbl-${ci}`}>
                  {/* Arrow line from ellipse edge to pill */}
                  <line
                    x1={cx}
                    y1={goBelow ? cy + ry + 2 : cy - ry - 2}
                    x2={labelX}
                    y2={goBelow ? labelY - pillH / 2 : labelY + pillH / 2}
                    stroke={c.color} strokeWidth="0.7" strokeOpacity="0.35"
                    strokeDasharray="3 2"
                  />
                  {/* Background pill */}
                  <rect
                    x={labelX - pillW / 2}
                    y={labelY - pillH / 2}
                    width={pillW}
                    height={pillH}
                    rx={5}
                    fill="#070B14"
                    fillOpacity={0.92}
                    stroke={c.color}
                    strokeWidth={0.8}
                    strokeOpacity={0.6}
                  />
                  {/* Label text */}
                  <text
                    x={labelX}
                    y={labelY + 4}
                    textAnchor="middle"
                    fill={c.color}
                    fontSize="11"
                    fontWeight="900"
                    fontFamily="system-ui"
                    letterSpacing="0.8"
                    opacity={1}
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {label}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Floating tooltip near cursor */}
          {hovered && !pinned && (
            <div
              className="fixed z-50 pointer-events-none"
              style={{
                left: tooltipPos.x + 16,
                top:  tooltipPos.y - 12,
                transform: tooltipPos.x > window.innerWidth * 0.65 ? 'translateX(-110%)' : 'none',
              }}>
              <div className="rounded-2xl border border-white/10 bg-zinc-950/95 backdrop-blur-xl p-4 shadow-2xl min-w-[200px]"
                style={{ borderColor: `${CLUSTER_DEFS[hovered.cluster].color}40` }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                    style={{ background: CLUSTER_DEFS[hovered.cluster].color }} />
                  <span className="text-xs font-black text-white leading-tight">{hovered.name}</span>
                </div>
                <p className="text-[9px] font-bold uppercase tracking-widest mb-2"
                  style={{ color: CLUSTER_DEFS[hovered.cluster].color }}>
                  {CLUSTER_DEFS[hovered.cluster].name}
                </p>
                <div className="flex gap-3 text-[10px] text-zinc-400 mb-2">
                  <span><span className="text-white font-bold">{hovered.ppg}</span> PPG</span>
                  <span><span className="text-white font-bold">{hovered.rpg}</span> RPG</span>
                  <span><span className="text-white font-bold">{hovered.apg}</span> APG</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full"
                    style={{ background: ERA_DEFS[hovered.era].color }} />
                  <span className="text-[9px] text-zinc-500">{hovered.era} · {ERA_DEFS[hovered.era].label}</span>
                </div>
              </div>
            </div>
          )}

          {/* Hint */}
          <div className="absolute bottom-3 right-4 text-[9px] text-zinc-700 font-bold pointer-events-none select-none">
            Scroll to zoom · Drag to pan · Click to pin
          </div>
        </div>

        {/* ── Right Sidebar ──────────────────────────────── */}
        <div className="space-y-4">

          {/* Player Info Panel */}
          {displayed ? (
            <div className="rounded-3xl border bg-[#0B0F19]/90 backdrop-blur-xl p-5 space-y-4 transition-all"
              style={{ borderColor: `${CLUSTER_DEFS[displayed.cluster].color}30` }}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-base font-black text-white leading-tight">{displayed.name}</h3>
                  <p className="text-[9px] uppercase tracking-widest mt-0.5"
                    style={{ color: CLUSTER_DEFS[displayed.cluster].color }}>
                    {CLUSTER_DEFS[displayed.cluster].name}
                  </p>
                </div>
                <span className="text-[9px] font-bold px-2 py-1 rounded-lg border"
                  style={{ borderColor: ERA_DEFS[displayed.era].color + '50', color: ERA_DEFS[displayed.era].color, background: ERA_DEFS[displayed.era].color + '15' }}>
                  {displayed.era}
                </span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2">
                {[['PPG', displayed.ppg], ['RPG', displayed.rpg], ['APG', displayed.apg]].map(([lbl, val]) => (
                  <div key={lbl as string} className="bg-zinc-950/60 rounded-xl p-2.5 text-center border border-zinc-900">
                    <p className="text-lg font-black text-white">{val}</p>
                    <p className="text-[8px] text-zinc-500 uppercase tracking-wider">{lbl}</p>
                  </div>
                ))}
              </div>

              {/* Attrs */}
              <div className="space-y-1.5">
                <p className="text-[9px] uppercase tracking-widest text-zinc-600 font-black">Key Attributes</p>
                {displayed.attrs.map(a => (
                  <div key={a} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full flex-shrink-0"
                      style={{ background: CLUSTER_DEFS[displayed.cluster].color }} />
                    <span className="text-xs text-zinc-300">{a}</span>
                  </div>
                ))}
              </div>

              {/* Embedding position */}
              <div className="border-t border-zinc-900 pt-3">
                <p className="text-[9px] uppercase tracking-widest text-zinc-600 font-black mb-1.5">Embedding Position</p>
                <div className="flex gap-3 text-[10px]">
                  <span className="text-zinc-400">X <span className="text-zinc-200 font-bold">{(displayed.nx * 100).toFixed(0)}th %ile</span></span>
                  <span className="text-zinc-400">Y <span className="text-zinc-200 font-bold">{(displayed.ny * 100).toFixed(0)}th %ile</span></span>
                </div>
                {pinned && (
                  <button onClick={() => setPinned(null)}
                    className="mt-2 text-[9px] text-zinc-500 hover:text-white transition-colors cursor-pointer">
                    ✕ Unpin player
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-zinc-800/60 bg-[#0B0F19]/60 p-5 flex flex-col items-center justify-center gap-3 text-center"
              style={{ minHeight: 220 }}>
              <Info className="h-8 w-8 text-zinc-700" />
              <p className="text-xs text-zinc-600">Hover or click any node<br />to inspect a player</p>
            </div>
          )}

          {/* Cluster Legend */}
          <div className="rounded-3xl border border-zinc-800/40 bg-[#0B0F19]/70 p-5 space-y-2">
            <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-black mb-3">Cluster Legend</p>
            {Object.entries(CLUSTER_DEFS).map(([ci, def]) => {
              const isActive = activeCluster === Number(ci);
              return (
                <button key={ci}
                  onClick={() => setActiveCluster(prev => prev === Number(ci) ? null : Number(ci))}
                  className="w-full text-left cursor-pointer rounded-2xl p-3.5 transition-all duration-200"
                  style={{
                    background: isActive ? `${def.color}12` : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${isActive ? def.color + '50' : 'rgba(255,255,255,0.05)'}`,
                    boxShadow: isActive ? `0 0 16px ${def.color}18` : 'none',
                  }}>
                  <div className="flex items-center gap-3">
                    <span className="flex-shrink-0 h-3.5 w-3.5 rounded-full transition-all"
                      style={{
                        background: def.color,
                        boxShadow: isActive ? `0 0 10px ${def.color}, 0 0 20px ${def.color}60` : `0 0 6px ${def.color}50`,
                      }} />
                    <span className="text-sm font-black leading-tight transition-colors"
                      style={{ color: isActive ? def.color : '#e4e4e7' }}>
                      {def.name}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed pl-6">{def.desc}</p>
                </button>
              );
            })}
          </div>

          {/* Era Legend */}
          <div className="rounded-3xl border border-zinc-800/40 bg-[#0B0F19]/70 p-5 space-y-2">
            <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-black mb-3">Era Ring Legend</p>
            {Object.entries(ERA_DEFS).map(([era, def]) => (
              <button key={era}
                onClick={() => setActiveEra(prev => prev === era ? null : era)}
                className="w-full flex items-center gap-3 rounded-2xl p-3 transition-all cursor-pointer text-left"
                style={{
                  background: activeEra === era ? `${def.color}12` : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${activeEra === era ? def.color + '50' : 'rgba(255,255,255,0.04)'}`,
                }}>
                {/* Era ring preview */}
                <div className="flex-shrink-0 h-7 w-7 rounded-full border-2 flex items-center justify-center"
                  style={{ borderColor: def.color, boxShadow: activeEra === era ? `0 0 10px ${def.color}` : 'none' }}>
                  <div className="h-3 w-3 rounded-full"
                    style={{ background: def.color, opacity: 0.5 }} />
                </div>
                <div>
                  <p className="text-sm font-black" style={{ color: activeEra === era ? def.color : '#e4e4e7' }}>{era}</p>
                  <p className="text-xs text-zinc-500">{def.label}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Time Machine Widget ──────────────────────────── */}
      <div className="rounded-3xl border border-zinc-800/40 overflow-hidden"
        style={{ background: 'linear-gradient(145deg,#07090F 60%,#0F1320)' }}>

        {/* Header */}
        <div className="px-8 pt-7 pb-6 border-b border-zinc-800/40 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: '#F59E0B18', border: '1px solid #F59E0B35', boxShadow: '0 0 20px #F59E0B18' }}>
              <Clock className="h-5 w-5 text-[#F59E0B]" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#F59E0B]">Time Machine</p>
              <h2 className="text-xl font-black text-white leading-tight">Cross-Era Projection Engine</h2>
            </div>
          </div>
          <p className="text-sm text-zinc-500 max-w-lg">
            Select any player and a target era to see how their normalised peak stats translate across basketball history.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] divide-y lg:divide-y-0 lg:divide-x divide-zinc-800/40">

          {/* ── Left: Controls ─────────────────────────── */}
          <div className="p-8 space-y-6">

            {/* Player selector */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Select Player</label>
              <div className="relative">
                <select
                  value={tmPlayerId}
                  onChange={e => { setTmPlayerId(Number(e.target.value)); setTmResult(null); setTmActive(false); }}
                  className="w-full appearance-none rounded-2xl px-4 py-3.5 text-sm font-bold text-white cursor-pointer pr-10"
                  style={{ background: '#0F1320', border: '1px solid rgba(255,255,255,0.08)' }}>
                  {PLAYER_NODES.map(p => (
                    <option key={p.id} value={p.id}>{p.name} — {p.era}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
              </div>
              {/* Player headshot preview */}
              {(() => {
                const p = PLAYER_NODES.find(n => n.id === tmPlayerId)!;
                const c = CLUSTER_DEFS[p.cluster];
                return (
                  <div className="flex items-center gap-4 p-4 rounded-2xl mt-1"
                    style={{ background: `${c.color}0A`, border: `1px solid ${c.color}20` }}>
                    <div className="relative h-16 w-16 rounded-xl overflow-hidden flex-shrink-0 bg-zinc-900">
                      <img
                        src={headshotUrl(tmPlayerId)}
                        alt={p.name}
                        className="h-full w-full object-cover object-top"
                        onError={e => { (e.target as HTMLImageElement).src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='%23111827'/%3E%3Ccircle cx='32' cy='22' r='12' fill='%23374151'/%3E%3Cellipse cx='32' cy='56' rx='20' ry='14' fill='%23374151'/%3E%3C/svg%3E`; }}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-black text-white">{p.name}</p>
                      <p className="text-[10px] font-bold mt-0.5" style={{ color: c.color }}>{c.name}</p>
                      <div className="flex gap-3 mt-1.5 text-[10px] text-zinc-400">
                        <span><span className="text-white font-bold">{p.ppg}</span> PPG</span>
                        <span><span className="text-white font-bold">{p.apg}</span> APG</span>
                        <span><span className="text-white font-bold">{p.rpg}</span> RPG</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Era selector */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Target Projection Era</label>
              <div className="grid grid-cols-2 gap-2">
                {TARGET_ERAS.map(era => (
                  <button key={era}
                    onClick={() => { setTmTargetEra(era); setTmResult(null); setTmActive(false); }}
                    className="px-3 py-3 rounded-2xl text-sm font-black transition-all cursor-pointer text-center"
                    style={{
                      background: tmTargetEra === era ? '#F59E0B18' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${tmTargetEra === era ? '#F59E0B50' : 'rgba(255,255,255,0.06)'}`,
                      color: tmTargetEra === era ? '#F59E0B' : '#71717a',
                      boxShadow: tmTargetEra === era ? '0 0 12px #F59E0B20' : 'none',
                    }}>
                    {era}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-zinc-600 pt-1">
                Pace: <span className="text-zinc-400">{ERA_PACE[tmTargetEra]}</span>
              </p>
            </div>

            {/* Run button */}
            <button
              onClick={runProjection}
              disabled={tmLoading}
              className="w-full py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2"
              style={{
                background: tmLoading ? '#92400e' : 'linear-gradient(135deg,#F59E0B,#D97706)',
                color: '#000',
                boxShadow: tmLoading ? 'none' : '0 0 24px #F59E0B40',
                opacity: tmLoading ? 0.7 : 1,
              }}>
              {tmLoading
                ? <><span className="animate-spin">⏳</span> Projecting…</>
                : <><Zap className="h-4 w-4" /> Project into {tmTargetEra}</>}
            </button>
          </div>

          {/* ── Right: Results Summary & Modal Trigger ──────────────────────────── */}
          <div className="p-8">
            {!tmResult && !tmLoading && (
              <div className="h-full flex flex-col items-center justify-center gap-4 text-center" style={{ minHeight: 280 }}>
                <div className="h-16 w-16 rounded-2xl flex items-center justify-center bg-[#F59E0B]/10 border border-[#F59E0B]/20">
                  <TrendingUp className="h-8 w-8 text-[#F59E0B]/40" />
                </div>
                <p className="text-sm text-zinc-400 max-w-xs">Select a player and target era, then hit <span className="text-[#F59E0B] font-bold">Project</span> to see how their stats translate across generations.</p>
              </div>
            )}

            {tmLoading && (
              <div className="h-full flex flex-col items-center justify-center gap-3" style={{ minHeight: 280 }}>
                <div className="flex gap-1.5">
                  {[0,1,2,3,4].map(i => (
                    <div key={i} className="h-2.5 w-2.5 rounded-full bg-[#F59E0B] animate-bounce"
                      style={{ animationDelay: `${i * 0.12}s` }} />
                  ))}
                </div>
                <p className="text-sm text-zinc-400 font-bold tracking-wider animate-pulse">BOOTING SIMULATION WIDGET...</p>
              </div>
            )}

            {tmResult && !tmLoading && (() => {
              const player = PLAYER_NODES.find(p => p.id === tmPlayerId)!;
              const c = CLUSTER_DEFS[player.cluster];
              const stats = [
                { label: 'Scoring',     original: tmResult.original_ppg, projected: tmResult.projected_ppg, unit: 'PPG' },
                { label: 'Playmaking',  original: tmResult.original_apg, projected: tmResult.projected_apg, unit: 'APG' },
                { label: 'Rebounding', original: tmResult.original_rpg, projected: tmResult.projected_rpg, unit: 'RPG' },
              ];
              return (
                <div className="space-y-6 animate-fade-in">
                  {/* Player header banner */}
                  <div className="flex items-center gap-4 bg-zinc-950/40 p-4 rounded-2xl border border-zinc-900">
                    <div className="relative h-16 w-16 rounded-xl overflow-hidden flex-shrink-0 bg-zinc-900 border border-white/5">
                      <img
                        src={headshotUrl(tmPlayerId)}
                        alt={player.name}
                        className="h-full w-full object-cover object-top"
                        onError={e => { (e.target as HTMLImageElement).src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='%23111827'/%3E%3Ccircle cx='32' cy='22' r='12' fill='%23374151'/%3E%3Cellipse cx='32' cy='56' rx='20' ry='14' fill='%23374151'/%3E%3C/svg%3E`; }}
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-black text-white">{player.name}</h3>
                      <p className="text-[10px] text-zinc-400 font-medium">
                        {tmResult.original_era} <span className="text-zinc-600">→</span> <span className="text-[#F59E0B] font-bold">{tmTargetEra}</span>
                      </p>
                    </div>
                  </div>

                  {/* Summary Stat Cards */}
                  <div className="grid grid-cols-3 gap-3">
                    {stats.map(({ label, original, projected, unit }) => {
                      const diff = parseFloat((projected - original).toFixed(1));
                      const isPositive = diff >= 0;
                      return (
                        <div key={label} className="bg-zinc-950/80 rounded-xl p-3 border border-zinc-900 text-center flex flex-col justify-between">
                          <p className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">{label}</p>
                          <div className="my-2">
                            <p className="text-xl font-black text-white leading-none">{projected}</p>
                            <p className="text-[9px] text-zinc-500 mt-1">{unit}</p>
                          </div>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md self-center ${isPositive ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-900/50' : 'bg-zinc-900 text-zinc-400 border border-zinc-800'}`}>
                            {isPositive ? '+' : ''}{diff}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Modal Reopen Button */}
                  <button
                    onClick={() => setShowMathModal(true)}
                    className="w-full py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-wider border border-[#F59E0B]/30 hover:border-[#F59E0B] bg-[#F59E0B]/5 hover:bg-[#F59E0B]/10 text-[#F59E0B] transition-all cursor-pointer flex items-center justify-center gap-2">
                    <Cpu className="h-3.5 w-3.5" />
                    Open Projection Formula Simulation
                  </button>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* ── Methodology Pipeline ──────────────────────────── */}
      <div className="rounded-3xl border border-zinc-800/40 bg-[#070B14]/80 overflow-hidden">
        {/* Section header */}
        <div className="px-8 pt-8 pb-6 border-b border-zinc-800/40 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Cpu className="h-4 w-4 text-[#06B6D4]" />
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#06B6D4] font-black">ML Pipeline</span>
            </div>
            <h2 className="text-xl font-black text-white">How the Embedding Space is Built</h2>
            <p className="text-sm text-zinc-500 mt-0.5">Three-stage methodology that converts raw box scores into era-independent basketball identity vectors.</p>
          </div>
          <div className="hidden md:flex items-center gap-2 text-[10px] text-zinc-600 font-bold">
            <span className="px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800">34 Players</span>
            <span className="px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800">15 Features</span>
            <span className="px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800">5 Clusters</span>
          </div>
        </div>

        {/* Pipeline steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-zinc-800/40">
          {[
            {
              step: '01', tag: 'Era Normalisation', color: '#38BDF8',
              headline: 'Remove Era Bias',
              body: "Raw stats are meaningless across generations. A 25 PPG average in 2002 is not the same as 25 PPG in 2018. We z-score every player's stats against peers from the same era only.",
              bullets: [
                '3 distinct eras defined: 2000–04, 2005–12, 2013–20',
                '15 features normalised per era (pts, reb, ast, stl, blk, usage, ORtg, DRtg, TS%, …)',
                'Output: a vector representing dominance above era average',
              ],
              stat: '15', statLabel: 'Features Normalised',
              flow: 'Raw Box Scores → Era Z-Scores',
            },
            {
              step: '02', tag: 'Autoencoder Embedding', color: '#8B5CF6',
              headline: 'Learn Basketball Identity',
              body: 'A neural network compresses each era-normalised player vector into a compact 6-dimensional space. No manual labelling — the network discovers basketball archetypes from data.',
              bullets: [
                'Architecture: 15 inputs → 10 hidden → 6-D bottleneck',
                'Trained to reconstruct original stats from the embedding',
                'Output: 6 numbers that encode a player\'s basketball identity',
              ],
              stat: '6D', statLabel: 'Latent Embedding',
              flow: '15-D Vector → 6-D Embedding',
            },
            {
              step: '03', tag: 'K-Means Clustering', color: '#10B981',
              headline: 'Validate Archetypes',
              body: 'K-Means (k=5) groups players in the embedding space. The purpose is validation — if the embedding is meaningful, similar play-styles will naturally cluster together across eras.',
              bullets: [
                'k=5 clusters discovered (perimeter, bigs, wings, superstars, support)',
                'PCA reduces 6-D to 2-D for this visualisation',
                'Proximity = basketball similarity, regardless of era',
              ],
              stat: 'k=5', statLabel: 'Clusters Found',
              flow: '6-D Embedding → 5 Archetypes',
            },
          ].map(({ step, tag, color, headline, body, bullets, stat, statLabel, flow }) => (
            <div key={step} className="p-8 space-y-6 relative group">
              {/* Step number watermark */}
              <div className="absolute top-6 right-6 text-7xl font-black opacity-[0.04] select-none pointer-events-none"
                style={{ color }}>
                {step}
              </div>

              {/* Top: step tag + stat */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-[9px] font-black uppercase tracking-[0.2em]" style={{ color }}>Step {step} · {tag}</span>
                  <h3 className="text-lg font-black text-white mt-0.5">{headline}</h3>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-2xl font-black" style={{ color }}>{stat}</p>
                  <p className="text-[9px] text-zinc-600 uppercase tracking-wide">{statLabel}</p>
                </div>
              </div>

              {/* Body */}
              <p className="text-sm text-zinc-400 leading-relaxed">{body}</p>

              {/* Bullet points */}
              <ul className="space-y-2">
                {bullets.map(b => (
                  <li key={b} className="flex items-start gap-2.5 text-sm text-zinc-400">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
                    {b}
                  </li>
                ))}
              </ul>

              {/* Flow label */}
              <div className="pt-4 border-t border-zinc-800/50 flex items-center gap-2">
                <div className="h-px flex-1" style={{ background: `linear-gradient(to right, ${color}60, transparent)` }} />
                <span className="text-[10px] font-black uppercase tracking-widest" style={{ color }}>{flow}</span>
                <div className="h-px flex-1" style={{ background: `linear-gradient(to left, ${color}60, transparent)` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Full-Screen Simulation Modal Overlay ──────────────────────────── */}
      {showMathModal && (
        <div className="fixed inset-0 z-50 bg-[#04060b]/96 backdrop-blur-2xl overflow-y-auto flex flex-col justify-start p-4 md:p-10 select-none animate-fade-in">
          
          {/* Close button top right */}
          <button
            onClick={() => setShowMathModal(false)}
            className="absolute top-6 right-6 z-50 px-4 py-2 bg-zinc-950 border border-zinc-800 hover:border-red-500/50 text-zinc-400 hover:text-red-500 transition-all rounded-xl font-bold uppercase tracking-wider text-xs cursor-pointer flex items-center gap-1.5">
            <span>✕</span> Close Simulation
          </button>

          {/* ── Case 1: LOADING MATRIX ── */}
          {tmLoading && (
            <div className="flex-1 flex flex-col items-center justify-center max-w-lg mx-auto w-full space-y-6">
              <div className="relative">
                <div className="h-20 w-20 rounded-full border border-[#F59E0B]/20 flex items-center justify-center animate-spin duration-1000">
                  <div className="h-14 w-14 rounded-full border-t-2 border-[#F59E0B] shadow-[0_0_15px_#F59E0B]" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center text-xs text-[#F59E0B] font-black tracking-widest animate-pulse">
                  SIM
                </div>
              </div>
              <div className="w-full bg-zinc-950 border border-zinc-800/80 rounded-2xl p-5 font-mono text-[11px] text-zinc-400 text-left space-y-2.5 shadow-2xl">
                <div className="flex items-center gap-2 border-b border-zinc-900 pb-2 mb-2">
                  <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
                  <span className="text-[#F59E0B] font-bold">TIMELINECOURT QUANT ENGINE</span>
                </div>
                <p className="animate-pulse"><span className="text-[#06B6D4]">[INIT]</span> Calibrating cross-era space-time coordinates...</p>
                <p className="delay-100 opacity-90"><span className="text-[#06B6D4]">[INFO]</span> Resolving positional cohort: PG/SG/SF/PF/C baselines...</p>
                <p className="delay-300 opacity-80"><span className="text-[#8B5CF6]">[CALC]</span> Subtracting peer mean, dividing by standard deviation...</p>
                <p className="delay-500 opacity-70"><span className="text-[#8B5CF6]">[MATH]</span> Projecting Z-scores into target era baseline vectors...</p>
                <p className="delay-700 opacity-50"><span className="text-[#10B981]">[DQI]</span> Adjusting volume metrics for era defense index...</p>
                <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden mt-3">
                  <div className="h-full bg-gradient-to-right bg-gradient-to-r from-red-600 via-[#F59E0B] to-[#06B6D4] animate-pulse w-4/5" />
                </div>
              </div>
            </div>
          )}

          {/* ── Case 2: RESOLVED DETAILS ── */}
          {tmResult && !tmLoading && (() => {
            const player = PLAYER_NODES.find(p => p.id === tmPlayerId)!;
            const c = CLUSTER_DEFS[player.cluster];
            
            return (
              <div className="max-w-6xl w-full mx-auto my-auto space-y-8 animate-fade-in relative z-10 py-6 text-left">
                
                {/* Simulation Header */}
                <div className="flex items-center gap-5 border-b border-zinc-800/60 pb-6 flex-wrap">
                  <div className="relative h-20 w-20 rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800 shadow-xl flex-shrink-0">
                    <img
                      src={headshotUrl(tmPlayerId)}
                      alt={player.name}
                      className="h-full w-full object-cover object-top"
                      onError={e => { (e.target as HTMLImageElement).src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='%23111827'/%3E%3Ccircle cx='32' cy='22' r='12' fill='%23374151'/%3E%3Cellipse cx='32' cy='56' rx='20' ry='14' fill='%23374151'/%3E%3C/svg%3E`; }}
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[9px] font-black px-2 py-0.5 bg-red-600 text-white rounded uppercase tracking-wider">
                        {tmResult.player_position} Position
                      </span>
                      <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                        PACE NORMALIZED SIMULATION #{(player.id * 107).toString(16).toUpperCase()}
                      </span>
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-white font-display">
                      {player.name}
                    </h1>
                    <p className="text-sm text-zinc-400 mt-1">
                      Translating {tmResult.original_era} performance metrics ({tmResult.source_pace} Pace) into the <span className="text-[#F59E0B] font-bold">{tmResult.projected_era}</span> ({tmResult.target_pace} Pace) using Per-100 Possessions Z-Scoring & DQI.
                    </p>
                  </div>
                </div>

                {/* The 3-Step Mathematical Pipeline Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                  {/* STEP 1: Era Normalization in Per-100 */}
                  <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between"
                    style={{ boxShadow: '0 4px 30px rgba(0, 0, 0, 0.4)' }}>
                    <div className="absolute top-0 left-0 right-0 h-1 bg-[#06B6D4]" />
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-black uppercase text-[#06B6D4] tracking-widest">Stage 01</span>
                        <span className="text-[10px] px-2 py-0.5 bg-[#06B6D4]/10 text-[#06B6D4] border border-[#06B6D4]/20 rounded-md font-bold uppercase">
                          Per-100 Z-Score
                        </span>
                      </div>
                      <h3 className="text-lg font-black text-white">Convert & Z-Score</h3>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Convert raw stats to Per-100 Possessions ((raw × 100) / pace), then calculate positional Z-scores against source era baselines.
                      </p>
                      
                      {/* Interactive Math Box */}
                      <div className="bg-zinc-900/40 p-4 rounded-xl border border-zinc-800/60 space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Equation Model</p>
                        <div className="flex items-center justify-center py-2 text-xs font-mono text-[#06B6D4] border-y border-zinc-800/40 bg-black/20 my-1 font-bold">
                          Z_pos = (Stat_100 - μ_100) / σ_100
                        </div>
                        <div className="text-[10px] space-y-1.5 text-zinc-400">
                          <p>• <span className="text-white">PPG Z:</span> ({tmResult.original_ppg_per100} - {(tmResult.source_baselines.ppg.mean * (100 / tmResult.source_pace)).toFixed(1)}) / {(tmResult.source_baselines.ppg.std * (100 / tmResult.source_pace)).toFixed(1)} = <span className="text-[#06B6D4] font-bold">{tmResult.z_scores.ppg}</span></p>
                          <p>• <span className="text-white">APG Z:</span> ({tmResult.original_apg_per100} - {(tmResult.source_baselines.apg.mean * (100 / tmResult.source_pace)).toFixed(1)}) / {(tmResult.source_baselines.apg.std * (100 / tmResult.source_pace)).toFixed(1)} = <span className="text-[#06B6D4] font-bold">{tmResult.z_scores.apg}</span></p>
                          <p>• <span className="text-white">RPG Z:</span> ({tmResult.original_rpg_per100} - {(tmResult.source_baselines.rpg.mean * (100 / tmResult.source_pace)).toFixed(1)}) / {(tmResult.source_baselines.rpg.std * (100 / tmResult.source_pace)).toFixed(1)} = <span className="text-[#06B6D4] font-bold">{tmResult.z_scores.rpg}</span></p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* STEP 2: Cross-Era Translation in Per-100 */}
                  <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between"
                    style={{ boxShadow: '0 4px 30px rgba(0, 0, 0, 0.4)' }}>
                    <div className="absolute top-0 left-0 right-0 h-1 bg-[#8B5CF6]" />
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-black uppercase text-[#8B5CF6] tracking-widest">Stage 02</span>
                        <span className="text-[10px] px-2 py-0.5 bg-[#8B5CF6]/10 text-[#8B5CF6] border border-[#8B5CF6]/20 rounded-md font-bold uppercase">
                          Per-100 Translation
                        </span>
                      </div>
                      <h3 className="text-lg font-black text-white">Translate & Re-Pace</h3>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Map Z-scores onto target era Per-100 positional baselines, then scale back to raw target era volume (Per-100 × (pace / 100)).
                      </p>

                      {/* Interactive Math Box */}
                      <div className="bg-zinc-900/40 p-4 rounded-xl border border-zinc-800/60 space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Equation Model</p>
                        <div className="flex items-center justify-center py-2 text-xs font-mono text-[#8B5CF6] border-y border-zinc-800/40 bg-black/20 my-1 font-bold">
                          Base_Raw = [μ_target100 + Z*σ_target100] * (Pace/100)
                        </div>
                        <div className="text-[10px] space-y-1.5 text-zinc-400">
                          <p>• <span className="text-white">Base PPG:</span> {tmResult.base_projected_per100.ppg} Per-100 → <span className="text-[#8B5CF6] font-bold">{tmResult.base_projected_raw.ppg}</span> raw</p>
                          <p>• <span className="text-white">Base APG:</span> {tmResult.base_projected_per100.apg} Per-100 → <span className="text-[#8B5CF6] font-bold">{tmResult.base_projected_raw.apg}</span> raw</p>
                          <p>• <span className="text-white">Base RPG:</span> {tmResult.base_projected_per100.rpg} Per-100 → <span className="text-[#8B5CF6] font-bold">{tmResult.base_projected_raw.rpg}</span> raw</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* STEP 3: Defensive Scaling */}
                  <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between"
                    style={{ boxShadow: '0 4px 30px rgba(0, 0, 0, 0.4)' }}>
                    <div className="absolute top-0 left-0 right-0 h-1 bg-[#10B981]" />
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-black uppercase text-[#10B981] tracking-widest">Stage 03</span>
                        <span className="text-[10px] px-2 py-0.5 bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20 rounded-md font-bold uppercase">
                          DQI Scale Factor
                        </span>
                      </div>
                      <h3 className="text-lg font-black text-white">Apply Defensive Index</h3>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Scale raw pace-adjusted metrics by historical Offensive Rating (ORTG) to reflect era-specific scoring difficulty.
                      </p>

                      {/* Interactive Math Box */}
                      <div className="bg-zinc-900/40 p-4 rounded-xl border border-zinc-800/60 space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Equation Model</p>
                        <div className="flex items-center justify-center py-2 text-xs font-mono text-[#10B981] border-y border-zinc-800/40 bg-black/20 my-1 font-bold">
                          Final = Base_Raw * (ORTG_target / ORTG_source)
                        </div>
                        <div className="text-[10px] space-y-1.5 text-zinc-400">
                          <div className="flex justify-between text-zinc-500 font-bold">
                            <span>Target ORTG: {ERA_ORTG[tmResult.projected_era]}</span>
                            <span>Source ORTG: {ERA_ORTG[tmResult.original_era]}</span>
                          </div>
                          <p className="text-center font-bold text-white text-[11px] py-1 border border-zinc-800/60 bg-zinc-950/50 rounded-lg">
                            DQI Multiplier: <span className="text-[#10B981] font-mono font-black">{tmResult.dqi}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Final Comparative Metrics Table */}
                <div className="bg-zinc-950/60 border border-zinc-850 rounded-2xl p-6 space-y-4 shadow-xl">
                  <h3 className="text-2xl font-black text-white uppercase tracking-wider">Translation Audit Matrix</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-mono text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-zinc-800 text-zinc-500 uppercase tracking-widest text-xs">
                          <th className="pb-4 text-left">Stat Category</th>
                          <th className="pb-4 text-center">Original (Raw / Per-100)</th>
                          <th className="pb-4 text-center">Source Z-Score</th>
                          <th className="pb-4 text-center">Projected Per-100</th>
                          <th className="pb-4 text-center">Projected Raw</th>
                          <th className="pb-4 text-center text-[#F59E0B]">Final (DQI Scaled)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-900 text-zinc-300">
                        {/* PPG ROW */}
                        <tr className="hover:bg-zinc-900/30">
                          <td className="py-5 font-sans font-bold text-white text-lg">Points (PPG)</td>
                          <td className="py-5 text-center font-bold text-zinc-400 text-base">
                            {tmResult.original_ppg} <span className="text-xs text-zinc-500">/ {tmResult.original_ppg_per100}</span>
                          </td>
                          <td className="py-5 text-center text-[#06B6D4] font-bold text-base">
                            {tmResult.z_scores.ppg > 0 ? '+' : ''}{tmResult.z_scores.ppg}
                          </td>
                          <td className="py-5 text-center text-[#8B5CF6] font-bold text-base">{tmResult.base_projected_per100.ppg}</td>
                          <td className="py-5 text-center text-zinc-400 text-base">{tmResult.base_projected_raw.ppg}</td>
                          <td className="py-5 text-center text-[#F59E0B] font-black text-2xl">{tmResult.projected_ppg}</td>
                        </tr>
                        {/* APG ROW */}
                        <tr className="hover:bg-zinc-900/30">
                          <td className="py-5 font-sans font-bold text-white text-lg">Assists (APG)</td>
                          <td className="py-5 text-center font-bold text-zinc-400 text-base">
                            {tmResult.original_apg} <span className="text-xs text-zinc-500">/ {tmResult.original_apg_per100}</span>
                          </td>
                          <td className="py-5 text-center text-[#06B6D4] font-bold text-base">
                            {tmResult.z_scores.apg > 0 ? '+' : ''}{tmResult.z_scores.apg}
                          </td>
                          <td className="py-5 text-center text-[#8B5CF6] font-bold text-base">{tmResult.base_projected_per100.apg}</td>
                          <td className="py-5 text-center text-zinc-400 text-base">{tmResult.base_projected_raw.apg}</td>
                          <td className="py-5 text-center text-[#F59E0B] font-black text-2xl">{tmResult.projected_apg}</td>
                        </tr>
                        {/* RPG ROW */}
                        <tr className="hover:bg-zinc-900/30">
                          <td className="py-5 font-sans font-bold text-white text-lg">Rebounds (RPG)</td>
                          <td className="py-5 text-center font-bold text-zinc-400 text-base">
                            {tmResult.original_rpg} <span className="text-xs text-zinc-500">/ {tmResult.original_rpg_per100}</span>
                          </td>
                          <td className="py-5 text-center text-[#06B6D4] font-bold text-base">
                            {tmResult.z_scores.rpg > 0 ? '+' : ''}{tmResult.z_scores.rpg}
                          </td>
                          <td className="py-5 text-center text-[#8B5CF6] font-bold text-base">{tmResult.base_projected_per100.rpg}</td>
                          <td className="py-5 text-center text-zinc-400 text-base">{tmResult.base_projected_raw.rpg}</td>
                          <td className="py-5 text-center text-[#F59E0B] font-black text-2xl">{tmResult.projected_rpg}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Formula Interpretation Footnote */}
                <div className="bg-zinc-950/40 border border-zinc-900 rounded-2xl p-5 text-zinc-400 text-sm leading-relaxed">
                  <span className="text-white font-bold uppercase mr-2 text-sm">Audit Notes:</span> Z-scores measure standard deviations above positional baseline mean (μ) in Per-100 possessions. Stats are pace-adjusted by multiplying translated Per-100 values by target team pace (pace / 100), and then scaled by DQI (the target-to-source Defensive Quality ratio) to evaluate historical efficiency.
                </div>

              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};
