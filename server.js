// server.js - Level editor API endpoint

import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3002;

// Middleware
app.use(cors());
app.use(express.json());

const LEVELS_PATH = path.join(__dirname, 'src', 'data', 'levels.json');

// GET /api/levels - Read levels
app.get('/api/levels', (req, res) => {
  try {
    const data = fs.readFileSync(LEVELS_PATH, 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    console.error('Error reading levels:', error);
    res.status(500).json({ error: 'Failed to read levels' });
  }
});

// POST /api/levels - Save levels
app.post('/api/levels', (req, res) => {
  try {
    const data = req.body;
    fs.writeFileSync(LEVELS_PATH, JSON.stringify(data, null, 2));
    res.json({ success: true });
  } catch (error) {
    console.error('Error writing levels:', error);
    res.status(500).json({ error: 'Failed to write levels' });
  }
});

// GET /api/levels/:id - Get single level
app.get('/api/levels/:id', (req, res) => {
  try {
    const data = fs.readFileSync(LEVELS_PATH, 'utf8');
    const { levels } = JSON.parse(data);
    const level = levels.find(l => l.id === parseInt(req.params.id));
    if (level) {
      res.json(level);
    } else {
      res.status(404).json({ error: 'Level not found' });
    }
  } catch (error) {
    console.error('Error reading level:', error);
    res.status(500).json({ error: 'Failed to read level' });
  }
});

app.listen(PORT, () => {
  console.log(`Level Editor API running on http://localhost:${PORT}`);
});
