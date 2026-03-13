/* ========================================
   CHARMZ — Curated Fashion Discovery
   App logic, data, and interactivity
   ======================================== */

// ---- State ----
let featuredProduct = null;
let allProducts = [];
let activeFilter = 'all';

// ---- DOM Elements ----
const heroTitle = document.getElementById('hero-title');
const heroSubtitle = document.getElementById('hero-subtitle');
const heroBrand = document.getElementById('hero-brand');
const heroPrice = document.getElementById('hero-price');
const heroImage = document.getElementById('hero-image');
const heroCta = document.getElementById('hero-cta');

const detailPanel = document.getElementById('detail-panel');
const detailClose = document.getElementById('detail-close');
const detailLabel = document.getElementById('detail-label');
const detailTitle = document.getElementById('detail-title');
const detailBrand = document.getElementById('detail-brand');
const detailPrice = document.getElementById('detail-price');
const detailDescription = document.getElementById('detail-description');
const detailSpecBrand = document.getElementById('detail-spec-brand');
const detailSpecCategory = document.getElementById('detail-spec-category');
const detailBuy = document.getElementById('detail-buy');
const detailGallery = document.getElementById('detail-gallery');

const shopGrid = document.getElementById('shop-grid');
const shopFilters = document.getElementById('shop-filters');
const calendarGrid = document.getElementById('calendar-grid');
const editorialTrack = document.getElementById('editorial-track');
const editorialSection = document.getElementById('editorial');

// ---- Helpers ----
function formatPrice(price, currency) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

function formatDateRange(startDate, endDate) {
  const start = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');
  const opts = { month: 'short', day: 'numeric' };

  if (startDate === endDate) {
    return start.toLocaleDateString('en-US', { ...opts, year: 'numeric' });
  }

  if (start.getMonth() === end.getMonth()) {
    return `${start.toLocaleDateString('en-US', opts)} – ${end.getDate()}, ${end.getFullYear()}`;
  }

  return `${start.toLocaleDateString('en-US', opts)} – ${end.toLocaleDateString('en-US', { ...opts, year: 'numeric' })}`;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ---- Render Hero ----
function renderHero(product) {
  heroImage.style.opacity = '0';
  heroTitle.style.opacity = '0';
  heroSubtitle.style.opacity = '0';

  setTimeout(() => {
    heroTitle.textContent = product.title;
    heroSubtitle.textContent = product.description;
    heroBrand.textContent = product.brand;
    heroPrice.textContent = formatPrice(product.price, product.currency);
    heroImage.style.backgroundImage = `url(${product.imageUrl})`;
    heroCta.href = product.buyUrl;

    heroImage.style.opacity = '1';
    heroTitle.style.opacity = '1';
    heroSubtitle.style.opacity = '1';
  }, 300);
}

// ---- Detail Panel ----
function openDetail(product) {
  detailLabel.textContent = product.category;
  detailTitle.textContent = product.title;
  detailBrand.textContent = product.brand;
  detailPrice.textContent = formatPrice(product.price, product.currency);
  detailDescription.textContent = product.description;
  detailSpecBrand.textContent = product.brand;
  detailSpecCategory.textContent = product.category;
  detailBuy.href = product.buyUrl;
  detailBuy.textContent = `Buy Now — ${formatPrice(product.price, product.currency)}`;

  detailGallery.innerHTML = `<img src="${escapeHtml(product.imageUrl)}" alt="${escapeHtml(product.title)}" loading="lazy">`;

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

document.addEventListener('keydown', (e) => {
  if (detailPanel.classList.contains('open') && e.key === 'Escape') {
    closeDetail();
  }
});

// ---- Shop Grid ----
function renderShopGrid(products) {
  shopGrid.innerHTML = '';

  products.forEach((product) => {
    const el = document.createElement('div');
    el.className = 'product-card';
    el.innerHTML = `
      ${product.isNew ? '<span class="product-card-badge">New</span>' : ''}
      <div class="product-card-img">
        <img src="${escapeHtml(product.imageUrl)}" alt="${escapeHtml(product.title)}" loading="lazy">
      </div>
      <p class="product-card-brand">${escapeHtml(product.brand)}</p>
      <p class="product-card-title">${escapeHtml(product.title)}</p>
      <p class="product-card-price">${formatPrice(product.price, product.currency)}</p>
    `;
    el.addEventListener('click', () => openDetail(product));
    shopGrid.appendChild(el);
  });
}

function initFilters(products) {
  const categories = ['All', ...new Set(products.map((p) => p.category))];

  shopFilters.innerHTML = '';
  categories.forEach((cat) => {
    const btn = document.createElement('button');
    btn.className = 'shop-filter-btn' + (cat === 'All' ? ' active' : '');
    btn.textContent = cat;
    btn.addEventListener('click', () => {
      activeFilter = cat === 'All' ? 'all' : cat;
      document.querySelectorAll('.shop-filter-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      const filtered = activeFilter === 'all'
        ? allProducts
        : allProducts.filter((p) => p.category === activeFilter);
      renderShopGrid(filtered);
    });
    shopFilters.appendChild(btn);
  });
}

// ---- Fashion Calendar ----
function renderCalendar(events) {
  const now = new Date();
  const upcoming = events
    .filter((e) => new Date(e.endDate + 'T23:59:59') >= now)
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

  calendarGrid.innerHTML = '';

  upcoming.forEach((event) => {
    const typeLabel = event.type.replace('-', ' ');
    const el = document.createElement('a');
    el.className = 'event-card';
    el.href = event.url || '#';
    el.target = '_blank';
    el.rel = 'noopener noreferrer';
    el.innerHTML = `
      <p class="event-date-range">${formatDateRange(event.startDate, event.endDate)}</p>
      <h3 class="event-name">${escapeHtml(event.name)}</h3>
      <p class="event-subtitle">${escapeHtml(event.subtitle)}</p>
      <p class="event-location">${escapeHtml(event.location)}<span class="event-badge">${escapeHtml(typeLabel)}</span></p>
    `;
    calendarGrid.appendChild(el);
  });
}

// ---- Editorial (RSS) ----
async function fetchFashionFeeds() {
  try {
    const response = await fetch('/.netlify/functions/fetch-fashion-feeds');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (data.fallback) return null;
    return data;
  } catch (err) {
    console.warn('RSS fetch failed:', err);
    return null;
  }
}

function renderEditorial(articles) {
  editorialTrack.innerHTML = '';

  articles.forEach((article) => {
    const el = document.createElement('a');
    el.className = 'article-card';
    el.href = article.sourceUrl;
    el.target = '_blank';
    el.rel = 'noopener noreferrer';
    el.innerHTML = `
      <div class="article-card-img">
        <img src="${escapeHtml(article.imageUrl)}" alt="${escapeHtml(article.title)}" loading="lazy">
      </div>
      <p class="article-card-source">${escapeHtml(article.source)}</p>
      <p class="article-card-title">${escapeHtml(article.title)}</p>
    `;
    editorialTrack.appendChild(el);
  });
}

// ---- Scroll Effects ----
function handleScroll() {
  const nav = document.querySelector('.nav');
  nav.classList.toggle('scrolled', window.scrollY > 50);
}

// ---- Mobile nav toggle ----
document.querySelector('.nav-toggle').addEventListener('click', function () {
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
  // Load curated products from data file
  allProducts = window.PRODUCTS || [];
  featuredProduct = allProducts.find((p) => p.isFeatured) || allProducts[0];
  const shopProducts = allProducts.filter((p) => p !== featuredProduct);

  // Render product sections immediately
  renderHero(featuredProduct);
  initFilters(shopProducts);
  renderShopGrid(shopProducts);

  // Render calendar
  const events = window.EVENTS || [];
  renderCalendar(events);

  // Fetch editorial content async (non-blocking)
  fetchFashionFeeds().then((data) => {
    if (data) {
      const articles = [data.pickOfTheDay, ...(data.trending || [])].filter((a) => a && a.imageUrl);
      if (articles.length > 0) {
        renderEditorial(articles);
      } else {
        editorialSection.style.display = 'none';
      }
    } else {
      editorialSection.style.display = 'none';
    }
  });

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();
}

init();
