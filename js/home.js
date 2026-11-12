// ============================================================
// AMEER OFFICIAL — homepage logic
// ============================================================
import { renderNavbar } from "./navbar.js";
import { renderFooter, initReveal } from "./app.js";
import { trending, bestsellers, newArrivals } from "./products.js";
import { renderGrid } from "./product-card.js";
import { optimizeImg, esc, lsGet, lsSet } from "./utils.js";

// Shown only until the admin has added banners in Admin › Banners.
const SLIDES = [
  { img: "assets/images/women-hero.jpg", eyebrow: "The new season", title: "Fresh lawn, ready when you are.", text: "Unstitched and ready-to-wear in fabrics that look and feel luxurious, wash after wash.", cta: "Shop women", href: "women.html" },
  { img: "assets/images/men-hero.jpg", eyebrow: "For him", title: "Effortless, elevated.", text: "Menswear staples with an impeccable finish.", cta: "Shop men", href: "men.html" }
];

// Fallback tiles, only used if the admin hasn't set any categories yet.
const CATEGORY_TILES = [
  { name: "Women", subtitle: "Unstitched, stitched & more", link: "women.html", image: "assets/images/women-tile.jpg" },
  { name: "Men", subtitle: "7 collections", link: "men.html", image: "assets/images/men-tile.jpg" }
];

let slide = 0, timer, SLIDES_ACTIVE = SLIDES;

// SPEED: banners and category tiles come from Firestore, which has to
// download its SDK and make a round trip first. We keep the last answer in
// localStorage, paint from it immediately, then check for changes in the
// background and repaint only if the admin actually changed something.
async function paintCached(key, load, paint) {
  const saved = lsGet("lx-home:" + key, null);
  if (saved) paint(saved);
  let fresh = null;
  try { fresh = await load(); } catch { /* offline or not configured */ }
  if (fresh === null) { if (!saved) paint(null); return; }
  if (!saved || JSON.stringify(saved) !== JSON.stringify(fresh)) paint(fresh);
  lsSet("lx-home:" + key, fresh);
}

function boot() {
  renderNavbar("");
  renderFooter();
  initReveal();

  // Each block paints as soon as its own data arrives — the banner no longer
  // waits for the product catalog, and the product rows don't wait for it.
  paintCached("banners", loadBanners, (slides) => { SLIDES_ACTIVE = slides && slides.length ? slides : SLIDES; buildHero(); });
  paintCached("categories", loadCategoryTiles, (tiles) => buildCategoryStrip(tiles && tiles.length ? tiles : CATEGORY_TILES));

  Promise.all([newArrivals(), trending(), bestsellers()]).then(([fresh, hot, best]) => {
    fillRow("gridNew", fresh.slice(0, 20));
    fillRow("gridTrending", hot.slice(0, 16));
    fillRow("gridBest", best.slice(0, 16));
    initProductCarousels();
    setSideTilePhoto(fresh[0]);
  });
  buildInstagram();
}

// A row with nothing in it (for example no products flagged "trending" yet)
// hides its whole section instead of showing a heading over empty space.
function fillRow(gridId, products) {
  const grid = document.getElementById(gridId);
  if (!grid) return;
  const section = grid.closest("section");
  if (!products.length) { if (section) section.hidden = true; return; }
  if (section) section.hidden = false;
  renderGrid(gridId, products);
}

// The "New In" shortcut tile shows the newest product's photo once known.
function setSideTilePhoto(p) {
  const img = document.getElementById("sideNewImg");
  if (!img || !p || !p.image) return;
  img.dataset.raw = p.image;
  delete img.dataset.fellBack;
  img.src = optimizeImg(p.image, 500);
}

// Wires the prev/next arrows on every ".p-carousel" (New Arrivals, Trending,
// Best sellers). The row itself is a plain scrollable element — the arrows
// just move it by one "page" at a time, which also plays nicely with
// touch/trackpad swiping since that's the same native scroll. Arrows fade
// out at either end instead of just sitting there doing nothing.
function initProductCarousels() {
  document.querySelectorAll(".p-carousel").forEach((car) => {
    const track = car.querySelector(".p-car-track");
    const prev = car.querySelector("[data-car-prev]");
    const next = car.querySelector("[data-car-next]");
    if (!track || !prev || !next) return;

    const page = () => track.clientWidth * 0.9; // one screenful, with a sliver of overlap so it's obvious it moved
    const atStart = () => track.scrollLeft <= 4;
    const atEnd = () => track.scrollLeft >= track.scrollWidth - track.clientWidth - 4;

    const sync = () => {
      prev.disabled = atStart();
      next.disabled = atEnd();
      // nothing to scroll at all (row is shorter than its container) — hide both
      const noOverflow = track.scrollWidth <= track.clientWidth + 4;
      prev.style.display = noOverflow ? "none" : "";
      next.style.display = noOverflow ? "none" : "";
    };

    prev.onclick = () => track.scrollBy({ left: -page(), behavior: "smooth" });
    next.onclick = () => track.scrollBy({ left: page(), behavior: "smooth" });
    track.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    sync();
  });
}

// "Shop by category" cards the admin manages in Categories.
async function loadCategoryTiles() {
  const { listCategories } = await import("./admin-data.js");
  return (await listCategories())
    .filter((c) => c.active !== false && c.image)
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map((c) => ({
      name: c.name, subtitle: c.subtitle || "", link: c.link || (c.slug ? c.slug + ".html" : "#"), image: c.image
    }));
}
function buildCategoryStrip(tiles) {
  const wrap = document.getElementById("catStrip");
  if (!wrap) return;
  wrap.innerHTML = tiles.map((t) => `
    <a class="cat-tile" href="${esc(t.link)}"><img loading="lazy" decoding="async" width="600" height="750" src="${esc(optimizeImg(t.image, 600))}" data-raw="${esc(t.image)}" alt=""><b>${esc(t.name)}<small>${esc(t.subtitle)}</small></b></a>
  `).join("");
}

// Hero slides the admin manages in Banners.
async function loadBanners() {
  const { listBanners } = await import("./admin-data.js");
  return (await listBanners()).filter((b) => b.active !== false).map((b) => ({
    img: b.image, eyebrow: "AMEER OFFICIAL", title: b.title,
    text: b.subtitle || "", cta: "Shop now", href: b.link || "women.html"
  }));
}

function buildHero() {
  const wrap = document.getElementById("heroSlides");
  const dots = document.getElementById("heroDots");
  if (!wrap || !dots) return;
  slide = 0;
  // Only the first slide's photo is fetched immediately (high priority — it is
  // the largest thing on screen); the rest are swapped in once the page is idle.
  wrap.innerHTML = SLIDES_ACTIVE.map((s, i) => `
    <div class="hero-slide tint-${i % 3} ${i===0?'on':''}">
      <div class="hero-content">
        <span class="hero-pill">${esc(s.eyebrow)}</span>
        <h1>${esc(s.title)}</h1>
        <p>${esc(s.text)}</p>
        <a class="btn btn-primary" href="${esc(s.href)}">${esc(s.cta)}</a>
      </div>
      <div class="hero-media">
        <img ${i === 0 ? `src="${esc(optimizeImg(s.img, 1000))}" fetchpriority="high"` : `data-src="${esc(optimizeImg(s.img, 1000))}"`} data-raw="${esc(s.img)}" alt="">
      </div>
    </div>`).join("");
  document.querySelector(".hero").classList.toggle("single", SLIDES_ACTIVE.length < 2);
  dots.innerHTML = SLIDES_ACTIVE.map((_, i) => `<button class="${i===0?'on':''}" data-i="${i}" aria-label="Slide ${i+1}"></button>`).join("");
  dots.querySelectorAll("button").forEach((b) => b.onclick = () => show(+b.dataset.i));
  document.getElementById("heroPrev").onclick = () => show(slide - 1);
  document.getElementById("heroNext").onclick = () => show(slide + 1);
  auto();
  preloadRemainingSlides();
}
function preloadRemainingSlides() {
  const imgs = document.querySelectorAll("#heroSlides img[data-src]");
  const load = () => imgs.forEach((img) => { img.src = img.dataset.src; img.removeAttribute("data-src"); });
  if ("requestIdleCallback" in window) requestIdleCallback(load, { timeout: 2000 });
  else setTimeout(load, 1200);
}
function show(i) {
  const slides = document.querySelectorAll(".hero-slide");
  const dots = document.querySelectorAll(".hero-dots button");
  if (!slides.length) return;
  slide = (i + slides.length) % slides.length;
  slides.forEach((s, k) => s.classList.toggle("on", k === slide));
  dots.forEach((d, k) => d.classList.toggle("on", k === slide));
  auto();
}
function auto() {
  clearInterval(timer);
  if (SLIDES_ACTIVE.length > 1) timer = setInterval(() => show(slide + 1), 6000);
}

function buildInstagram() {
  const ig = document.getElementById("igGrid");
  if (!ig) return;
  ig.innerHTML = Array.from({ length: 6 }, (_, i) =>
    `<a href="#" aria-label="Instagram post"><img loading="lazy" src="${`https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=400&q=80`}" alt=""></a>`).join("");
}

boot();
