import { Router } from 'express';
import { getDb } from '../models/database.js';

const router = Router();

/**
 * GET /api/players - List all players with optional filters
 * Query params: position, team, search, sort, order, limit, offset
 */
router.get('/', (req, res) => {
  const db = getDb();
  const { position, team, search, sort = 'total_points', order = 'DESC', limit = 100, offset = 0 } = req.query;

  const allowedSorts = ['name', 'team', 'position', 'price', 'total_points', 'goals', 'assists', 'minutes_played', 'clean_sheets'];
  const sortCol = allowedSorts.includes(sort) ? sort : 'total_points';
  const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  let query = 'SELECT * FROM players WHERE 1=1';
  const params = {};

  if (position) {
    query += ' AND position = @position';
    params.position = position;
  }
  if (team) {
    query += ' AND team = @team';
    params.team = team;
  }
  if (search) {
    query += ' AND name LIKE @search';
    params.search = `%${search}%`;
  }

  query += ` ORDER BY ${sortCol} ${sortOrder} LIMIT @limit OFFSET @offset`;
  params.limit = parseInt(limit, 10);
  params.offset = parseInt(offset, 10);

  const players = db.prepare(query).all(params);
  const total = db.prepare('SELECT COUNT(*) as count FROM players').get().count;

  res.json({ players, total });
});

/**
 * GET /api/players/:id - Get a single player with details
 */
router.get('/:id', (req, res) => {
  const db = getDb();
  const player = db.prepare('SELECT * FROM players WHERE id = ?').get(req.params.id);

  if (!player) {
    return res.status(404).json({ error: 'Player not found' });
  }

  // Get gameweek stats
  const gwStats = db.prepare(`
    SELECT pgs.*, g.number as gameweek_number, g.name as gameweek_name
    FROM player_gameweek_stats pgs
    JOIN gameweeks g ON g.id = pgs.gameweek_id
    WHERE pgs.player_id = ?
    ORDER BY g.number DESC
  `).all(req.params.id);

  res.json({ player, gameweek_stats: gwStats });
});

/**
 * GET /api/players/teams - Get all unique team names
 */
router.get('/meta/teams', (req, res) => {
  const db = getDb();
  const teams = db.prepare('SELECT DISTINCT team FROM players ORDER BY team').all();
  res.json(teams.map(t => t.team));
});

export default router;
