export interface Player {
  id: string;
  name: string;
  position: 'PG' | 'SG' | 'SF' | 'PF' | 'C';
  team: string;
  ppg: number;
  rpg: number;
  apg: number;
  ts: number; // True Shooting % (e.g., 62.4)
  netRating: number;
  era: '1960s' | '1970s' | '1980s' | '1990s' | '2000s' | 'Modern';
  headshot: string; // fallback initials or mock avatar urls
  strengths: string[];
  weaknesses: string[];
}

export const players: Player[] = [
  {
    id: 'mj-96',
    name: 'Michael Jordan',
    position: 'SG',
    team: 'CHI',
    ppg: 30.4,
    rpg: 6.6,
    apg: 4.3,
    ts: 58.2,
    netRating: 12.5,
    era: '1990s',
    headshot: 'MJ',
    strengths: ['Midrange Scoring', 'Perimeter Defense', 'Clutch Gene'],
    weaknesses: ['3-Point Volatility']
  },
  {
    id: 'lebron-13',
    name: 'LeBron James',
    position: 'SF',
    team: 'MIA',
    ppg: 26.8,
    rpg: 8.0,
    apg: 7.3,
    ts: 64.0,
    netRating: 14.1,
    era: '2000s',
    headshot: 'LBJ',
    strengths: ['Athletic Playmaking', 'Slashing', 'Court Vision'],
    weaknesses: ['Free Throw Consistency']
  },
  {
    id: 'kobe-08',
    name: 'Kobe Bryant',
    position: 'SG',
    team: 'LAL',
    ppg: 28.3,
    rpg: 6.3,
    apg: 5.4,
    ts: 57.6,
    netRating: 8.4,
    era: '2000s',
    headshot: 'KB',
    strengths: ['Shot Creation', 'Footwork', 'On-ball Defense'],
    weaknesses: ['Shot Selection']
  },
  {
    id: 'curry-16',
    name: 'Stephen Curry',
    position: 'PG',
    team: 'GSW',
    ppg: 30.1,
    rpg: 5.4,
    apg: 6.7,
    ts: 66.9,
    netRating: 15.0,
    era: 'Modern',
    headshot: 'SC',
    strengths: ['Unlimited Range', 'Off-ball Movement', 'Ball Handling'],
    weaknesses: ['Interior Defense']
  },
  {
    id: 'shaq-00',
    name: 'Shaquille O\'Neal',
    position: 'C',
    team: 'LAL',
    ppg: 29.7,
    rpg: 13.6,
    apg: 3.8,
    ts: 57.8,
    netRating: 11.8,
    era: '2000s',
    headshot: 'SO',
    strengths: ['Low-post Dominance', 'Rim Protection', 'Strength'],
    weaknesses: ['Free Throw Shooting', 'Pick-and-roll Defense']
  },
  {
    id: 'magic-87',
    name: 'Magic Johnson',
    position: 'PG',
    team: 'LAL',
    ppg: 23.9,
    rpg: 6.3,
    apg: 12.2,
    ts: 60.2,
    netRating: 10.9,
    era: '1980s',
    headshot: 'MJR',
    strengths: ['Fastbreak Playmaking', 'Size for Position', 'Versatility'],
    weaknesses: ['Perimeter Quickness']
  },
  {
    id: 'bird-86',
    name: 'Larry Bird',
    position: 'SF',
    team: 'BOS',
    ppg: 25.8,
    rpg: 9.8,
    apg: 6.8,
    ts: 58.0,
    netRating: 11.2,
    era: '1980s',
    headshot: 'LB',
    strengths: ['Shooting Touch', 'Passing Instincts', 'Rebounding'],
    weaknesses: ['Lateral Quickness']
  },
  {
    id: 'wilt-67',
    name: 'Wilt Chamberlain',
    position: 'C',
    team: 'PHI',
    ppg: 24.1,
    rpg: 24.2,
    apg: 7.8,
    ts: 54.5,
    netRating: 13.0,
    era: '1960s',
    headshot: 'WC',
    strengths: ['Athleticism', 'Rebounding', 'Rim Protection'],
    weaknesses: ['Free Throw Shooting']
  },
  {
    id: 'duncan-03',
    name: 'Tim Duncan',
    position: 'PF',
    team: 'SAS',
    ppg: 23.3,
    rpg: 12.9,
    apg: 3.9,
    ts: 56.4,
    netRating: 9.9,
    era: '2000s',
    headshot: 'TD',
    strengths: ['Interior Defense', 'Bank Shot', 'Post Playmaker'],
    weaknesses: ['Midrange Shooting']
  },
  {
    id: 'jokic-24',
    name: 'Nikola Jokic',
    position: 'C',
    team: 'DEN',
    ppg: 26.4,
    rpg: 12.4,
    apg: 9.0,
    ts: 65.0,
    netRating: 12.2,
    era: 'Modern',
    headshot: 'NJ',
    strengths: ['Elite Playmaking', 'Post Scoring efficiency', 'Rebounding'],
    weaknesses: ['Rim Protection Quickness']
  },
  {
    id: 'hakeem-94',
    name: 'Hakeem Olajuwon',
    position: 'C',
    team: 'HOU',
    ppg: 27.3,
    rpg: 11.9,
    apg: 3.6,
    ts: 55.4,
    netRating: 10.5,
    era: '1990s',
    headshot: 'HO',
    strengths: ['Dream Shake Post-moves', 'Elite Rim Protection', 'Shot-blocking'],
    weaknesses: ['Passing Out of Double-teams']
  },
  {
    id: 'durant-14',
    name: 'Kevin Durant',
    position: 'SF',
    team: 'OKC',
    ppg: 32.0,
    rpg: 7.4,
    apg: 5.5,
    ts: 63.5,
    netRating: 10.1,
    era: 'Modern',
    headshot: 'KD',
    strengths: ['Three-level Scoring', 'Free Throw Shooting', 'Length'],
    weaknesses: ['Interior Strength']
  },
  {
    id: 'giannis-20',
    name: 'Giannis Antetokounmpo',
    position: 'PF',
    team: 'MIL',
    ppg: 29.5,
    rpg: 13.6,
    apg: 5.6,
    ts: 61.3,
    netRating: 11.5,
    era: 'Modern',
    headshot: 'GA',
    strengths: ['Transitional Driving', 'Rim Protection', 'Defense'],
    weaknesses: ['Perimeter Jump-shot']
  },
  {
    id: 'kareem-76',
    name: 'Kareem Abdul-Jabbar',
    position: 'C',
    team: 'LAL',
    ppg: 27.7,
    rpg: 16.9,
    apg: 5.0,
    ts: 59.8,
    netRating: 10.8,
    era: '1970s',
    headshot: 'KA',
    strengths: ['Skyhook', 'Shot-blocking', 'Rebounding'],
    weaknesses: ['Pick-and-roll defense against guard switches']
  },
  {
    id: 'robertson-62',
    name: 'Oscar Robertson',
    position: 'PG',
    team: 'CIN',
    ppg: 30.8,
    rpg: 12.5,
    apg: 11.4,
    ts: 55.4,
    netRating: 8.5,
    era: '1960s',
    headshot: 'OR',
    strengths: ['Triple-double Production', 'Physical PG', 'Midrange'],
    weaknesses: ['Perimeter Range']
  }
];
