import { Router } from 'express';
import { getDb } from '../models/database.js';

const router = Router();

const BUDGET = 100.0;
const MAX_SQUAD_SIZE = 15;
const MAX_PER_TEAM = 3;
const MIN_GK = 2;
const MIN_DEF = 5;
const MIN_MID = 5;
const MIN_FWD = 3;

/**
 * GET /api/squad - Get the current squad
 */
router.get('/', (req, res) => {
  const db = getDb();
  let squad = db.prepare('SELECT * FROM squads ORDER BY id LIMIT 1').get();

  if (!squad) {
    const result = db.prepare('INSERT INTO squads (name, budget) VALUES (?, ?)').run('My MLS Team', BUDGET);
    squad = db.prepare('SELECT * FROM squads WHERE id = ?').get(result.lastInsertRowid);
  }

  const players = db.prepare(`
    SELECT p.*, sp.is_starter, sp.is_captain, sp.is_vice_captain, sp.position_order
    FROM squad_players sp
    JOIN players p ON p.id = sp.player_id
    WHERE sp.squad_id = ?
    ORDER BY
      CASE p.position WHEN 'GK' THEN 1 WHEN 'DEF' THEN 2 WHEN 'MID' THEN 3 WHEN 'FWD' THEN 4 END,
      sp.position_order
  `).all(squad.id);

  const spent = players.reduce((sum, p) => sum + p.price, 0);
  const remaining = BUDGET - spent;

  res.json({
    squad: {
      ...squad,
      budget_remaining: Math.round(remaining * 10) / 10,
      budget_spent: Math.round(spent * 10) / 10,
    },
    players,
  });
});

/**
 * POST /api/squad/players - Add a player to the squad
 */
router.post('/players', (req, res) => {
  const db = getDb();
  const { player_id } = req.body;

  if (!player_id) {
    return res.status(400).json({ error: 'player_id is required' });
  }

  const squad = db.prepare('SELECT * FROM squads ORDER BY id LIMIT 1').get();
  if (!squad) {
    return res.status(404).json({ error: 'No squad found' });
  }

  const player = db.prepare('SELECT * FROM players WHERE id = ?').get(player_id);
  if (!player) {
    return res.status(404).json({ error: 'Player not found' });
  }

  // Check if player already in squad
  const existing = db.prepare('SELECT * FROM squad_players WHERE squad_id = ? AND player_id = ?').get(squad.id, player_id);
  if (existing) {
    return res.status(400).json({ error: 'Player already in squad' });
  }

  // Get current squad players
  const currentPlayers = db.prepare(`
    SELECT p.* FROM squad_players sp JOIN players p ON p.id = sp.player_id WHERE sp.squad_id = ?
  `).all(squad.id);

  // Check squad size
  if (currentPlayers.length >= MAX_SQUAD_SIZE) {
    return res.status(400).json({ error: `Squad is full (max ${MAX_SQUAD_SIZE} players)` });
  }

  // Check budget
  const spent = currentPlayers.reduce((sum, p) => sum + p.price, 0);
  if (spent + player.price > BUDGET) {
    return res.status(400).json({
      error: `Insufficient budget. Remaining: $${(BUDGET - spent).toFixed(1)}M, Player costs: $${player.price}M`,
    });
  }

  // Check max per team
  const sameTeamCount = currentPlayers.filter(p => p.team === player.team).length;
  if (sameTeamCount >= MAX_PER_TEAM) {
    return res.status(400).json({ error: `Max ${MAX_PER_TEAM} players from the same team` });
  }

  // Check position limits
  const positionCounts = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
  for (const p of currentPlayers) positionCounts[p.position]++;
  positionCounts[player.position]++;

  const posLimits = { GK: MIN_GK, DEF: MIN_DEF, MID: MIN_MID, FWD: MIN_FWD };
  if (positionCounts[player.position] > posLimits[player.position]) {
    return res.status(400).json({ error: `Max ${posLimits[player.position]} ${player.position} players allowed in squad` });
  }

  db.prepare(`
    INSERT INTO squad_players (squad_id, player_id, is_starter, is_captain, position_order)
    VALUES (?, ?, 0, 0, ?)
  `).run(squad.id, player_id, positionCounts[player.position]);

  res.json({ message: `${player.name} added to squad` });
});

/**
 * DELETE /api/squad/players/:playerId - Remove a player from the squad
 */
router.delete('/players/:playerId', (req, res) => {
  const db = getDb();
  const squad = db.prepare('SELECT * FROM squads ORDER BY id LIMIT 1').get();
  if (!squad) {
    return res.status(404).json({ error: 'No squad found' });
  }

  const result = db.prepare('DELETE FROM squad_players WHERE squad_id = ? AND player_id = ?').run(squad.id, req.params.playerId);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Player not in squad' });
  }

  res.json({ message: 'Player removed from squad' });
});

/**
 * PUT /api/squad/lineup - Set starters, captain, and formation
 * Body: { starters: [playerId, ...], captain_id: number }
 */
router.put('/lineup', (req, res) => {
  const db = getDb();
  const { starters, captain_id } = req.body;

  if (!starters || !Array.isArray(starters)) {
    return res.status(400).json({ error: 'starters array is required' });
  }

  if (starters.length !== 11) {
    return res.status(400).json({ error: 'Must select exactly 11 starters' });
  }

  const squad = db.prepare('SELECT * FROM squads ORDER BY id LIMIT 1').get();
  if (!squad) {
    return res.status(404).json({ error: 'No squad found' });
  }

  // Verify all starters are in the squad
  const squadPlayers = db.prepare(`
    SELECT p.* FROM squad_players sp JOIN players p ON p.id = sp.player_id WHERE sp.squad_id = ?
  `).all(squad.id);
  const squadPlayerIds = new Set(squadPlayers.map(p => p.id));

  for (const id of starters) {
    if (!squadPlayerIds.has(id)) {
      return res.status(400).json({ error: `Player ${id} is not in your squad` });
    }
  }

  // Check formation validity (min 1 GK, 3 DEF, 3 MID, 1 FWD)
  const starterPlayers = squadPlayers.filter(p => starters.includes(p.id));
  const posCount = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
  for (const p of starterPlayers) posCount[p.position]++;

  if (posCount.GK !== 1) {
    return res.status(400).json({ error: 'Must have exactly 1 GK in starting lineup' });
  }
  if (posCount.DEF < 3) {
    return res.status(400).json({ error: 'Must have at least 3 DEF in starting lineup' });
  }
  if (posCount.MID < 3) {
    return res.status(400).json({ error: 'Must have at least 3 MID in starting lineup' });
  }
  if (posCount.FWD < 1) {
    return res.status(400).json({ error: 'Must have at least 1 FWD in starting lineup' });
  }

  // Validate captain
  if (captain_id && !starters.includes(captain_id)) {
    return res.status(400).json({ error: 'Captain must be a starter' });
  }

  // Update all players in squad
  const starterSet = new Set(starters);

  const update = db.prepare(`
    UPDATE squad_players
    SET is_starter = @is_starter, is_captain = @is_captain
    WHERE squad_id = @squad_id AND player_id = @player_id
  `);

  const updateAll = db.transaction(() => {
    for (const p of squadPlayers) {
      update.run({
        is_starter: starterSet.has(p.id) ? 1 : 0,
        is_captain: captain_id === p.id ? 1 : 0,
        squad_id: squad.id,
        player_id: p.id,
      });
    }
  });

  updateAll();

  const formation = `${posCount.DEF}-${posCount.MID}-${posCount.FWD}`;
  res.json({ message: `Lineup set! Formation: ${formation}`, formation });
});

/**
 * PUT /api/squad/name - Rename the squad
 */
router.put('/name', (req, res) => {
  const db = getDb();
  const { name } = req.body;

  if (!name || name.trim().length === 0) {
    return res.status(400).json({ error: 'Name is required' });
  }

  const squad = db.prepare('SELECT * FROM squads ORDER BY id LIMIT 1').get();
  if (!squad) {
    return res.status(404).json({ error: 'No squad found' });
  }

  db.prepare('UPDATE squads SET name = ? WHERE id = ?').run(name.trim(), squad.id);
  res.json({ message: 'Squad name updated' });
});

export default router;
