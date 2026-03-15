const fs = require('fs');
const path = require('path');
const { XMLParser } = require('fast-xml-parser');

const HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
  'Cache-Control': 'public, max-age=1800',
};

const RSS_FEEDS = [
  { url: 'https://www.vogue.com/feed/rss', source: 'Vogue' },
  { url: 'https://hypebeast.com/fashion/feed', source: 'Hypebeast' },
  { url: 'https://www.highsnobiety.com/rss/', source: 'Highsnobiety' },
];

const BRAND_NAMES = [
  'Acne Studios', 'The Row', 'Lemaire', 'Khaite', 'Bottega Veneta',
  'Jacquemus', 'Loewe', 'Toteme', 'Jil Sander', 'Ami Paris',
  'Maison Margiela', 'Nanushka', 'Our Legacy', 'Studio Nicholson', 'Auralee',
  'Prada', 'Gucci', 'Saint Laurent', 'Celine', 'Balenciaga',
  'Miu Miu', 'Dior', 'Chanel', 'Hermes', 'Rick Owens',
  'Fear of God', 'Stussy', 'Nike', 'Adidas', 'New Balance',
  'Comme des Garcons', 'Issey Miyake', 'Sacai', 'Undercover',
];

const EVENT_WORDS = /\b(fashion week|runway show|resort show|cruise show|met gala|fashion month|couture week|trade show|pitti)\b/i;
const PRICE_PATTERN = /\$[\d,]+/;

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  allowBooleanAttributes: true,
});

function extractImage(item) {
  if (item['media:content'] && item['media:content']['@_url']) return item['media:content']['@_url'];
  if (item['media:thumbnail'] && item['media:thumbnail']['@_url']) return item['media:thumbnail']['@_url'];
  if (item.enclosure && item.enclosure['@_url']) return item.enclosure['@_url'];
  const html = item['content:encoded'] || item.description || '';
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/);
  return match ? match[1] : null;
}

function extractText(item) {
  const raw = item.description || item['content:encoded'] || '';
  return raw.replace(/<[^>]+>/g, '').trim();
}

function extractCategory(item) {
  if (!item.category) return 'Fashion';
  if (Array.isArray(item.category)) {
    const first = item.category[0];
    return typeof first === 'string' ? first : first['#text'] || 'Fashion';
  }
  return typeof item.category === 'string' ? item.category : item.category['#text'] || 'Fashion';
}

function detectBrand(text) {
  const lower = text.toLowerCase();
  for (const brand of BRAND_NAMES) {
    if (lower.includes(brand.toLowerCase())) return brand;
  }
  return null;
}

async function fetchFeed(feedConfig) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(feedConfig.url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CHARMZ/1.0)' },
    });
    clearTimeout(timeout);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const xml = await response.text();
    const parsed = parser.parse(xml);
    const channel = parsed.rss && parsed.rss.channel;
    if (!channel || !channel.item) return [];
    return Array.isArray(channel.item) ? channel.item : [channel.item];
  } catch (err) {
    clearTimeout(timeout);
    console.warn(`Feed failed (${feedConfig.source}): ${err.message}`);
    return [];
  }
}

function itemToTrendingProduct(item, source) {
  const title = item.title || '';
  const fullText = title + ' ' + extractText(item);
  const brand = detectBrand(fullText);
  const imageUrl = extractImage(item);
  if (!brand || !imageUrl) return null;

  const priceMatch = fullText.match(PRICE_PATTERN);
  const price = priceMatch ? parseInt(priceMatch[0].replace(/[$,]/g, ''), 10) : 0;

  return {
    id: 'trending-' + title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40),
    title: title.length > 60 ? title.slice(0, 60).replace(/\s+\S*$/, '') + '...' : title,
    brand,
    price,
    currency: 'USD',
    buyUrl: item.link || '',
    imageUrl,
    category: extractCategory(item),
    description: extractText(item).slice(0, 200) || 'Trending from ' + source,
    isNew: true,
    isFeatured: false,
    isTrending: true,
    source,
  };
}

function itemToEvent(item, source) {
  const title = item.title || '';
  const fullText = title + ' ' + extractText(item);
  if (!EVENT_WORDS.test(fullText)) return null;

  const pubDate = item.pubDate ? new Date(item.pubDate) : new Date();
  const dateStr = pubDate.toISOString().split('T')[0];

  return {
    id: 'rss-' + title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40),
    name: title.length > 50 ? title.slice(0, 50).replace(/\s+\S*$/, '') + '...' : title,
    subtitle: 'Via ' + source,
    location: '',
    startDate: dateStr,
    endDate: dateStr,
    type: 'brand-event',
    url: item.link || '',
    isAutoDetected: true,
  };
}

async function fetchTrending() {
  try {
    const results = await Promise.allSettled(
      RSS_FEEDS.map(async (feed) => {
        const items = await fetchFeed(feed);
        return items.map((item) => ({ item, source: feed.source }));
      })
    );

    const allItems = results
      .filter((r) => r.status === 'fulfilled')
      .flatMap((r) => r.value);

    const trendingProducts = allItems
      .map(({ item, source }) => itemToTrendingProduct(item, source))
      .filter(Boolean)
      .slice(0, 8);

    const detectedEvents = allItems
      .map(({ item, source }) => itemToEvent(item, source))
      .filter(Boolean)
      .slice(0, 5);

    return { trendingProducts, detectedEvents };
  } catch (err) {
    console.warn('Trending fetch failed:', err.message);
    return { trendingProducts: [], detectedEvents: [] };
  }
}

module.exports = async function handler(req, res) {
  // Set CORS headers
  Object.entries(HEADERS).forEach(([key, value]) => res.setHeader(key, value));

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  try {
    const dataDir = path.join(process.cwd(), 'data');
    const curatedProducts = JSON.parse(fs.readFileSync(path.join(dataDir, 'products.json'), 'utf8'));
    const curatedEvents = JSON.parse(fs.readFileSync(path.join(dataDir, 'events.json'), 'utf8'));

    // Fetch trending data from RSS feeds on-demand
    const { trendingProducts, detectedEvents } = await fetchTrending();

    // Merge curated + trending, deduplicate by id
    const allProducts = [...curatedProducts, ...trendingProducts];
    const allEvents = [...curatedEvents, ...detectedEvents];
    const products = [...new Map(allProducts.map((p) => [p.id, p])).values()];
    const events = [...new Map(allEvents.map((e) => [e.id, e])).values()];

    return res.status(200).json({ products, events, refreshedAt: new Date().toISOString() });
  } catch (err) {
    console.error('Failed to load catalog:', err.message);
    return res.status(500).json({ error: 'Failed to load catalog' });
  }
};
