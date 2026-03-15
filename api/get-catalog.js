const fs = require('fs');
const path = require('path');

const HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
  'Cache-Control': 'public, max-age=1800',
};

module.exports = async function handler(req, res) {
  Object.entries(HEADERS).forEach(([key, value]) => res.setHeader(key, value));

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  try {
    const dataDir = path.join(process.cwd(), 'data');
    const products = JSON.parse(fs.readFileSync(path.join(dataDir, 'products.json'), 'utf8'));
    const events = JSON.parse(fs.readFileSync(path.join(dataDir, 'events.json'), 'utf8'));

    return res.status(200).json({ products, events, refreshedAt: new Date().toISOString() });
  } catch (err) {
    console.error('Failed to load catalog:', err.message);
    return res.status(500).json({ error: 'Failed to load catalog' });
  }
};
