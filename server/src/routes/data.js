import { Router } from 'express';
import { getDb } from '../models/database.js';
import { isApiConfigured, getTeams, getTeamPlayers } from '../services/apiFootball.js';

const router = Router();

/**
 * GET /api/data/status - Check if API-Football is configured
 */
router.get('/status', (req, res) => {
  res.json({
    api_configured: isApiConfigured(),
    message: isApiConfigured()
      ? 'API-Football is configured and ready'
      : 'Using seed data. Set API_FOOTBALL_KEY env var to use live data from API-Football.',
  });
});

/**
 * POST /api/data/sync - Sync player data from API-Football
 * Fetches all MLS teams and their players, then updates the database.
 * Note: This uses many API calls (1 for teams + 1 per team), so use sparingly on free tier.
 */
router.post('/sync', async (req, res) => {
  if (!isApiConfigured()) {
    return res.status(400).json({
      error: 'API_FOOTBALL_KEY is not configured. Set the environment variable and restart the server.',
    });
  }

  const db = getDb();
  const season = req.body.season || new Date().getFullYear();

  try {
    const teams = await getTeams(season);
    let totalPlayers = 0;

    const upsertPlayer = db.prepare(`
      INSERT INTO players (api_id, name, team, team_id, position, price, minutes_played, goals, assists, yellow_cards, red_cards, saves, shots_on_target, key_passes, clearances, passes_completed, passes_attempted)
      VALUES (@api_id, @name, @team, @team_id, @position, @price, @minutes_played, @goals, @assists, @yellow_cards, @red_cards, @saves, @shots_on_target, @key_passes, @clearances, @passes_completed, @passes_attempted)
      ON CONFLICT(api_id) DO UPDATE SET
        name = @name, team = @team, team_id = @team_id, position = @position,
        minutes_played = @minutes_played, goals = @goals, assists = @assists,
        yellow_cards = @yellow_cards, red_cards = @red_cards, saves = @saves,
        shots_on_target = @shots_on_target, key_passes = @key_passes,
        clearances = @clearances, passes_completed = @passes_completed,
        passes_attempted = @passes_attempted
    `);

    for (const team of teams) {
      try {
        const players = await getTeamPlayers(team.id, season);
        for (const p of players) {
          // Estimate price based on stats
          const price = estimatePrice(p);
          upsertPlayer.run({ ...p, price });
          totalPlayers++;
        }
      } catch (err) {
        console.error(`Error fetching players for ${team.name}:`, err.message);
      }
    }

    res.json({
      message: `Synced ${totalPlayers} players from ${teams.length} MLS teams`,
      teams: teams.length,
      players: totalPlayers,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/data/gameweeks - Get all gameweeks
 */
router.get('/gameweeks', (req, res) => {
  const db = getDb();
  const gameweeks = db.prepare('SELECT * FROM gameweeks ORDER BY number').all();
  res.json(gameweeks);
});

function estimatePrice(player) {
  let base = 4.5;

  // Boost by goals
  base += (player.goals || 0) * 0.3;
  // Boost by assists
  base += (player.assists || 0) * 0.2;
  // Boost by minutes (indicates regular starter)
  if (player.minutes_played > 2000) base += 1.0;
  else if (player.minutes_played > 1000) base += 0.5;

  // Cap between 4.0 and 13.0
  return Math.round(Math.min(13.0, Math.max(4.0, base)) * 10) / 10;
}

export default router;
