import { Router } from 'express';
import { getDb } from '../models/database.js';
import { calculatePoints, calculateSquadPoints, SCORING_RULES } from '../services/scoring.js';

const router = Router();

/**
 * GET /api/scoring/rules - Get the scoring rules
 */
router.get('/rules', (req, res) => {
  res.json(SCORING_RULES);
});

/**
 * GET /api/scoring/calculate/:playerId - Calculate points for a player based on their season stats
 */
router.get('/calculate/:playerId', (req, res) => {
  const db = getDb();
  const player = db.prepare('SELECT * FROM players WHERE id = ?').get(req.params.playerId);

  if (!player) {
    return res.status(404).json({ error: 'Player not found' });
  }

  // Calculate points based on season stats (simplified - per appearance average)
  const { points, breakdown } = calculatePoints(player, player.position);

  res.json({
    player: { id: player.id, name: player.name, position: player.position, team: player.team },
    total_points: points,
    breakdown,
  });
});

/**
 * POST /api/scoring/gameweek - Submit gameweek stats and calculate points
 * Body: { gameweek_number: number, player_stats: [{ player_id, minutes_played, goals, assists, ... }] }
 */
router.post('/gameweek', (req, res) => {
  const db = getDb();
  const { gameweek_number, player_stats } = req.body;

  if (!gameweek_number || !player_stats) {
    return res.status(400).json({ error: 'gameweek_number and player_stats are required' });
  }

  const gameweek = db.prepare('SELECT * FROM gameweeks WHERE number = ?').get(gameweek_number);
  if (!gameweek) {
    return res.status(404).json({ error: 'Gameweek not found' });
  }

  const insertStats = db.prepare(`
    INSERT OR REPLACE INTO player_gameweek_stats (
      player_id, gameweek_id, minutes_played, goals, assists,
      clean_sheet, yellow_cards, red_cards, saves, goals_conceded,
      own_goals, penalties_saved, penalties_missed, shots_on_target,
      key_passes, accurate_crosses, clearances, big_chances_created,
      passes_completed, passes_attempted, points
    ) VALUES (
      @player_id, @gameweek_id, @minutes_played, @goals, @assists,
      @clean_sheet, @yellow_cards, @red_cards, @saves, @goals_conceded,
      @own_goals, @penalties_saved, @penalties_missed, @shots_on_target,
      @key_passes, @accurate_crosses, @clearances, @big_chances_created,
      @passes_completed, @passes_attempted, @points
    )
  `);

  const results = [];

  const insertAll = db.transaction(() => {
    for (const stats of player_stats) {
      const player = db.prepare('SELECT * FROM players WHERE id = ?').get(stats.player_id);
      if (!player) continue;

      const { points, breakdown } = calculatePoints(stats, player.position);

      insertStats.run({
        player_id: stats.player_id,
        gameweek_id: gameweek.id,
        minutes_played: stats.minutes_played || 0,
        goals: stats.goals || 0,
        assists: stats.assists || 0,
        clean_sheet: stats.clean_sheet ? 1 : 0,
        yellow_cards: stats.yellow_cards || 0,
        red_cards: stats.red_cards || 0,
        saves: stats.saves || 0,
        goals_conceded: stats.goals_conceded || 0,
        own_goals: stats.own_goals || 0,
        penalties_saved: stats.penalties_saved || 0,
        penalties_missed: stats.penalties_missed || 0,
        shots_on_target: stats.shots_on_target || 0,
        key_passes: stats.key_passes || 0,
        accurate_crosses: stats.accurate_crosses || 0,
        clearances: stats.clearances || 0,
        big_chances_created: stats.big_chances_created || 0,
        passes_completed: stats.passes_completed || 0,
        passes_attempted: stats.passes_attempted || 0,
        points,
      });

      results.push({
        player_id: stats.player_id,
        name: player.name,
        position: player.position,
        points,
        breakdown,
      });
    }
  });

  insertAll();

  // Calculate squad score for this gameweek
  const squad = db.prepare('SELECT * FROM squads ORDER BY id LIMIT 1').get();
  if (squad) {
    const squadPlayers = db.prepare(`
      SELECT sp.*, p.position, p.name
      FROM squad_players sp
      JOIN players p ON p.id = sp.player_id
      WHERE sp.squad_id = ?
    `).all(squad.id);

    const gwStats = db.prepare(`
      SELECT * FROM player_gameweek_stats WHERE gameweek_id = ?
    `).all(gameweek.id);

    const { totalPoints } = calculateSquadPoints(squadPlayers, gwStats);

    db.prepare(`
      INSERT OR REPLACE INTO squad_gameweek_scores (squad_id, gameweek_id, total_points)
      VALUES (?, ?, ?)
    `).run(squad.id, gameweek.id, totalPoints);
  }

  res.json({ gameweek: gameweek_number, results });
});

/**
 * GET /api/scoring/squad-points - Get squad points across all gameweeks
 */
router.get('/squad-points', (req, res) => {
  const db = getDb();
  const squad = db.prepare('SELECT * FROM squads ORDER BY id LIMIT 1').get();

  if (!squad) {
    return res.json({ total_points: 0, gameweeks: [] });
  }

  const scores = db.prepare(`
    SELECT sgs.*, g.number as gameweek_number, g.name as gameweek_name
    FROM squad_gameweek_scores sgs
    JOIN gameweeks g ON g.id = sgs.gameweek_id
    WHERE sgs.squad_id = ?
    ORDER BY g.number
  `).all(squad.id);

  const totalPoints = scores.reduce((sum, s) => sum + s.total_points, 0);

  res.json({ total_points: totalPoints, gameweeks: scores });
});

/**
 * GET /api/scoring/gameweek/:number - Get all player stats for a gameweek
 */
router.get('/gameweek/:number', (req, res) => {
  const db = getDb();
  const gameweek = db.prepare('SELECT * FROM gameweeks WHERE number = ?').get(req.params.number);

  if (!gameweek) {
    return res.status(404).json({ error: 'Gameweek not found' });
  }

  const stats = db.prepare(`
    SELECT pgs.*, p.name, p.team, p.position
    FROM player_gameweek_stats pgs
    JOIN players p ON p.id = pgs.player_id
    WHERE pgs.gameweek_id = ?
    ORDER BY pgs.points DESC
  `).all(gameweek.id);

  res.json({ gameweek, stats });
});

export default router;
