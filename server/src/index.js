import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import playersRouter from './routes/players.js';
import squadRouter from './routes/squad.js';
import scoringRouter from './routes/scoring.js';
import dataRouter from './routes/data.js';
import { getDb, closeDb } from './models/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static frontend build in production
const clientBuild = join(__dirname, '..', '..', 'client', 'dist');
app.use(express.static(clientBuild));

// API Routes
app.use('/api/players', playersRouter);
app.use('/api/squad', squadRouter);
app.use('/api/scoring', scoringRouter);
app.use('/api/data', dataRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0', name: 'MLS Fantasy Game API' });
});

// SPA fallback - serve index.html for all non-API routes
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(join(clientBuild, 'index.html'));
  }
});

// Initialize database
getDb();

// Start server
app.listen(PORT, () => {
  console.log(`MLS Fantasy Game API running on http://localhost:${PORT}`);
  console.log(`API endpoints available at http://localhost:${PORT}/api`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  closeDb();
  process.exit(0);
});

process.on('SIGTERM', () => {
  closeDb();
  process.exit(0);
});
