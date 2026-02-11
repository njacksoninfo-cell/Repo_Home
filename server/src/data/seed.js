/**
 * Seed the database with sample MLS player data.
 * This provides a working game even without an API key.
 *
 * Player prices are set based on a $100M budget system similar to the real MLS Fantasy.
 * Prices range from $4.0M (budget) to $12.0M (premium).
 */

import { getDb } from '../models/database.js';

const MLS_TEAMS = [
  'Atlanta United', 'Austin FC', 'Charlotte FC', 'Chicago Fire',
  'FC Cincinnati', 'Colorado Rapids', 'Columbus Crew', 'D.C. United',
  'FC Dallas', 'Houston Dynamo', 'Inter Miami', 'LA Galaxy',
  'LAFC', 'Minnesota United', 'CF Montréal', 'Nashville SC',
  'New England Revolution', 'New York City FC', 'New York Red Bulls',
  'Orlando City', 'Philadelphia Union', 'Portland Timbers',
  'Real Salt Lake', 'San Jose Earthquakes', 'Seattle Sounders',
  'Sporting Kansas City', 'St. Louis CITY SC', 'Toronto FC',
  'Vancouver Whitecaps', 'San Diego FC',
];

// Sample players with realistic names and stats
const SAMPLE_PLAYERS = [
  // Inter Miami
  { name: 'Lionel Messi', team: 'Inter Miami', position: 'FWD', price: 12.0, goals: 15, assists: 14, minutes_played: 1800, yellow_cards: 1, shots_on_target: 40, key_passes: 45, big_chances_created: 12, passes_completed: 800, passes_attempted: 900 },
  { name: 'Luis Suárez', team: 'Inter Miami', position: 'FWD', price: 10.0, goals: 12, assists: 5, minutes_played: 1600, yellow_cards: 3, shots_on_target: 30, key_passes: 15, big_chances_created: 6, passes_completed: 300, passes_attempted: 400 },
  { name: 'Jordi Alba', team: 'Inter Miami', position: 'DEF', price: 8.5, goals: 1, assists: 8, minutes_played: 2100, clean_sheets: 6, goals_conceded: 18, yellow_cards: 2, accurate_crosses: 25, clearances: 30, passes_completed: 1400, passes_attempted: 1550 },
  { name: 'Drake Callender', team: 'Inter Miami', position: 'GK', price: 6.0, saves: 55, minutes_played: 2400, clean_sheets: 7, goals_conceded: 22, yellow_cards: 0, penalties_saved: 1, passes_completed: 400, passes_attempted: 500 },
  { name: 'Sergio Busquets', team: 'Inter Miami', position: 'MID', price: 9.0, goals: 2, assists: 6, minutes_played: 2000, clean_sheets: 6, yellow_cards: 4, key_passes: 30, passes_completed: 1800, passes_attempted: 1950 },

  // LAFC
  { name: 'Denis Bouanga', team: 'LAFC', position: 'FWD', price: 11.0, goals: 18, assists: 8, minutes_played: 2300, yellow_cards: 2, shots_on_target: 45, key_passes: 20, big_chances_created: 8, passes_completed: 500, passes_attempted: 650 },
  { name: 'Hugo Lloris', team: 'LAFC', position: 'GK', price: 6.5, saves: 70, minutes_played: 2700, clean_sheets: 8, goals_conceded: 28, yellow_cards: 1, passes_completed: 500, passes_attempted: 650 },
  { name: 'Mateusz Bogusz', team: 'LAFC', position: 'MID', price: 8.0, goals: 8, assists: 10, minutes_played: 2200, yellow_cards: 3, shots_on_target: 25, key_passes: 35, big_chances_created: 7, passes_completed: 1100, passes_attempted: 1300 },
  { name: 'Ryan Hollingshead', team: 'LAFC', position: 'DEF', price: 5.5, goals: 1, assists: 3, minutes_played: 2000, clean_sheets: 8, goals_conceded: 20, yellow_cards: 4, clearances: 50, passes_completed: 900, passes_attempted: 1050 },

  // LA Galaxy
  { name: 'Riqui Puig', team: 'LA Galaxy', position: 'MID', price: 10.5, goals: 10, assists: 14, minutes_played: 2400, yellow_cards: 2, shots_on_target: 25, key_passes: 55, big_chances_created: 15, accurate_crosses: 20, passes_completed: 1600, passes_attempted: 1800 },
  { name: 'Joseph Paintsil', team: 'LA Galaxy', position: 'FWD', price: 9.5, goals: 13, assists: 7, minutes_played: 2100, yellow_cards: 3, shots_on_target: 35, key_passes: 18, big_chances_created: 6, passes_completed: 400, passes_attempted: 550 },
  { name: 'John McCarthy', team: 'LA Galaxy', position: 'GK', price: 5.5, saves: 60, minutes_played: 2500, clean_sheets: 6, goals_conceded: 30, yellow_cards: 0, passes_completed: 450, passes_attempted: 600 },
  { name: 'Maya Yoshida', team: 'LA Galaxy', position: 'DEF', price: 6.0, goals: 2, assists: 1, minutes_played: 2200, clean_sheets: 6, goals_conceded: 25, yellow_cards: 5, clearances: 65, passes_completed: 1200, passes_attempted: 1350 },

  // Columbus Crew
  { name: 'Cucho Hernández', team: 'Columbus Crew', position: 'FWD', price: 10.5, goals: 14, assists: 5, minutes_played: 2100, yellow_cards: 4, shots_on_target: 38, key_passes: 15, big_chances_created: 5, passes_completed: 350, passes_attempted: 480 },
  { name: 'Darlington Nagbe', team: 'Columbus Crew', position: 'MID', price: 7.0, goals: 2, assists: 4, minutes_played: 2400, yellow_cards: 1, key_passes: 20, passes_completed: 2000, passes_attempted: 2150 },
  { name: 'Patrick Schulte', team: 'Columbus Crew', position: 'GK', price: 5.5, saves: 50, minutes_played: 2500, clean_sheets: 9, goals_conceded: 22, passes_completed: 500, passes_attempted: 650 },

  // FC Cincinnati
  { name: 'Luciano Acosta', team: 'FC Cincinnati', position: 'MID', price: 10.0, goals: 9, assists: 15, minutes_played: 2500, yellow_cards: 3, shots_on_target: 20, key_passes: 60, big_chances_created: 18, accurate_crosses: 15, passes_completed: 1400, passes_attempted: 1600 },
  { name: 'Yuya Kubo', team: 'FC Cincinnati', position: 'FWD', price: 7.5, goals: 10, assists: 4, minutes_played: 2000, yellow_cards: 2, shots_on_target: 28, key_passes: 12, passes_completed: 350, passes_attempted: 450 },
  { name: 'Roman Celentano', team: 'FC Cincinnati', position: 'GK', price: 5.0, saves: 55, minutes_played: 2600, clean_sheets: 7, goals_conceded: 28, passes_completed: 480, passes_attempted: 620 },
  { name: 'Miles Robinson', team: 'FC Cincinnati', position: 'DEF', price: 6.5, goals: 2, assists: 1, minutes_played: 2300, clean_sheets: 7, goals_conceded: 22, yellow_cards: 5, clearances: 70, passes_completed: 1100, passes_attempted: 1250 },

  // Seattle Sounders
  { name: 'Jordan Morris', team: 'Seattle Sounders', position: 'FWD', price: 8.5, goals: 11, assists: 6, minutes_played: 2200, yellow_cards: 2, shots_on_target: 30, key_passes: 14, big_chances_created: 4, passes_completed: 400, passes_attempted: 520 },
  { name: 'Albert Rusnák', team: 'Seattle Sounders', position: 'MID', price: 8.0, goals: 7, assists: 9, minutes_played: 2300, yellow_cards: 3, shots_on_target: 18, key_passes: 40, big_chances_created: 10, accurate_crosses: 18, passes_completed: 1300, passes_attempted: 1500 },
  { name: 'Stefan Frei', team: 'Seattle Sounders', position: 'GK', price: 5.5, saves: 65, minutes_played: 2700, clean_sheets: 7, goals_conceded: 26, yellow_cards: 0, penalties_saved: 1, passes_completed: 400, passes_attempted: 550 },
  { name: 'Jackson Ragen', team: 'Seattle Sounders', position: 'DEF', price: 5.5, goals: 2, assists: 1, minutes_played: 2400, clean_sheets: 7, goals_conceded: 20, yellow_cards: 4, clearances: 60, passes_completed: 1300, passes_attempted: 1450 },

  // New York City FC
  { name: 'Alonso Martínez', team: 'New York City FC', position: 'FWD', price: 8.0, goals: 12, assists: 4, minutes_played: 2000, yellow_cards: 2, shots_on_target: 32, key_passes: 10, passes_completed: 300, passes_attempted: 420 },
  { name: 'Santiago Rodríguez', team: 'New York City FC', position: 'MID', price: 9.0, goals: 8, assists: 11, minutes_played: 2400, yellow_cards: 3, shots_on_target: 22, key_passes: 45, big_chances_created: 10, accurate_crosses: 12, passes_completed: 1300, passes_attempted: 1500 },
  { name: 'Matt Freese', team: 'New York City FC', position: 'GK', price: 5.0, saves: 60, minutes_played: 2600, clean_sheets: 6, goals_conceded: 30, passes_completed: 450, passes_attempted: 600 },

  // Philadelphia Union
  { name: 'Daniel Gazdag', team: 'Philadelphia Union', position: 'MID', price: 9.5, goals: 11, assists: 8, minutes_played: 2300, yellow_cards: 2, shots_on_target: 28, key_passes: 35, big_chances_created: 9, passes_completed: 1200, passes_attempted: 1400 },
  { name: 'Jakob Glesnes', team: 'Philadelphia Union', position: 'DEF', price: 6.0, goals: 3, assists: 2, minutes_played: 2400, clean_sheets: 5, goals_conceded: 28, yellow_cards: 6, clearances: 55, passes_completed: 1400, passes_attempted: 1550 },
  { name: 'Andre Blake', team: 'Philadelphia Union', position: 'GK', price: 6.0, saves: 75, minutes_played: 2700, clean_sheets: 5, goals_conceded: 32, yellow_cards: 0, penalties_saved: 2, passes_completed: 400, passes_attempted: 550 },

  // Atlanta United
  { name: 'Thiago Almada', team: 'Atlanta United', position: 'MID', price: 9.0, goals: 6, assists: 10, minutes_played: 1800, yellow_cards: 3, shots_on_target: 18, key_passes: 42, big_chances_created: 11, passes_completed: 1000, passes_attempted: 1200 },
  { name: 'Giorgos Giakoumakis', team: 'Atlanta United', position: 'FWD', price: 8.5, goals: 10, assists: 3, minutes_played: 1700, yellow_cards: 3, shots_on_target: 28, key_passes: 8, passes_completed: 250, passes_attempted: 350 },
  { name: 'Brad Guzan', team: 'Atlanta United', position: 'GK', price: 4.5, saves: 50, minutes_played: 2400, clean_sheets: 4, goals_conceded: 35, yellow_cards: 1, passes_completed: 400, passes_attempted: 550 },

  // Nashville SC
  { name: 'Hany Mukhtar', team: 'Nashville SC', position: 'MID', price: 9.5, goals: 9, assists: 10, minutes_played: 2400, yellow_cards: 3, shots_on_target: 24, key_passes: 50, big_chances_created: 13, accurate_crosses: 10, passes_completed: 1300, passes_attempted: 1500 },
  { name: 'Joe Willis', team: 'Nashville SC', position: 'GK', price: 5.0, saves: 55, minutes_played: 2600, clean_sheets: 6, goals_conceded: 28, passes_completed: 400, passes_attempted: 550 },
  { name: 'Sam Surridge', team: 'Nashville SC', position: 'FWD', price: 7.5, goals: 9, assists: 3, minutes_played: 1900, yellow_cards: 2, shots_on_target: 25, key_passes: 8, passes_completed: 250, passes_attempted: 350 },

  // Portland Timbers
  { name: 'Evander', team: 'Portland Timbers', position: 'MID', price: 10.0, goals: 12, assists: 10, minutes_played: 2400, yellow_cards: 2, shots_on_target: 30, key_passes: 48, big_chances_created: 14, accurate_crosses: 16, passes_completed: 1400, passes_attempted: 1600 },
  { name: 'Jonathan Rodríguez', team: 'Portland Timbers', position: 'FWD', price: 7.0, goals: 8, assists: 3, minutes_played: 1800, yellow_cards: 2, shots_on_target: 22, key_passes: 8, passes_completed: 250, passes_attempted: 350 },

  // Houston Dynamo
  { name: 'Sebastián Ferreira', team: 'Houston Dynamo', position: 'FWD', price: 7.5, goals: 10, assists: 4, minutes_played: 2000, yellow_cards: 3, shots_on_target: 26, key_passes: 10, passes_completed: 300, passes_attempted: 420 },
  { name: 'Héctor Herrera', team: 'Houston Dynamo', position: 'MID', price: 7.5, goals: 4, assists: 7, minutes_played: 2200, yellow_cards: 5, key_passes: 28, passes_completed: 1400, passes_attempted: 1600 },
  { name: 'Steve Clark', team: 'Houston Dynamo', position: 'GK', price: 5.0, saves: 65, minutes_played: 2700, clean_sheets: 5, goals_conceded: 32, passes_completed: 350, passes_attempted: 500 },

  // New York Red Bulls
  { name: 'Lewis Morgan', team: 'New York Red Bulls', position: 'FWD', price: 8.5, goals: 11, assists: 5, minutes_played: 2200, yellow_cards: 2, shots_on_target: 30, key_passes: 14, big_chances_created: 4, passes_completed: 400, passes_attempted: 530 },
  { name: 'Emil Forsberg', team: 'New York Red Bulls', position: 'MID', price: 8.0, goals: 6, assists: 8, minutes_played: 1800, yellow_cards: 2, shots_on_target: 16, key_passes: 35, big_chances_created: 8, passes_completed: 1000, passes_attempted: 1180 },
  { name: 'Carlos Coronel', team: 'New York Red Bulls', position: 'GK', price: 5.0, saves: 55, minutes_played: 2500, clean_sheets: 6, goals_conceded: 28, passes_completed: 380, passes_attempted: 520 },
  { name: 'Sean Nealis', team: 'New York Red Bulls', position: 'DEF', price: 5.5, goals: 1, assists: 1, minutes_played: 2300, clean_sheets: 6, goals_conceded: 24, yellow_cards: 6, clearances: 65, passes_completed: 1100, passes_attempted: 1250 },

  // Real Salt Lake
  { name: 'Chicho Arango', team: 'Real Salt Lake', position: 'FWD', price: 10.5, goals: 17, assists: 4, minutes_played: 2200, yellow_cards: 4, shots_on_target: 42, key_passes: 12, big_chances_created: 5, passes_completed: 350, passes_attempted: 480 },
  { name: 'Damir Kreilach', team: 'Real Salt Lake', position: 'MID', price: 7.0, goals: 5, assists: 5, minutes_played: 2000, yellow_cards: 4, shots_on_target: 14, key_passes: 20, passes_completed: 1000, passes_attempted: 1200 },
  { name: 'Zac MacMath', team: 'Real Salt Lake', position: 'GK', price: 5.0, saves: 50, minutes_played: 2500, clean_sheets: 7, goals_conceded: 26, passes_completed: 400, passes_attempted: 550 },
  { name: 'Justen Glad', team: 'Real Salt Lake', position: 'DEF', price: 5.5, goals: 1, assists: 2, minutes_played: 2300, clean_sheets: 7, goals_conceded: 22, yellow_cards: 3, clearances: 55, passes_completed: 1200, passes_attempted: 1350 },

  // Austin FC
  { name: 'Sebastián Driussi', team: 'Austin FC', position: 'MID', price: 9.0, goals: 8, assists: 7, minutes_played: 2200, yellow_cards: 3, shots_on_target: 22, key_passes: 38, big_chances_created: 9, passes_completed: 1200, passes_attempted: 1400 },
  { name: 'Maximiliano Urruti', team: 'Austin FC', position: 'FWD', price: 6.5, goals: 7, assists: 3, minutes_played: 1700, yellow_cards: 2, shots_on_target: 18, key_passes: 6, passes_completed: 200, passes_attempted: 300 },
  { name: 'Brad Stuver', team: 'Austin FC', position: 'GK', price: 5.5, saves: 65, minutes_played: 2700, clean_sheets: 6, goals_conceded: 30, penalties_saved: 1, passes_completed: 450, passes_attempted: 600 },

  // Minnesota United
  { name: 'Bongokuhle Hlongwane', team: 'Minnesota United', position: 'FWD', price: 7.5, goals: 9, assists: 5, minutes_played: 2100, yellow_cards: 1, shots_on_target: 24, key_passes: 12, big_chances_created: 4, passes_completed: 350, passes_attempted: 470 },
  { name: 'Robin Lod', team: 'Minnesota United', position: 'MID', price: 7.0, goals: 5, assists: 6, minutes_played: 2200, yellow_cards: 3, shots_on_target: 14, key_passes: 25, passes_completed: 1100, passes_attempted: 1300 },
  { name: 'Dayne St. Clair', team: 'Minnesota United', position: 'GK', price: 5.5, saves: 70, minutes_played: 2700, clean_sheets: 5, goals_conceded: 34, passes_completed: 400, passes_attempted: 550 },

  // Colorado Rapids
  { name: 'Rafael Navarro', team: 'Colorado Rapids', position: 'FWD', price: 8.0, goals: 11, assists: 4, minutes_played: 2100, yellow_cards: 2, shots_on_target: 28, key_passes: 10, passes_completed: 300, passes_attempted: 420 },
  { name: 'Djordje Mihailovic', team: 'Colorado Rapids', position: 'MID', price: 8.5, goals: 7, assists: 9, minutes_played: 2300, yellow_cards: 2, shots_on_target: 18, key_passes: 42, big_chances_created: 10, passes_completed: 1300, passes_attempted: 1500 },

  // Charlotte FC
  { name: 'Karol Świderski', team: 'Charlotte FC', position: 'FWD', price: 7.5, goals: 8, assists: 3, minutes_played: 1800, yellow_cards: 3, shots_on_target: 22, key_passes: 8, passes_completed: 250, passes_attempted: 370 },
  { name: 'Kerwin Vargas', team: 'Charlotte FC', position: 'MID', price: 6.5, goals: 5, assists: 5, minutes_played: 2000, yellow_cards: 2, shots_on_target: 14, key_passes: 22, passes_completed: 800, passes_attempted: 1000 },

  // Orlando City
  { name: 'Facundo Torres', team: 'Orlando City', position: 'MID', price: 9.0, goals: 10, assists: 8, minutes_played: 2400, yellow_cards: 2, shots_on_target: 26, key_passes: 38, big_chances_created: 10, passes_completed: 1200, passes_attempted: 1400 },
  { name: 'Duncan McGuire', team: 'Orlando City', position: 'FWD', price: 7.0, goals: 9, assists: 2, minutes_played: 1800, yellow_cards: 1, shots_on_target: 24, key_passes: 6, passes_completed: 220, passes_attempted: 330 },

  // D.C. United
  { name: 'Christian Benteke', team: 'D.C. United', position: 'FWD', price: 9.0, goals: 14, assists: 3, minutes_played: 2200, yellow_cards: 3, shots_on_target: 35, key_passes: 10, big_chances_created: 3, passes_completed: 300, passes_attempted: 420 },
  { name: 'Mateusz Klich', team: 'D.C. United', position: 'MID', price: 6.5, goals: 3, assists: 6, minutes_played: 2000, yellow_cards: 4, key_passes: 25, passes_completed: 1100, passes_attempted: 1300 },

  // Toronto FC
  { name: 'Lorenzo Insigne', team: 'Toronto FC', position: 'FWD', price: 8.5, goals: 8, assists: 6, minutes_played: 1800, yellow_cards: 1, shots_on_target: 22, key_passes: 28, big_chances_created: 7, accurate_crosses: 10, passes_completed: 600, passes_attempted: 750 },
  { name: 'Federico Bernardeschi', team: 'Toronto FC', position: 'MID', price: 8.0, goals: 7, assists: 7, minutes_played: 2000, yellow_cards: 2, shots_on_target: 18, key_passes: 32, big_chances_created: 8, passes_completed: 1000, passes_attempted: 1200 },

  // St. Louis CITY SC
  { name: 'João Klauss', team: 'St. Louis CITY SC', position: 'FWD', price: 7.5, goals: 9, assists: 3, minutes_played: 1900, yellow_cards: 3, shots_on_target: 24, key_passes: 8, passes_completed: 250, passes_attempted: 360 },
  { name: 'Eduard Löwen', team: 'St. Louis CITY SC', position: 'MID', price: 7.5, goals: 5, assists: 7, minutes_played: 2200, yellow_cards: 3, shots_on_target: 14, key_passes: 30, big_chances_created: 6, passes_completed: 1200, passes_attempted: 1400 },

  // Chicago Fire
  { name: 'Hugo Cuypers', team: 'Chicago Fire', position: 'FWD', price: 7.0, goals: 8, assists: 3, minutes_played: 2000, yellow_cards: 4, shots_on_target: 22, key_passes: 8, passes_completed: 280, passes_attempted: 400 },
  { name: 'Xherdan Shaqiri', team: 'Chicago Fire', position: 'MID', price: 8.0, goals: 5, assists: 8, minutes_played: 1800, yellow_cards: 1, shots_on_target: 14, key_passes: 35, big_chances_created: 9, accurate_crosses: 12, passes_completed: 1000, passes_attempted: 1180 },

  // Sporting Kansas City
  { name: 'William Agada', team: 'Sporting Kansas City', position: 'FWD', price: 7.5, goals: 10, assists: 2, minutes_played: 2000, yellow_cards: 3, shots_on_target: 26, key_passes: 6, passes_completed: 250, passes_attempted: 370 },
  { name: 'Erik Thommy', team: 'Sporting Kansas City', position: 'MID', price: 6.5, goals: 4, assists: 6, minutes_played: 2000, yellow_cards: 2, shots_on_target: 12, key_passes: 25, passes_completed: 1000, passes_attempted: 1200 },

  // Vancouver Whitecaps
  { name: 'Brian White', team: 'Vancouver Whitecaps', position: 'FWD', price: 7.0, goals: 9, assists: 3, minutes_played: 2000, yellow_cards: 2, shots_on_target: 24, key_passes: 8, passes_completed: 250, passes_attempted: 370 },
  { name: 'Ryan Gauld', team: 'Vancouver Whitecaps', position: 'MID', price: 8.5, goals: 7, assists: 10, minutes_played: 2300, yellow_cards: 2, shots_on_target: 16, key_passes: 40, big_chances_created: 10, passes_completed: 1300, passes_attempted: 1500 },

  // Budget defenders to fill out rosters
  { name: 'Steven Moreira', team: 'Columbus Crew', position: 'DEF', price: 5.0, goals: 0, assists: 3, minutes_played: 2200, clean_sheets: 9, goals_conceded: 18, yellow_cards: 3, clearances: 45, accurate_crosses: 15, passes_completed: 1100, passes_attempted: 1250 },
  { name: 'Aaron Long', team: 'New York Red Bulls', position: 'DEF', price: 5.5, goals: 1, assists: 1, minutes_played: 2100, clean_sheets: 6, goals_conceded: 24, yellow_cards: 4, clearances: 60, passes_completed: 1000, passes_attempted: 1150 },
  { name: 'Kai Wagner', team: 'Philadelphia Union', position: 'DEF', price: 7.0, goals: 1, assists: 7, minutes_played: 2400, clean_sheets: 5, goals_conceded: 26, yellow_cards: 5, clearances: 35, accurate_crosses: 30, passes_completed: 1400, passes_attempted: 1600 },
  { name: 'Yeimar Gómez', team: 'Seattle Sounders', position: 'DEF', price: 5.5, goals: 2, assists: 0, minutes_played: 2300, clean_sheets: 7, goals_conceded: 22, yellow_cards: 5, clearances: 70, passes_completed: 1000, passes_attempted: 1150 },
  { name: 'Thiago Martins', team: 'New York City FC', position: 'DEF', price: 5.0, goals: 1, assists: 1, minutes_played: 2200, clean_sheets: 6, goals_conceded: 26, yellow_cards: 3, clearances: 55, passes_completed: 1100, passes_attempted: 1250 },
  { name: 'Rudy Camacho', team: 'Columbus Crew', position: 'DEF', price: 4.5, goals: 0, assists: 1, minutes_played: 2000, clean_sheets: 9, goals_conceded: 18, yellow_cards: 4, clearances: 50, passes_completed: 900, passes_attempted: 1050 },
  { name: 'Nicolás Mezquida', team: 'Colorado Rapids', position: 'DEF', price: 4.5, goals: 0, assists: 2, minutes_played: 1900, clean_sheets: 5, goals_conceded: 28, yellow_cards: 3, clearances: 40, passes_completed: 800, passes_attempted: 950 },
  { name: 'Matt Hedges', team: 'Austin FC', position: 'DEF', price: 4.5, goals: 1, assists: 0, minutes_played: 2100, clean_sheets: 6, goals_conceded: 24, yellow_cards: 5, clearances: 65, passes_completed: 1000, passes_attempted: 1150 },
  { name: 'Walker Zimmerman', team: 'Nashville SC', position: 'DEF', price: 6.0, goals: 2, assists: 1, minutes_played: 2400, clean_sheets: 6, goals_conceded: 24, yellow_cards: 4, clearances: 75, passes_completed: 1300, passes_attempted: 1450 },
  { name: 'Lalas Abubakar', team: 'Colorado Rapids', position: 'DEF', price: 4.5, goals: 1, assists: 0, minutes_played: 2000, clean_sheets: 5, goals_conceded: 28, yellow_cards: 6, clearances: 60, passes_completed: 800, passes_attempted: 950 },
];

function seed() {
  const db = getDb();

  // Clear existing data
  db.exec('DELETE FROM squad_gameweek_scores');
  db.exec('DELETE FROM player_gameweek_stats');
  db.exec('DELETE FROM squad_players');
  db.exec('DELETE FROM squads');
  db.exec('DELETE FROM gameweeks');
  db.exec('DELETE FROM players');

  // Insert players
  const insertPlayer = db.prepare(`
    INSERT INTO players (
      api_id, name, team, position, price, total_points,
      minutes_played, goals, assists, clean_sheets,
      yellow_cards, red_cards, saves, goals_conceded,
      own_goals, penalties_saved, penalties_missed,
      shots_on_target, key_passes, accurate_crosses,
      clearances, big_chances_created, passes_completed, passes_attempted
    ) VALUES (
      @api_id, @name, @team, @position, @price, @total_points,
      @minutes_played, @goals, @assists, @clean_sheets,
      @yellow_cards, @red_cards, @saves, @goals_conceded,
      @own_goals, @penalties_saved, @penalties_missed,
      @shots_on_target, @key_passes, @accurate_crosses,
      @clearances, @big_chances_created, @passes_completed, @passes_attempted
    )
  `);

  const insertMany = db.transaction((players) => {
    for (const [i, p] of players.entries()) {
      insertPlayer.run({
        api_id: 10000 + i,
        name: p.name,
        team: p.team,
        position: p.position,
        price: p.price,
        total_points: 0,
        minutes_played: p.minutes_played || 0,
        goals: p.goals || 0,
        assists: p.assists || 0,
        clean_sheets: p.clean_sheets || 0,
        yellow_cards: p.yellow_cards || 0,
        red_cards: p.red_cards || 0,
        saves: p.saves || 0,
        goals_conceded: p.goals_conceded || 0,
        own_goals: p.own_goals || 0,
        penalties_saved: p.penalties_saved || 0,
        penalties_missed: p.penalties_missed || 0,
        shots_on_target: p.shots_on_target || 0,
        key_passes: p.key_passes || 0,
        accurate_crosses: p.accurate_crosses || 0,
        clearances: p.clearances || 0,
        big_chances_created: p.big_chances_created || 0,
        passes_completed: p.passes_completed || 0,
        passes_attempted: p.passes_attempted || 0,
      });
    }
  });

  insertMany(SAMPLE_PLAYERS);

  // Create sample gameweeks
  const insertGw = db.prepare(`
    INSERT INTO gameweeks (number, name, is_current, is_finished)
    VALUES (@number, @name, @is_current, @is_finished)
  `);

  for (let i = 1; i <= 34; i++) {
    insertGw.run({
      number: i,
      name: `Gameweek ${i}`,
      is_current: i === 1 ? 1 : 0,
      is_finished: 0,
    });
  }

  // Create a default squad
  const result = db.prepare(`INSERT INTO squads (name, budget) VALUES ('My MLS Team', 100.0)`).run();
  const squadId = result.lastInsertRowid;

  console.log(`Seeded ${SAMPLE_PLAYERS.length} players across MLS teams`);
  console.log(`Created 34 gameweeks`);
  console.log(`Created default squad (id: ${squadId})`);
  console.log('Database seeded successfully!');
}

seed();
