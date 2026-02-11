const API_BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `Request failed: ${res.status}`);
  }

  return data;
}

// Players
export const getPlayers = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return request(`/players?${qs}`);
};

export const getPlayer = (id) => request(`/players/${id}`);

export const getTeams = () => request('/players/meta/teams');

// Squad
export const getSquad = () => request('/squad');

export const addPlayer = (playerId) =>
  request('/squad/players', {
    method: 'POST',
    body: JSON.stringify({ player_id: playerId }),
  });

export const removePlayer = (playerId) =>
  request(`/squad/players/${playerId}`, { method: 'DELETE' });

export const setLineup = (starters, captainId) =>
  request('/squad/lineup', {
    method: 'PUT',
    body: JSON.stringify({ starters, captain_id: captainId }),
  });

export const renameSquad = (name) =>
  request('/squad/name', {
    method: 'PUT',
    body: JSON.stringify({ name }),
  });

// Scoring
export const getScoringRules = () => request('/scoring/rules');
export const getSquadPoints = () => request('/scoring/squad-points');
export const getGameweekStats = (number) => request(`/scoring/gameweek/${number}`);

// Data
export const getDataStatus = () => request('/data/status');
export const getGameweeks = () => request('/data/gameweeks');
export const syncData = (season) =>
  request('/data/sync', {
    method: 'POST',
    body: JSON.stringify({ season }),
  });
