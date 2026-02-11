/**
 * API-Football Integration Service
 *
 * Uses the free tier of API-Football (v3) to fetch MLS player data and stats.
 * Free tier: 100 requests/day.
 *
 * To use: set the API_FOOTBALL_KEY environment variable with your API key.
 * Get a free key at: https://www.api-football.com/ or https://rapidapi.com/api-sports/api/api-football
 */

const API_BASE = 'https://v3.football.api-sports.io';
const MLS_LEAGUE_ID = 253; // MLS league ID in API-Football

function getHeaders() {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) {
    throw new Error(
      'API_FOOTBALL_KEY environment variable is not set. ' +
      'Get a free API key at https://www.api-football.com/ and set it: ' +
      'export API_FOOTBALL_KEY=your_key_here'
    );
  }
  return {
    'x-apisports-key': key,
    'Content-Type': 'application/json',
  };
}

async function apiFetch(endpoint, params = {}) {
  const url = new URL(`${API_BASE}${endpoint}`);
  for (const [key, val] of Object.entries(params)) {
    url.searchParams.set(key, val);
  }

  const res = await fetch(url.toString(), { headers: getHeaders() });
  if (!res.ok) {
    throw new Error(`API-Football error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  if (data.errors && Object.keys(data.errors).length > 0) {
    throw new Error(`API-Football errors: ${JSON.stringify(data.errors)}`);
  }

  return data.response;
}

/**
 * Get the current MLS season year.
 */
export async function getCurrentSeason() {
  const seasons = await apiFetch('/leagues/seasons');
  const currentYear = new Date().getFullYear();
  return seasons.includes(currentYear) ? currentYear : currentYear - 1;
}

/**
 * Fetch all MLS teams for a given season.
 */
export async function getTeams(season) {
  const data = await apiFetch('/teams', {
    league: MLS_LEAGUE_ID,
    season: season || new Date().getFullYear(),
  });
  return data.map(item => ({
    id: item.team.id,
    name: item.team.name,
    logo: item.team.logo,
  }));
}

/**
 * Fetch all players for an MLS team.
 */
export async function getTeamPlayers(teamId, season) {
  const allPlayers = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const data = await apiFetch('/players', {
      team: teamId,
      league: MLS_LEAGUE_ID,
      season: season || new Date().getFullYear(),
      page,
    });

    if (data.length === 0) {
      hasMore = false;
    } else {
      for (const item of data) {
        const stats = item.statistics?.[0] || {};
        const pos = mapPosition(stats.games?.position);
        if (!pos) continue;

        allPlayers.push({
          api_id: item.player.id,
          name: item.player.name,
          team: stats.team?.name || 'Unknown',
          team_id: stats.team?.id || teamId,
          position: pos,
          photo: item.player.photo,
          minutes_played: stats.games?.minutes || 0,
          goals: stats.goals?.total || 0,
          assists: stats.goals?.assists || 0,
          yellow_cards: stats.cards?.yellow || 0,
          red_cards: stats.cards?.red || 0,
          saves: stats.goals?.saves || 0,
          passes_completed: stats.passes?.accuracy ? Math.round((stats.passes.total || 0) * (stats.passes.accuracy / 100)) : 0,
          passes_attempted: stats.passes?.total || 0,
          shots_on_target: stats.shots?.on || 0,
          key_passes: stats.passes?.key || 0,
          clearances: stats.tackles?.blocks || 0,
        });
      }

      if (data.length < 20) {
        hasMore = false;
      }
      page++;
    }
  }

  return allPlayers;
}

/**
 * Fetch MLS fixtures (matches) for a given round/gameweek.
 */
export async function getFixtures(season, round) {
  const params = {
    league: MLS_LEAGUE_ID,
    season: season || new Date().getFullYear(),
  };
  if (round) params.round = `Regular Season - ${round}`;

  return apiFetch('/fixtures', params);
}

/**
 * Fetch player statistics for a specific fixture.
 */
export async function getFixtureStats(fixtureId) {
  const data = await apiFetch('/fixtures/players', { fixture: fixtureId });
  const playerStats = [];

  for (const team of data) {
    for (const p of team.players || []) {
      const stats = p.statistics?.[0] || {};
      playerStats.push({
        api_id: p.player.id,
        name: p.player.name,
        minutes_played: stats.games?.minutes || 0,
        goals: stats.goals?.total || 0,
        assists: stats.goals?.assists || 0,
        saves: stats.goals?.saves || 0,
        yellow_cards: stats.cards?.yellow || 0,
        red_cards: stats.cards?.red || 0,
        shots_on_target: stats.shots?.on || 0,
        key_passes: stats.passes?.key || 0,
        passes_completed: stats.passes?.accuracy ? Math.round((stats.passes.total || 0) * (stats.passes.accuracy / 100)) : 0,
        passes_attempted: stats.passes?.total || 0,
        clearances: stats.tackles?.blocks || 0,
        penalties_saved: stats.penalty?.saved || 0,
        penalties_missed: stats.penalty?.missed || 0,
      });
    }
  }

  return playerStats;
}

function mapPosition(apiPosition) {
  if (!apiPosition) return null;
  const posMap = {
    'Goalkeeper': 'GK',
    'Defender': 'DEF',
    'Midfielder': 'MID',
    'Attacker': 'FWD',
  };
  return posMap[apiPosition] || null;
}

export function isApiConfigured() {
  return !!process.env.API_FOOTBALL_KEY;
}
