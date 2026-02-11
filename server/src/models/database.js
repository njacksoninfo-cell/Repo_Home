import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = join(__dirname, '..', '..', 'fantasy.db');

let db;

export function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initializeSchema();
  }
  return db;
}

function initializeSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY,
      api_id INTEGER UNIQUE,
      name TEXT NOT NULL,
      team TEXT NOT NULL,
      team_id INTEGER,
      position TEXT NOT NULL CHECK(position IN ('GK', 'DEF', 'MID', 'FWD')),
      price REAL NOT NULL DEFAULT 5.0,
      photo TEXT,
      total_points INTEGER DEFAULT 0,
      minutes_played INTEGER DEFAULT 0,
      goals INTEGER DEFAULT 0,
      assists INTEGER DEFAULT 0,
      clean_sheets INTEGER DEFAULT 0,
      yellow_cards INTEGER DEFAULT 0,
      red_cards INTEGER DEFAULT 0,
      saves INTEGER DEFAULT 0,
      goals_conceded INTEGER DEFAULT 0,
      own_goals INTEGER DEFAULT 0,
      penalties_saved INTEGER DEFAULT 0,
      penalties_missed INTEGER DEFAULT 0,
      shots_on_target INTEGER DEFAULT 0,
      key_passes INTEGER DEFAULT 0,
      accurate_crosses INTEGER DEFAULT 0,
      clearances INTEGER DEFAULT 0,
      big_chances_created INTEGER DEFAULT 0,
      passes_completed INTEGER DEFAULT 0,
      passes_attempted INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS squads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL DEFAULT 'My Team',
      budget REAL NOT NULL DEFAULT 100.0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS squad_players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      squad_id INTEGER NOT NULL,
      player_id INTEGER NOT NULL,
      is_starter INTEGER NOT NULL DEFAULT 0,
      is_captain INTEGER NOT NULL DEFAULT 0,
      is_vice_captain INTEGER NOT NULL DEFAULT 0,
      position_order INTEGER DEFAULT 0,
      FOREIGN KEY (squad_id) REFERENCES squads(id) ON DELETE CASCADE,
      FOREIGN KEY (player_id) REFERENCES players(id),
      UNIQUE(squad_id, player_id)
    );

    CREATE TABLE IF NOT EXISTS gameweeks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      number INTEGER NOT NULL UNIQUE,
      name TEXT,
      start_date TEXT,
      end_date TEXT,
      is_current INTEGER DEFAULT 0,
      is_finished INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS player_gameweek_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id INTEGER NOT NULL,
      gameweek_id INTEGER NOT NULL,
      minutes_played INTEGER DEFAULT 0,
      goals INTEGER DEFAULT 0,
      assists INTEGER DEFAULT 0,
      clean_sheet INTEGER DEFAULT 0,
      yellow_cards INTEGER DEFAULT 0,
      red_cards INTEGER DEFAULT 0,
      saves INTEGER DEFAULT 0,
      goals_conceded INTEGER DEFAULT 0,
      own_goals INTEGER DEFAULT 0,
      penalties_saved INTEGER DEFAULT 0,
      penalties_missed INTEGER DEFAULT 0,
      shots_on_target INTEGER DEFAULT 0,
      key_passes INTEGER DEFAULT 0,
      accurate_crosses INTEGER DEFAULT 0,
      clearances INTEGER DEFAULT 0,
      big_chances_created INTEGER DEFAULT 0,
      passes_completed INTEGER DEFAULT 0,
      passes_attempted INTEGER DEFAULT 0,
      points INTEGER DEFAULT 0,
      FOREIGN KEY (player_id) REFERENCES players(id),
      FOREIGN KEY (gameweek_id) REFERENCES gameweeks(id),
      UNIQUE(player_id, gameweek_id)
    );

    CREATE TABLE IF NOT EXISTS squad_gameweek_scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      squad_id INTEGER NOT NULL,
      gameweek_id INTEGER NOT NULL,
      total_points INTEGER DEFAULT 0,
      FOREIGN KEY (squad_id) REFERENCES squads(id) ON DELETE CASCADE,
      FOREIGN KEY (gameweek_id) REFERENCES gameweeks(id),
      UNIQUE(squad_id, gameweek_id)
    );
  `);
}

export function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}
