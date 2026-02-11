# MLS Fantasy Game

A recreation of the classic MLS Fantasy Soccer experience. Build your squad, set your lineup, and compete based on real MLS player performances.

## Features

- **Squad Management**: Build a 15-player squad under a $100M budget
- **Lineup Selection**: Choose 11 starters with flexible formations (3-4-3, 4-3-3, 4-4-2, etc.)
- **Captain Selection**: Pick a captain who earns double points
- **MLS Fantasy Scoring**: Full scoring engine matching the official MLS Fantasy rules
- **Player Database**: Browse, search, and filter MLS players by position, team, and stats
- **Live Data Integration**: Optional API-Football integration for real MLS player data
- **Scoring Rules Reference**: Complete breakdown of all scoring rules and squad regulations

## Tech Stack

- **Frontend**: React + Vite
- **Backend**: Node.js + Express
- **Database**: SQLite (via better-sqlite3)
- **Data Source**: API-Football v3 (free tier, 100 req/day) or seed data

## Quick Start

```bash
# Install all dependencies
npm run install:all

# Seed the database with sample MLS players
npm run seed

# Start the backend API server (port 3001)
npm run dev:server

# In another terminal, start the frontend dev server (port 5173)
npm run dev:client
```

Then open http://localhost:5173 in your browser.

## Using Live MLS Data

To use real player data from API-Football instead of sample data:

1. Get a free API key at https://www.api-football.com/
2. Set the environment variable: `export API_FOOTBALL_KEY=your_key_here`
3. Restart the server
4. Use the sync endpoint to pull live data: `POST /api/data/sync`

The free tier gives you 100 API requests per day, which is sufficient for periodic data updates.

## Scoring System

The scoring engine implements the official MLS Fantasy rules (2024/2025 season):

| Action | GK | DEF | MID | FWD |
|--------|---:|----:|----:|----:|
| Goal | +6 | +6 | +5 | +4 |
| Assist | +3 | +3 | +3 | +3 |
| Clean Sheet (60+ min) | +4 | +4 | +1 | 0 |
| Goals Conceded (per 2) | -1 | -1 | 0 | 0 |
| Saves (per 3) | +1 | - | - | - |
| Penalty Save | +5 | +5 | +5 | +5 |
| Yellow Card | -1 | -1 | -1 | -1 |
| Red Card | -3 | -3 | -3 | -3 |

**Bonus Points**: Big chances created (+1 each), accurate crosses (+1/3), key passes (+1/4), passing accuracy 85%+ on 35+ passes (+1), clearances (+1/3), shots on target (+1/2).

## Squad Rules

- **Budget**: $100M
- **Squad Size**: 15 (11 starters + 4 bench)
- **Max per team**: 3 players
- **Composition**: 2 GK, 5 DEF, 5 MID, 3 FWD
- **Starting lineup**: 1 GK + at least 3 DEF, 3 MID, 1 FWD
- **Captain**: Earns double points

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/players` | GET | List players with filters |
| `/api/players/:id` | GET | Get player details |
| `/api/players/meta/teams` | GET | Get all team names |
| `/api/squad` | GET | Get current squad |
| `/api/squad/players` | POST | Add player to squad |
| `/api/squad/players/:id` | DELETE | Remove player |
| `/api/squad/lineup` | PUT | Set starters & captain |
| `/api/scoring/rules` | GET | Get scoring rules |
| `/api/scoring/gameweek` | POST | Submit gameweek stats |
| `/api/data/status` | GET | Check API configuration |
| `/api/data/sync` | POST | Sync live data from API-Football |
