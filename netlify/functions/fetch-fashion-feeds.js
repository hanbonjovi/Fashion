const { XMLParser } = require('fast-xml-parser');

const RSS_FEEDS = [
  { url: 'https://www.vogue.com/feed/rss', source: 'Vogue' },
  { url: 'https://hypebeast.com/fashion/feed', source: 'Hypebeast' },
  { url: 'https://www.whowhatwear.com/rss', source: 'Who What Wear' },
  { url: 'https://www.highsnobiety.com/rss/', source: 'Highsnobiety' },
];

const HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
  'Cache-Control': 'public, max-age=1800',
};

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  allowBooleanAttributes: true,
});

// Refine long bloggy headlines to focus on the fashion product
function refineTitle(title) {
  if (!title || title.length <= 50) return title;

  // Split on common blog title separators and take the most product-focused part
  const separators = /\s*[—–\-:]\s*/;
  const parts = title.split(separators).filter((p) => p.length > 5);

  if (parts.length > 1) {
    // Find the part most likely about fashion (contains fashion keywords)
    const fashionWords = /\b(dress|coat|blazer|jacket|trouser|pant|skirt|bag|tote|shoe|boot|sneaker|knit|sweater|cardigan|shirt|denim|jean|suit|silk|leather|cashmere|linen|wool|cotton|collection|collab|style|look|outfit|wear|trend|chic|luxur|designer|runway|spring|summer|fall|winter|resort)\b/i;

    const fashionPart = parts.find((p) => fashionWords.test(p));
    if (fashionPart && fashionPart.length >= 15) {
      return fashionPart.trim();
    }

    // Otherwise take the longest meaningful part (likely the descriptive one)
    const longest = parts.reduce((a, b) => (a.length >= b.length ? a : b));
    if (longest.length <= 80) return longest.trim();
  }

  // If still too long, truncate at a natural break
  if (title.length > 80) {
    const truncated = title.substring(0, 80).replace(/\s+\S*$/, '');
    return truncated + '...';
  }

  return title;
}

function extractImage(item) {
  // Try media:content
  if (item['media:content'] && item['media:content']['@_url']) {
    return item['media:content']['@_url'];
  }
  // Try media:thumbnail
  if (item['media:thumbnail'] && item['media:thumbnail']['@_url']) {
    return item['media:thumbnail']['@_url'];
  }
  // Try enclosure
  if (item.enclosure && item.enclosure['@_url']) {
    return item.enclosure['@_url'];
  }
  // Try to find img in description/content:encoded
  const html = item['content:encoded'] || item.description || '';
  const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["']/);
  if (imgMatch) {
    return imgMatch[1];
  }
  return null;
}

function extractExcerpt(item) {
  const raw = item.description || item['content:encoded'] || '';
  // Strip HTML tags
  const text = raw.replace(/<[^>]+>/g, '').trim();
  if (text.length > 200) {
    return text.substring(0, 200).replace(/\s+\S*$/, '') + '...';
  }
  return text || 'Read more on the source site.';
}

function extractCategory(item) {
  if (!item.category) return 'Fashion';
  if (Array.isArray(item.category)) {
    return typeof item.category[0] === 'string' ? item.category[0] : item.category[0]['#text'] || 'Fashion';
  }
  return typeof item.category === 'string' ? item.category : item.category['#text'] || 'Fashion';
}

async function fetchFeed(feedConfig) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(feedConfig.url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CHARMZ/1.0; +https://charmz.netlify.app)',
      },
    });
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const xml = await response.text();
    const parsed = parser.parse(xml);

    // Handle RSS 2.0
    const channel = parsed.rss?.channel;
    if (!channel || !channel.item) {
      throw new Error('No items found in feed');
    }

    const items = Array.isArray(channel.item) ? channel.item : [channel.item];

    return items.slice(0, 5).map((item) => ({
      title: refineTitle(item.title || 'Untitled'),
      excerpt: extractExcerpt(item),
      source: feedConfig.source,
      sourceUrl: item.link || feedConfig.url,
      imageUrl: extractImage(item),
      publishedAt: item.pubDate || new Date().toISOString(),
      category: extractCategory(item),
    }));
  } catch (err) {
    clearTimeout(timeout);
    console.error(`Failed to fetch ${feedConfig.source}: ${err.message}`);
    return [];
  }
}

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: HEADERS, body: '' };
  }

  const results = await Promise.allSettled(RSS_FEEDS.map(fetchFeed));

  const allArticles = results
    .filter((r) => r.status === 'fulfilled')
    .flatMap((r) => r.value)
    .filter((article) => article.imageUrl) // Only keep articles with images
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

  if (allArticles.length === 0) {
    return {
      statusCode: 503,
      headers: HEADERS,
      body: JSON.stringify({ error: 'All feeds unavailable', fallback: true }),
    };
  }

  return {
    statusCode: 200,
    headers: HEADERS,
    body: JSON.stringify({
      pickOfTheDay: allArticles[0],
      trending: allArticles.slice(1, 12),
      fetchedAt: new Date().toISOString(),
    }),
  };
};
