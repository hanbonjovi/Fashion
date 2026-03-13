/* ========================================
   CHARMZ — Pick of the Day
   App logic, data, and interactivity
   ======================================== */

// ---- Fallback Data (used when RSS feeds are unavailable) ----
const fallbackItems = [
  {
    title: "Sculptural Wool Coat",
    excerpt: "An architectural masterpiece in double-faced wool. This oversized coat features clean, sculptural lines with dropped shoulders and a dramatic drape that moves beautifully.",
    source: "Acne Studios",
    sourceUrl: "https://www.acnestudios.com",
    imageUrl: "https://images.unsplash.com/photo-1539533113208-f6df8cc8b543?w=800&q=80",
    publishedAt: new Date().toISOString(),
    category: "Outerwear"
  },
  {
    title: "Silk Draped Midi Dress",
    excerpt: "Effortless elegance defined. This fluid silk charmeuse dress features an asymmetric drape at the waist and a subtle cowl neckline.",
    source: "The Row",
    sourceUrl: "https://www.therow.com",
    imageUrl: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80",
    publishedAt: new Date().toISOString(),
    category: "Dresses"
  },
  {
    title: "Tailored Wide-Leg Trousers",
    excerpt: "The foundation of a considered wardrobe. These wide-leg trousers are cut from a Japanese cotton-wool blend with a high rise and deep pleats.",
    source: "Lemaire",
    sourceUrl: "https://www.lemaire.fr",
    imageUrl: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&q=80",
    publishedAt: new Date().toISOString(),
    category: "Trousers"
  },
  {
    title: "Cashmere Oversized Knit",
    excerpt: "Luxurious simplicity at its finest. This generously proportioned cashmere sweater features a rolled neckline and elongated sleeves.",
    source: "Khaite",
    sourceUrl: "https://www.khaite.com",
    imageUrl: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&q=80",
    publishedAt: new Date().toISOString(),
    category: "Knitwear"
  },
  {
    title: "Leather Minimal Tote",
    excerpt: "The ultimate everyday luxury. Crafted from supple nappa leather with Bottega's signature intrecciato weave detail at the base.",
    source: "Bottega Veneta",
    sourceUrl: "https://www.bottegaveneta.com",
    imageUrl: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&q=80",
    publishedAt: new Date().toISOString(),
    category: "Accessories"
  },
  {
    title: "Deconstructed Linen Blazer",
    excerpt: "Mediterranean ease meets Parisian tailoring. This unstructured single-breasted blazer is cut from washed French linen.",
    source: "Jacquemus",
    sourceUrl: "https://www.jacquemus.com",
    imageUrl: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&q=80",
    publishedAt: new Date().toISOString(),
    category: "Blazers"
  }
];

// ---- State ----
let pickOfTheDay = null;
let trendingItems = [];

// ---- DOM Elements ----
const heroTitle = document.getElementById('hero-title');
const heroSubtitle = document.getElementById('hero-subtitle');
const heroSource = document.getElementById('hero-source');
const heroDate = document.getElementById('hero-date');
const heroImage = document.getElementById('hero-image');
const heroCta = document.getElementById('hero-cta');

const detailPanel = document.getElementById('detail-panel');
const detailClose = document.getElementById('detail-close');
const detailTitle = document.getElementById('detail-title');
const detailSourceName = document.getElementById('detail-source-name');
const detailDescription = document.getElementById('detail-description');
const detailSource = document.getElementById('detail-source');
const detailDate = document.getElementById('detail-date');
const detailCategory = document.getElementById('detail-category');
const detailReadMore = document.getElementById('detail-read-more');
const detailGallery = document.getElementById('detail-gallery');

const marqueeTrack = document.getElementById('marquee-track');

// ---- Helpers ----
function formatDate(dateStr) {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric'
    });
  } catch {
    return '';
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ---- Fetch RSS Feeds ----
async function fetchFashionFeeds() {
  try {
    const response = await fetch('/.netlify/functions/fetch-fashion-feeds');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (data.fallback) return null;
    return data;
  } catch (err) {
    console.warn('RSS fetch failed, using fallback data:', err);
    return null;
  }
}

// ---- Render Hero ----
function renderHero(item) {
  heroImage.style.opacity = '0';
  heroTitle.style.opacity = '0';
  heroSubtitle.style.opacity = '0';

  setTimeout(() => {
    heroTitle.textContent = item.title;
    heroSubtitle.textContent = item.excerpt;
    heroSource.textContent = item.source;
    heroDate.textContent = formatDate(item.publishedAt);
    heroImage.style.backgroundImage = `url(${item.imageUrl})`;

    heroCta.href = item.sourceUrl;

    heroImage.style.opacity = '1';
    heroTitle.style.opacity = '1';
    heroSubtitle.style.opacity = '1';
  }, 300);
}

// ---- Detail Panel ----
function openDetail(item) {
  detailTitle.textContent = item.title;
  detailSourceName.textContent = `From ${item.source}`;
  detailDescription.textContent = item.excerpt;
  detailSource.textContent = item.source;
  detailDate.textContent = formatDate(item.publishedAt);
  detailCategory.textContent = item.category || 'Fashion';
  detailReadMore.href = item.sourceUrl;

  detailGallery.innerHTML = `<img src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(item.title)}" loading="lazy">`;

  detailPanel.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeDetail() {
  detailPanel.classList.remove('open');
  document.body.style.overflow = '';
}

detailClose.addEventListener('click', closeDetail);

detailPanel.addEventListener('click', (e) => {
  if (e.target === detailPanel) closeDetail();
});

// Keyboard: Escape to close detail
document.addEventListener('keydown', (e) => {
  if (detailPanel.classList.contains('open') && e.key === 'Escape') {
    closeDetail();
  }
});

// ---- Trending ----
function renderTrending() {
  marqueeTrack.innerHTML = '';

  trendingItems.forEach((item) => {
    const el = document.createElement('div');
    el.className = 'marquee-item';
    el.innerHTML = `
      <div class="marquee-img-wrapper">
        <img class="marquee-img" src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(item.title)}" loading="lazy">
      </div>
      <p class="marquee-name">${escapeHtml(item.title)}</p>
      <p class="marquee-source">${escapeHtml(item.source)}</p>
    `;
    el.addEventListener('click', () => openDetail(item));
    marqueeTrack.appendChild(el);
  });
}

// ---- Scroll Effects ----
function handleScroll() {
  const nav = document.querySelector('.nav');
  nav.classList.toggle('scrolled', window.scrollY > 50);
}

// ---- Mobile nav toggle ----
document.querySelector('.nav-toggle').addEventListener('click', function() {
  const links = document.querySelector('.nav-links');
  if (links.style.display === 'flex') {
    links.style.display = 'none';
  } else {
    links.style.display = 'flex';
    links.style.flexDirection = 'column';
    links.style.position = 'absolute';
    links.style.top = '100%';
    links.style.right = '0';
    links.style.background = 'rgba(250,250,250,0.98)';
    links.style.padding = '1.5rem 2rem';
    links.style.borderRadius = '4px';
    links.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
    links.style.gap = '1rem';
  }
});

// ---- Init ----
async function init() {
  const data = await fetchFashionFeeds();

  if (data && data.pickOfTheDay) {
    pickOfTheDay = data.pickOfTheDay;
    trendingItems = data.trending || [];
  } else {
    // Use fallback static data
    pickOfTheDay = fallbackItems[0];
    trendingItems = fallbackItems.slice(1);
  }

  renderHero(pickOfTheDay);
  renderTrending();

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();
}

init();
