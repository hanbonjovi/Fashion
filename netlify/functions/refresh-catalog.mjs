import { XMLParser } from 'fast-xml-parser';
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Netlify scheduled function — runs every 6 hours
// To configure, add to netlify.toml:
//   [functions."refresh-catalog"]
//     schedule = "0 */6 * * *"

const __dirname = dirname(fileURLToPath(import.meta.url));

const PRODUCT_FEEDS = [
  { url: 'https://www.vogue.com/feed/rss', source: 'Vogue' },
  { url: 'https://hypebeast.com/fashion/feed', source: 'Hypebeast' },
  { url: 'https://www.highsnobiety.com/rss/', source: 'Highsnobiety' },
];

const EVENT_FEEDS = [
  { url: 'https://www.vogue.com/feed/rss', source: 'Vogue' },
];

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  allowBooleanAttributes: true,
});

function extractImage(item) {
  if (item['media:content']?.['@_url']) return item['media:content']['@_url'];
  if (item['media:thumbnail']?.['@_url']) return item['media:thumbnail']['@_url'];
  if (item.enclosure?.['@_url']) return item.enclosure['@_url'];
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

// Detect if an RSS item is about a specific product (has brand + price signals)
const BRAND_NAMES = [
  'Acne Studios', 'The Row', 'Lemaire', 'Khaite', 'Bottega Veneta',
  'Jacquemus', 'Loewe', 'Toteme', 'Jil Sander', 'Ami Paris',
  'Maison Margiela', 'Nanushka', 'Our Legacy', 'Studio Nicholson', 'Auralee',
  'Prada', 'Gucci', 'Saint Laurent', 'Celine', 'Balenciaga',
  'Miu Miu', 'Dior', 'Chanel', 'Hermes', 'Rick Owens',
  'Fear of God', 'Stussy', 'Nike', 'Adidas', 'New Balance',
  'Comme des Garcons', 'Issey Miyake', 'Sacai', 'Undercover',
];

const PRODUCT_WORDS = /\b(collection|collab|launch|drop|release|new arrival|capsule|exclusive|limited edition)\b/i;
const PRICE_PATTERN = /\$[\d,]+/;

function detectBrand(text) {
  for (const brand of BRAND_NAMES) {
    if (text.toLowerCase().includes(brand.toLowerCase())) return brand;
  }
  return null;
}

function extractPrice(text) {
  const match = text.match(PRICE_PATTERN);
  if (match) {
    return parseInt(match[0].replace(/[$,]/g, ''), 10);
  }
  return null;
}

async function fetchFeed(feedConfig) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(feedConfig.url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CHARMZ/1.0; +https://charmz.netlify.app)',
      },
    });
    clearTimeout(timeout);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const xml = await response.text();
    const parsed = parser.parse(xml);
    const channel = parsed.rss?.channel;
    if (!channel?.item) return [];
    return Array.isArray(channel.item) ? channel.item : [channel.item];
  } catch (err) {
    clearTimeout(timeout);
    console.warn(`Feed fetch failed (${feedConfig.source}): ${err.message}`);
    return [];
  }
}

function itemToTrendingProduct(item, source) {
  const title = item.title || '';
  const fullText = `${title} ${extractText(item)}`;
  const brand = detectBrand(fullText);
  const price = extractPrice(fullText);
  const imageUrl = extractImage(item);

  if (!brand || !imageUrl) return null;

  const id = `trending-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}`;
  const category = extractCategory(item);

  return {
    id,
    title: title.length > 60 ? title.slice(0, 60).replace(/\s+\S*$/, '') + '...' : title,
    brand,
    price: price || 0,
    currency: 'USD',
    buyUrl: item.link || '',
    imageUrl,
    category: category || 'Fashion',
    description: extractText(item).slice(0, 200) || `Trending from ${source}`,
    isNew: true,
    isFeatured: false,
    isTrending: true,
    source,
    fetchedAt: new Date().toISOString(),
  };
}

// Detect fashion events from RSS (fashion week, show, gala mentions)
const EVENT_WORDS = /\b(fashion week|runway show|resort show|cruise show|met gala|fashion month|couture week|trade show|pitti)\b/i;

function itemToEvent(item, source) {
  const title = item.title || '';
  const text = extractText(item);
  const fullText = `${title} ${text}`;

  if (!EVENT_WORDS.test(fullText)) return null;

  const pubDate = item.pubDate ? new Date(item.pubDate) : new Date();
  const dateStr = pubDate.toISOString().split('T')[0];

  return {
    id: `rss-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}`,
    name: title.length > 50 ? title.slice(0, 50).replace(/\s+\S*$/, '') + '...' : title,
    subtitle: `Via ${source}`,
    location: '',
    startDate: dateStr,
    endDate: dateStr,
    type: 'brand-event',
    url: item.link || '',
    isAutoDetected: true,
    fetchedAt: new Date().toISOString(),
  };
}

export default async function handler() {
  const dataDir = resolve(__dirname, '../../data');
  console.log('Refreshing catalog from RSS feeds...');

  // Load existing data
  let existingProducts, existingEvents;
  try {
    existingProducts = JSON.parse(readFileSync(resolve(dataDir, 'products.json'), 'utf8'));
    existingEvents = JSON.parse(readFileSync(resolve(dataDir, 'events.json'), 'utf8'));
  } catch (err) {
    console.error('Failed to read existing data:', err.message);
    return { statusCode: 500 };
  }

  // Fetch all product feeds
  const feedResults = await Promise.allSettled(
    PRODUCT_FEEDS.map(async (feed) => {
      const items = await fetchFeed(feed);
      return items.map((item) => ({ item, source: feed.source }));
    })
  );

  const allItems = feedResults
    .filter((r) => r.status === 'fulfilled')
    .flatMap((r) => r.value);

  // Extract trending products from RSS
  const trendingProducts = allItems
    .map(({ item, source }) => itemToTrendingProduct(item, source))
    .filter(Boolean)
    .slice(0, 8);

  // Extract events from RSS
  const detectedEvents = allItems
    .map(({ item, source }) => itemToEvent(item, source))
    .filter(Boolean)
    .slice(0, 5);

  // Merge: keep all curated (non-trending) products, replace old trending
  const curatedProducts = existingProducts.filter((p) => !p.isTrending);
  const mergedProducts = [...curatedProducts, ...trendingProducts];

  // Merge events: keep curated, replace old auto-detected
  const curatedEvents = existingEvents.filter((e) => !e.isAutoDetected);
  const mergedEvents = [...curatedEvents, ...detectedEvents];

  // Deduplicate by id
  const uniqueProducts = [...new Map(mergedProducts.map((p) => [p.id, p])).values()];
  const uniqueEvents = [...new Map(mergedEvents.map((e) => [e.id, e])).values()];

  // Write back
  try {
    writeFileSync(resolve(dataDir, 'products.json'), JSON.stringify(uniqueProducts, null, 2));
    writeFileSync(resolve(dataDir, 'events.json'), JSON.stringify(uniqueEvents, null, 2));
    console.log(`Catalog refreshed: ${trendingProducts.length} trending products, ${detectedEvents.length} events detected`);
  } catch (err) {
    console.error('Failed to write data:', err.message);
    return { statusCode: 500 };
  }

  return { statusCode: 200 };
}
