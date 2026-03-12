/* ========================================
   MAISON — Fashion of the Day
   App logic, data, and interactivity
   ======================================== */

// ---- Fashion Data ----
const fashionItems = [
  {
    id: 1,
    name: "Sculptural Wool Coat",
    designer: "Acne Studios",
    price: 1890,
    description: "An architectural masterpiece in double-faced wool. This oversized coat features clean, sculptural lines with dropped shoulders and a dramatic drape that moves beautifully. The perfect statement piece for the modern minimalist.",
    material: "100% Virgin Wool",
    season: "Autumn/Winter 2026",
    sizes: "XS, S, M, L, XL",
    color: "#d4c5b0",
    purchaseUrl: "https://www.acnestudios.com",
    image: "https://images.unsplash.com/photo-1539533113208-f6df8cc8b543?w=800&q=80",
    gallery: "https://images.unsplash.com/photo-1539533113208-f6df8cc8b543?w=1200&q=80",
    tag: "Outerwear"
  },
  {
    id: 2,
    name: "Silk Draped Midi Dress",
    designer: "The Row",
    price: 2450,
    description: "Effortless elegance defined. This fluid silk charmeuse dress features an asymmetric drape at the waist and a subtle cowl neckline. The bias cut ensures a flattering silhouette that skims the body with grace.",
    material: "100% Mulberry Silk",
    season: "Spring/Summer 2026",
    sizes: "XS, S, M, L",
    color: "#e8ddd0",
    purchaseUrl: "https://www.therow.com",
    image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80",
    gallery: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=1200&q=80",
    tag: "Dresses"
  },
  {
    id: 3,
    name: "Tailored Wide-Leg Trousers",
    designer: "Lemaire",
    price: 890,
    description: "The foundation of a considered wardrobe. These wide-leg trousers are cut from a Japanese cotton-wool blend with a high rise and deep pleats. Relaxed yet refined, they pair effortlessly with everything from knits to blazers.",
    material: "Cotton-Wool Blend",
    season: "Resort 2026",
    sizes: "S, M, L, XL",
    color: "#c4b8a8",
    purchaseUrl: "https://www.lemaire.fr",
    image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&q=80",
    gallery: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=1200&q=80",
    tag: "Trousers"
  },
  {
    id: 4,
    name: "Cashmere Oversized Knit",
    designer: "Khaite",
    price: 1680,
    description: "Luxurious simplicity at its finest. This generously proportioned cashmere sweater features a rolled neckline and elongated sleeves. The chunky gauge creates beautiful texture while remaining incredibly lightweight.",
    material: "100% Mongolian Cashmere",
    season: "Autumn/Winter 2026",
    sizes: "XS, S, M, L",
    color: "#d9cfc2",
    purchaseUrl: "https://www.khaite.com",
    image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&q=80",
    gallery: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=1200&q=80",
    tag: "Knitwear"
  },
  {
    id: 5,
    name: "Leather Minimal Tote",
    designer: "Bottega Veneta",
    price: 3200,
    description: "The ultimate everyday luxury. Crafted from supple nappa leather with Bottega's signature intrecciato weave detail at the base. Unlined for a soft, relaxed shape with ample room for all daily essentials.",
    material: "Nappa Leather",
    season: "Pre-Fall 2026",
    sizes: "One Size",
    color: "#b8a992",
    purchaseUrl: "https://www.bottegaveneta.com",
    image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&q=80",
    gallery: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=1200&q=80",
    tag: "Accessories"
  },
  {
    id: 6,
    name: "Deconstructed Linen Blazer",
    designer: "Jacquemus",
    price: 1250,
    description: "Mediterranean ease meets Parisian tailoring. This unstructured single-breasted blazer is cut from washed French linen with a slightly cropped hem and relaxed shoulders. Perfectly imperfect.",
    material: "100% French Linen",
    season: "Spring/Summer 2026",
    sizes: "S, M, L, XL",
    color: "#e0d5c5",
    purchaseUrl: "https://www.jacquemus.com",
    image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&q=80",
    gallery: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=1200&q=80",
    tag: "Blazers"
  },
  {
    id: 7,
    name: "Pleated Satin Skirt",
    designer: "Toteme",
    price: 760,
    description: "Movement captured in fabric. This midi-length skirt features permanent knife pleats in lustrous recycled satin. The fluid drape creates a mesmerizing effect with every step, making it equal parts art and garment.",
    material: "Recycled Polyester Satin",
    season: "Spring/Summer 2026",
    sizes: "XS, S, M, L",
    color: "#ccc3b5",
    purchaseUrl: "https://www.toteme-studio.com",
    image: "https://images.unsplash.com/photo-1583496661160-fb5886a0uj9a?w=800&q=80",
    gallery: "https://images.unsplash.com/photo-1583496661160-fb5886a0uj9a?w=1200&q=80",
    tag: "Skirts"
  }
];

// Day names for cycling
const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// ---- State ----
let currentIndex = 0;

// ---- DOM Elements ----
const heroTitle = document.getElementById('hero-title');
const heroSubtitle = document.getElementById('hero-subtitle');
const heroPrice = document.getElementById('hero-price');
const heroDesigner = document.getElementById('hero-designer');
const heroImage = document.getElementById('hero-image');
const heroCta = document.getElementById('hero-cta');
const dayLabel = document.getElementById('day-label');
const prevBtn = document.getElementById('prev-day');
const nextBtn = document.getElementById('next-day');

const detailPanel = document.getElementById('detail-panel');
const detailClose = document.getElementById('detail-close');
const detailTitle = document.getElementById('detail-title');
const detailDesigner = document.getElementById('detail-designer');
const detailDescription = document.getElementById('detail-description');
const detailMaterial = document.getElementById('detail-material');
const detailSeason = document.getElementById('detail-season');
const detailSizes = document.getElementById('detail-sizes');
const detailPrice = document.getElementById('detail-price');
const detailPurchase = document.getElementById('detail-purchase');
const detailGallery = document.getElementById('detail-gallery');

const collectionGrid = document.getElementById('collection-grid');
const marqueeTrack = document.getElementById('marquee-track');

// ---- Render Hero ----
function renderHero(index, direction = 'none') {
  const item = fashionItems[index];

  heroImage.style.opacity = '0';
  heroTitle.style.opacity = '0';
  heroSubtitle.style.opacity = '0';

  setTimeout(() => {
    heroTitle.textContent = item.name;
    heroSubtitle.textContent = item.description.substring(0, 120) + '...';
    heroPrice.textContent = `$${item.price.toLocaleString()}`;
    heroDesigner.textContent = item.designer;
    heroImage.style.backgroundImage = `url(${item.image})`;
    dayLabel.textContent = dayNames[index % dayNames.length];

    heroCta.onclick = (e) => {
      e.preventDefault();
      openDetail(index);
    };

    heroImage.style.opacity = '1';
    heroTitle.style.opacity = '1';
    heroSubtitle.style.opacity = '1';
  }, 300);
}

// ---- Navigation ----
prevBtn.addEventListener('click', () => {
  currentIndex = (currentIndex - 1 + fashionItems.length) % fashionItems.length;
  renderHero(currentIndex, 'prev');
});

nextBtn.addEventListener('click', () => {
  currentIndex = (currentIndex + 1) % fashionItems.length;
  renderHero(currentIndex, 'next');
});

// Keyboard navigation
document.addEventListener('keydown', (e) => {
  if (detailPanel.classList.contains('open')) {
    if (e.key === 'Escape') closeDetail();
    return;
  }
  if (e.key === 'ArrowLeft') prevBtn.click();
  if (e.key === 'ArrowRight') nextBtn.click();
});

// ---- Detail Panel ----
function openDetail(index) {
  const item = fashionItems[index];

  detailTitle.textContent = item.name;
  detailDesigner.textContent = `By ${item.designer}`;
  detailDescription.textContent = item.description;
  detailMaterial.textContent = item.material;
  detailSeason.textContent = item.season;
  detailSizes.textContent = item.sizes;
  detailPrice.textContent = `$${item.price.toLocaleString()}`;
  detailPurchase.href = item.purchaseUrl;
  detailPurchase.target = '_blank';
  detailPurchase.rel = 'noopener noreferrer';

  detailGallery.innerHTML = `<img src="${item.gallery}" alt="${item.name}" loading="lazy">`;

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

// ---- Collection Grid ----
function renderCollection() {
  collectionGrid.innerHTML = '';

  fashionItems.forEach((item, index) => {
    const card = document.createElement('div');
    card.className = 'collection-card fade-in';
    card.innerHTML = `
      <div class="card-image-wrapper">
        <img class="card-image" src="${item.image}" alt="${item.name}" loading="lazy">
      </div>
      <div class="card-info">
        <h3 class="card-name">${item.name}</h3>
        <p class="card-designer">${item.designer}</p>
        <div class="card-bottom">
          <span class="card-price">$${item.price.toLocaleString()}</span>
          <span class="card-shop">View Details &rarr;</span>
        </div>
      </div>
    `;
    card.addEventListener('click', () => openDetail(index));
    collectionGrid.appendChild(card);
  });
}

// ---- Trending Marquee ----
function renderMarquee() {
  marqueeTrack.innerHTML = '';

  // Duplicate for seamless loop
  const items = [...fashionItems, ...fashionItems];

  items.forEach((item, index) => {
    const el = document.createElement('div');
    el.className = 'marquee-item';
    el.innerHTML = `
      <div class="marquee-img-wrapper">
        <img class="marquee-img" src="${item.image}" alt="${item.name}" loading="lazy">
      </div>
      <p class="marquee-name">${item.name}</p>
      <p class="marquee-price">$${item.price.toLocaleString()}</p>
    `;
    el.addEventListener('click', () => openDetail(index % fashionItems.length));
    marqueeTrack.appendChild(el);
  });
}

// ---- Scroll Effects ----
function handleScroll() {
  const nav = document.querySelector('.nav');
  nav.classList.toggle('scrolled', window.scrollY > 50);

  // Fade in collection cards
  document.querySelectorAll('.fade-in').forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight - 80) {
      el.classList.add('visible');
    }
  });
}

// Pause marquee on hover
function setupMarqueeHover() {
  const marquee = document.querySelector('.trending-marquee');
  if (marquee) {
    marquee.addEventListener('mouseenter', () => {
      marqueeTrack.style.animationPlayState = 'paused';
    });
    marquee.addEventListener('mouseleave', () => {
      marqueeTrack.style.animationPlayState = 'running';
    });
  }
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
function init() {
  // Set initial day based on actual day of week
  const today = new Date().getDay();
  currentIndex = today === 0 ? 6 : today - 1; // Map Sunday=0 -> 6, Mon=0
  currentIndex = currentIndex % fashionItems.length;

  renderHero(currentIndex);
  renderCollection();
  renderMarquee();
  setupMarqueeHover();

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();
}

init();
