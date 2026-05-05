const express = require('express');
const cors    = require('cors');
const fs      = require('fs');
const path    = require('path');

function createServer(dataFilePath, port = 4321) {
  const app = express();

  app.use(cors());
  // Aumentar límite para soportar fotos base64
  app.use(express.json({ limit: '50mb' }));

  function readData() {
    try {
      if (!fs.existsSync(dataFilePath)) return { animales: [] };
      const raw = fs.readFileSync(dataFilePath, 'utf8');
      return JSON.parse(raw);
    } catch {
      return { animales: [] };
    }
  }

  function writeData(data) {
    fs.mkdirSync(path.dirname(dataFilePath), { recursive: true });
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), 'utf8');
  }

  // Health check
  app.get('/api/ping', (req, res) => {
    res.json({ ok: true, server: 'CampoManager', version: '2.0.0' });
  });

  // ── Animales ──────────────────────────────────────────────────────────────
  app.get('/api/animales', (req, res) => {
    res.json(readData().animales);
  });

  app.get('/api/animales/:id', (req, res) => {
    const data   = readData();
    const animal = data.animales.find(a => a.id === req.params.id);
    if (!animal) return res.status(404).json({ error: 'No encontrado' });
    res.json(animal);
  });

  app.post('/api/animales', (req, res) => {
    const data   = readData();
    const nuevo  = req.body;
    if (!nuevo.nombre || !nuevo.tipo) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }
    if (!nuevo.id) nuevo.id = `a${Date.now()}`;
    if (data.animales.find(a => a.id === nuevo.id)) {
      nuevo.id = `a${Date.now()}_${Math.random().toString(36).slice(2,6)}`;
    }
    data.animales.push(nuevo);
    writeData(data);
    res.status(201).json(nuevo);
  });

  app.put('/api/animales/:id', (req, res) => {
    const data = readData();
    const idx  = data.animales.findIndex(a => a.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'No encontrado' });
    data.animales[idx] = { ...data.animales[idx], ...req.body, id: req.params.id };
    writeData(data);
    res.json(data.animales[idx]);
  });

  app.delete('/api/animales/:id', (req, res) => {
    const data = readData();
    const prev = data.animales.length;
    data.animales = data.animales.filter(a => a.id !== req.params.id);
    if (data.animales.length === prev) {
      return res.status(404).json({ error: 'No encontrado' });
    }
    writeData(data);
    res.json({ ok: true });
  });

  const server = app.listen(port, '0.0.0.0', () => {
    console.log(`[CampoManager] Corriendo en 0.0.0.0:${port}`);
    console.log(`[CampoManager] Datos en: ${dataFilePath}`);
  });

  return server;
}

module.exports = { createServer };
