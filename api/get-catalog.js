const fs = require('fs');
const path = require('path');

const HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
  'Cache-Control': 'public, max-age=900, s-maxage=900',
};

// ---- Rotation Logic ----
// Every 6 hours the "epoch" changes, giving a new seed for curation
function getRotationEpoch() {
  const SIX_HOURS = 6 * 60 * 60 * 1000;
  return Math.floor(Date.now() / SIX_HOURS);
}

// Deterministic shuffle using a simple seed-based PRNG
function seededShuffle(arr, seed) {
  const result = [...arr];
  let s = seed;
  for (let i = result.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0x7fffffff;
    const j = s % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Determine current season context for curation
function getCurrentSeason() {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return 'spring-summer';
  if (month >= 5 && month <= 7) return 'resort';
  if (month >= 8 && month <= 10) return 'fall-winter';
  return 'resort'; // Dec-Feb = resort/pre-spring shows
}

// Score products for relevance to current moment
function scoreProduct(product, season) {
  let score = 0;
  if (product.season === season) score += 3;
  if (product.tags && product.tags.includes('editorial-pick')) score += 2;
  if (product.tags && product.tags.includes('viral')) score += 1;
  if (product.tags && product.tags.includes('iconic')) score += 1;
  return score;
}

// Curate a rotation from the vault
function curateRotation(allProducts, epoch) {
  const season = getCurrentSeason();

  // Score and sort by seasonal relevance
  const scored = allProducts.map((p) => ({
    product: p,
    score: scoreProduct(p, season),
  }));

  // Shuffle with seed, but bias toward higher-scored items
  const shuffled = seededShuffle(scored, epoch);

  // Sort: high-score items first, but within same score they stay shuffled
  shuffled.sort((a, b) => b.score - a.score);

  // Pick top 18 for this rotation
  const selected = shuffled.slice(0, 18).map((s) => s.product);

  // Mark the featured item (highest scored, first in rotation)
  const featured = selected[0];

  // Mark "new" items — the first 6 non-featured items get the badge
  const result = selected.map((p, i) => ({
    ...p,
    isFeatured: p.id === featured.id,
    isNew: i > 0 && i <= 6,
  }));

  return result;
}

// ---- Curation Labels ----
function getCurationLabel(season) {
  const labels = {
    'spring-summer': ['The Spring Edit', 'Summer Selects', 'Light & Form', 'Warm Weather Essentials'],
    'resort': ['Resort Curation', 'Between Seasons', 'The Escape Edit', 'Destination Dressing'],
    'fall-winter': ['Autumn Arrivals', 'The Winter Edit', 'Dark Season Selects', 'Cold Weather Icons'],
  };
  const options = labels[season] || labels['resort'];
  const epoch = getRotationEpoch();
  return options[epoch % options.length];
}

// ---- RSS Trending (server-side) ----
const RSS_FEEDS = [
  { url: 'https://www.vogue.com/feed/rss', source: 'Vogue' },
  { url: 'https://hypebeast.com/fashion/feed', source: 'Hypebeast' },
  { url: 'https://www.highsnobiety.com/rss/', source: 'Highsnobiety' },
  { url: 'https://fashionista.com/.rss/full/', source: 'Fashionista' },
  { url: 'https://www.businessoffashion.com/feed', source: 'BoF' },
  { url: 'https://wwd.com/feed/', source: 'WWD' },
];

const BRAND_NAMES = [
  'Acne Studios', 'The Row', 'Lemaire', 'Khaite', 'Bottega Veneta',
  'Jacquemus', 'Loewe', 'Toteme', 'Jil Sander', 'Ami Paris',
  'Maison Margiela', 'Nanushka', 'Our Legacy', 'Studio Nicholson', 'Auralee',
  'Prada', 'Gucci', 'Saint Laurent', 'Celine', 'Balenciaga',
  'Miu Miu', 'Dior', 'Chanel', 'Hermes', 'Rick Owens',
  'Fear of God', 'Comme des Garcons', 'Issey Miyake', 'Sacai', 'Undercover',
  'Wales Bonner', 'Alaia', 'Valentino', 'Brunello Cucinelli', 'Dries Van Noten',
  'Phoebe Philo', 'Marni', 'Proenza Schouler', 'Simone Rocha', 'Coperni',
];

function detectBrand(text) {
  const lower = text.toLowerCase();
  for (const brand of BRAND_NAMES) {
    if (lower.includes(brand.toLowerCase())) return brand;
  }
  return null;
}

function extractImageFromHtml(html) {
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/);
  return match ? match[1] : null;
}

async function fetchRssTrending() {
  const trending = [];

  for (const feed of RSS_FEEDS) {
    try {
      const apiUrl = 'https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent(feed.url);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(apiUrl, { signal: controller.signal });
      clearTimeout(timeout);

      if (!response.ok) continue;
      const data = await response.json();
      if (data.status !== 'ok' || !data.items) continue;

      for (const item of data.items.slice(0, 6)) {
        const title = item.title || '';
        const text = title + ' ' + (item.description || '').replace(/<[^>]+>/g, '');
        const brand = detectBrand(text);
        const imageUrl = item.thumbnail || item.enclosure?.link || extractImageFromHtml(item.description || '');

        if (!brand || !imageUrl) continue;

        const priceMatch = text.match(/\$[\d,]+/);
        const price = priceMatch ? parseInt(priceMatch[0].replace(/[$,]/g, ''), 10) : 0;

        trending.push({
          id: 'trending-' + title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40),
          title: title.length > 60 ? title.slice(0, 60).replace(/\s+\S*$/, '') + '...' : title,
          brand,
          price,
          currency: 'USD',
          buyUrl: item.link || '',
          imageUrl,
          category: item.categories?.[0] || 'Fashion',
          description: text.slice(0, 200) || 'Trending via ' + feed.source,
          isNew: true,
          isFeatured: false,
          isTrending: true,
          source: feed.source,
          tags: ['trending'],
        });
      }
    } catch {
      // Feed failed, skip silently
    }
  }

  return trending.slice(0, 8);
}

// ---- Handler ----
module.exports = async function handler(req, res) {
  Object.entries(HEADERS).forEach(([key, value]) => res.setHeader(key, value));

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  try {
    const dataDir = path.join(process.cwd(), 'data');
    const allProducts = JSON.parse(fs.readFileSync(path.join(dataDir, 'products.json'), 'utf8'));
    const events = JSON.parse(fs.readFileSync(path.join(dataDir, 'events.json'), 'utf8'));

    const epoch = getRotationEpoch();
    const season = getCurrentSeason();

    // Curate this rotation's selection from the vault
    const curatedProducts = curateRotation(allProducts, epoch);

    // Fetch trending from RSS feeds
    let trendingProducts = [];
    try {
      trendingProducts = await fetchRssTrending();
    } catch {
      // Trending is optional, don't fail the whole request
    }

    // Merge curated + trending, deduplicate by id
    const mergedProducts = [...curatedProducts, ...trendingProducts];
    const products = [...new Map(mergedProducts.map((p) => [p.id, p])).values()];

    // Calculate next rotation time
    const SIX_HOURS = 6 * 60 * 60 * 1000;
    const nextRotation = new Date((epoch + 1) * SIX_HOURS).toISOString();

    return res.status(200).json({
      products,
      events,
      curation: {
        label: getCurationLabel(season),
        season,
        epoch,
        refreshedAt: new Date().toISOString(),
        nextRotationAt: nextRotation,
        vaultSize: allProducts.length,
        rotationSize: curatedProducts.length,
        trendingCount: trendingProducts.length,
      },
    });
  } catch (err) {
    console.error('Failed to load catalog:', err.message);
    return res.status(500).json({ error: 'Failed to load catalog' });
  }
};
