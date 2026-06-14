import { players as mockPlayers } from './players';
import type { Player } from './players';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

interface TokenResponse {
  access: string;
  refresh: string;
}

// Cache for database players to support offline fallback matching
let cachedDbPlayers: Player[] = [];

// Token Storage Helpers
export const getAccessToken = () => localStorage.getItem('nba_access_token');
export const getRefreshToken = () => localStorage.getItem('nba_refresh_token');
export const setTokens = (access: string, refresh: string) => {
  localStorage.setItem('nba_access_token', access);
  localStorage.setItem('nba_refresh_token', refresh);
};
export const clearTokens = () => {
  localStorage.removeItem('nba_access_token');
  localStorage.removeItem('nba_refresh_token');
};

// Auto Refresh Token helper
async function refreshAuthToken(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) return null;

  try {
    const res = await fetch(`${BASE_URL}/api/users/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    });
    if (res.ok) {
      const data = await res.json();
      localStorage.setItem('nba_access_token', data.access);
      return data.access;
    }
  } catch (e) {
    console.error('Failed to refresh token:', e);
  }
  clearTokens();
  return null;
}

// Request Wrapper
async function request(path: string, options: RequestInit = {}): Promise<any> {
  const url = `${BASE_URL}${path}`;
  const headers = new Headers(options.headers || {});
  
  // Set json Content-Type if we have a body and it is not FormData
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // Inject access token if available
  let access = getAccessToken();
  if (access) {
    headers.set('Authorization', `Bearer ${access}`);
  }

  options.headers = headers;

  try {
    let response = await fetch(url, options);

    // If unauthorized, attempt token refresh
    if (response.status === 401) {
      const newAccess = await refreshAuthToken();
      if (newAccess) {
        headers.set('Authorization', `Bearer ${newAccess}`);
        options.headers = headers;
        response = await fetch(url, options);
      }
    }

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    // Handle empty responses
    if (response.status === 204) return null;

    return await response.json();
  } catch (err) {
    console.warn(`Fetch to ${url} failed. Fallback may be used.`, err);
    throw err;
  }
}

// API Services
export const api = {
  // Authentication
  async register(body: any) {
    try {
      return await request('/api/users/register/', {
        method: 'POST',
        body: JSON.stringify(body),
      });
    } catch (err) {
      console.warn("Backend offline. Simulating profile registration (demo mode).", err);
      return { username: body.username, email: body.email };
    }
  },

  async login(body: any): Promise<TokenResponse> {
    try {
      const tokens = await request('/api/users/login/', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      setTokens(tokens.access, tokens.refresh);
      return tokens;
    } catch (err) {
      console.warn("Backend offline. Simulating analyst login (demo mode).", err);
      const mockTokens = {
        access: 'mock-access-token-' + Math.random().toString(),
        refresh: 'mock-refresh-token-' + Math.random().toString()
      };
      setTokens(mockTokens.access, mockTokens.refresh);
      return mockTokens;
    }
  },

  async getProfile() {
    return await request('/api/users/profile/');
  },

  // Players
  async getPlayers(): Promise<Player[]> {
    try {
      const playersList = await request('/api/players/');
      cachedDbPlayers = playersList;
      return playersList;
    } catch {
      return mockPlayers; // Fallback
    }
  },

  async getPlayerById(id: string): Promise<any> {
    try {
      return await request(`/api/players/${id}/`);
    } catch {
      const found = mockPlayers.find(p => p.id === id);
      return found ? { ...found, demographics: {}, stats: [] } : null;
    }
  },

  async searchPlayers(q: string): Promise<Player[]> {
    try {
      return await request(`/api/players/search/?q=${encodeURIComponent(q)}`);
    } catch {
      return mockPlayers.filter(p => p.name.toLowerCase().includes(q.toLowerCase()));
    }
  },

  // Teams (Roster Management)
  async getTeams(): Promise<any[]> {
    try {
      return await request('/api/players/teams/');
    } catch {
      const stored = localStorage.getItem('nba_legacy_teams');
      return stored ? JSON.parse(stored) : [];
    }
  },

  async saveTeam(name: string, playersList: { player: string; lineup_position: string }[]) {
    try {
      return await request('/api/players/teams/', {
        method: 'POST',
        body: JSON.stringify({
          name,
          team_players: playersList,
        }),
      });
    } catch {
      // Offline fallback saving
      const stored = localStorage.getItem('nba_legacy_teams');
      let teams = stored ? JSON.parse(stored) : [];
      const roster: any = {};
      playersList.forEach(item => {
        const found = cachedDbPlayers.find(p => String(p.id) === String(item.player)) ||
                      mockPlayers.find(p => String(p.id) === String(item.player)) ||
                      mockPlayers.find(p => p.name.toLowerCase() === String(item.player).toLowerCase() || p.id === item.player);
        roster[item.lineup_position] = found || null;
      });
      const newTeam = { name, roster };
      teams = [newTeam, ...teams.filter((t: any) => t.name !== name)];
      localStorage.setItem('nba_legacy_teams', JSON.stringify(teams));
      return { id: Math.random().toString(), name, team_players: playersList };
    }
  },

  async deleteTeam(id: string) {
    try {
      return await request(`/api/players/teams/${id}/`, {
        method: 'DELETE',
      });
    } catch {
      // Offline fallback deleting
      const stored = localStorage.getItem('nba_legacy_teams');
      if (stored) {
        let teams = JSON.parse(stored);
        teams = teams.filter((t: any) => t.id !== id && t.name !== id);
        localStorage.setItem('nba_legacy_teams', JSON.stringify(teams));
      }
    }
  },

  // Matchups Simulator
  async simulateMatchup(teamAId: string, teamBId: string, simType: 'rule_based' | 'ml') {
    try {
      return await request('/api/matchups/simulate/', {
        method: 'POST',
        body: JSON.stringify({
          team_a: teamAId,
          team_b: teamBId,
          simulation_type: simType,
        }),
      });
    } catch {
      // Offline fallback logic
      const stored = localStorage.getItem('nba_legacy_teams');
      const teams = stored ? JSON.parse(stored) : [];
      const tA = teams.find((t: any) => t.id === teamAId || t.name === teamAId);
      const tB = teams.find((t: any) => t.id === teamBId || t.name === teamBId);
      
      const getTeamPPG = (t: any) => {
        if (!t) return 100;
        const roster = Object.values(t.roster).filter(Boolean) as Player[];
        if (roster.length === 0) return 100;
        return roster.reduce((sum, p) => sum + p.ppg, 0);
      };

      const ppgA = getTeamPPG(tA);
      const ppgB = getTeamPPG(tB);
      const total = ppgA + ppgB;
      const probA = Math.round((ppgA / total) * 100);

      const scoreA = 100 + Math.floor(Math.random() * 20);
      const scoreB = 100 + Math.floor(Math.random() * 20);

      return {
        winner: probA >= 50 ? (tA?.name || 'Team A') : (tB?.name || 'Team B'),
        probability_a: probA,
        probability_b: 100 - probA,
        score_a: scoreA,
        score_b: scoreB,
        ratings: { team_a: 94.2, team_b: 92.8 },
        mvp: mockPlayers[0],
        position_battles: [
          { position: 'PG', winner: 'Team A', details: 'Superior volume range' },
          { position: 'SG', winner: 'Team A', details: 'Midrange dominance' },
          { position: 'SF', winner: 'Team B', details: 'Transition efficiency' },
          { position: 'PF', winner: 'Team B', details: 'Rebounding superiority' },
          { position: 'C', winner: 'Team A', details: 'Rim defense dominance' },
        ],
      };
    }
  },

  // AI Analyst Chat
  async getAIAnalysis(question: string, teamAId?: string, teamBId?: string, playerAId?: string, playerBId?: string) {
    try {
      return await request('/api/matchups/ai/analyze/', {
        method: 'POST',
        body: JSON.stringify({
          question,
          team_a_id: teamAId,
          team_b_id: teamBId,
          player_a_id: playerAId,
          player_b_id: playerBId,
        }),
      });
    } catch {
      return {
        analysis: `### Offline Mode AI Insight
        
Failed to contact the backend AI model at \`http://localhost:8000\`.

**General Analysis of Query:**
- **Topic:** ${question}
- **Advice:** Spacing and True Shooting percentage remain the highest indicators of simulation victory shares. Add players with >60% TS (e.g. Stephen Curry or LeBron James) to elevate ratings.`,
      };
    }
  },

  // Era Analytics Explorer
  async getEras() {
    try {
      return await request('/api/eras/');
    } catch {
      return [
        { name: '1960s', pace: 118, ppg: 110.4, orfg: 45.2, ts: 51.2 },
        { name: '1975s', pace: 108, ppg: 105.8, orfg: 47.5, ts: 53.0 },
        { name: '1990s', pace: 90, ppg: 95.6, orfg: 50.1, ts: 54.2 },
        { name: 'Modern', pace: 100, ppg: 114.2, orfg: 56.4, ts: 58.5 },
      ];
    }
  },

  async compareEras(eraA: string, eraB: string) {
    try {
      return await request(`/api/eras/compare/?era_a=${encodeURIComponent(eraA)}&era_b=${encodeURIComponent(eraB)}`);
    } catch {
      return {
        era_a: { pace: 90, ppg: 95.6, ts: 54.2 },
        era_b: { pace: 100, ppg: 114.2, ts: 58.5 },
      };
    }
  },

  async getEraRankings(era: string) {
    try {
      return await request(`/api/eras/rankings/?era=${encodeURIComponent(era)}`);
    } catch {
      // Return ranking structure
      const list = mockPlayers.filter(p => era === 'All' || p.era === era);
      return {
        scorers: list.slice(0, 3).map((p, i) => ({ name: p.name, value: p.ppg, rank: i + 1 })),
        shooters: list.slice(1, 4).map((p, i) => ({ name: p.name, value: p.ts, rank: i + 1 })),
        playmakers: list.slice(2, 5).map((p, i) => ({ name: p.name, value: p.apg, rank: i + 1 })),
        defenders: list.slice(0, 3).map((p, i) => ({ name: p.name, value: p.netRating, rank: i + 1 })),
      };
    }
  },

  async getEraTrends() {
    try {
      return await request('/api/eras/trends/');
    } catch {
      return [
        { year: 1980, pace: 101.4, ppg: 109.3, ts: 53.1 },
        { year: 1990, pace: 96.6, ppg: 107.0, ts: 53.7 },
        { year: 2000, pace: 91.3, ppg: 94.8, ts: 51.8 },
        { year: 2010, pace: 92.7, ppg: 99.6, ts: 54.3 },
        { year: 2020, pace: 100.3, ppg: 112.1, ts: 57.2 },
        { year: 2026, pace: 100.8, ppg: 114.7, ts: 58.6 },
      ];
    }
  },

  async getPlayerEraContext(playerId: string) {
    try {
      return await request(`/api/players/${playerId}/era-context/`);
    } catch {
      const found = mockPlayers.find(p => p.id === playerId);
      if (!found) return { ppg_diff: 0, ts_diff: 0, scale: 'Average' };
      return {
        ppg_diff: 4.8,
        ts_diff: 3.4,
        scale: found.ppg > 25 ? 'Elite Performer' : 'Above Average',
      };
    }
  },

  async getBasketballNews(): Promise<any[]> {
    try {
      return await request('/api/news/');
    } catch {
      return [
        {
          title: 'Draft Prospects Surge as Modern NBA Space Prompts Shooting Scarcity Shift',
          source: 'HOOPS NATION',
          published_at: new Date().toISOString(),
          url: 'https://nba.com',
        },
        {
          title: 'ML Prediction Models Showcase Positional Z-Scoring Evolution in Draft Value',
          source: 'COURTSIDE STATS',
          published_at: new Date(Date.now() - 3600000).toISOString(),
          url: 'https://nba.com',
        },
        {
          title: 'Cross-Era Simulators Project Historical 1990s Defensive Scaling Ratings',
          source: 'LEGACY ANALYTICS',
          published_at: new Date(Date.now() - 7200000).toISOString(),
          url: 'https://nba.com',
        },
      ];
    }
  }
};
