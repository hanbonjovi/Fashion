const fs = require('fs');
const path = require('path');

const HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
  'Cache-Control': 'public, max-age=300',
};

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: HEADERS, body: '' };
  }

  try {
    const dataDir = path.resolve(__dirname, '../../data');
    const products = JSON.parse(fs.readFileSync(path.join(dataDir, 'products.json'), 'utf8'));
    const events = JSON.parse(fs.readFileSync(path.join(dataDir, 'events.json'), 'utf8'));

    return {
      statusCode: 200,
      headers: HEADERS,
      body: JSON.stringify({ products, events }),
    };
  } catch (err) {
    console.error('Failed to load catalog:', err.message);
    return {
      statusCode: 500,
      headers: HEADERS,
      body: JSON.stringify({ error: 'Failed to load catalog' }),
    };
  }
};
