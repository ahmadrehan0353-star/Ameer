// ============================================================
// AMEER OFFICIAL — product detail page (PDP)
// Renders full details for the product clicked from any grid,
// wires gallery, color/size selection, qty, add-to-cart, wishlist,
// reviews and a "you may also like" row.
// ============================================================
import { renderNavbar } from "./navbar.js";
import { renderFooter, initReveal } from "./app.js";
import { loadProducts, getProduct } from "./products.js";
import { addToCart, renderGrid } from "./product-card.js";
import { money, esc, lsGet, lsSet, param, toast, optimizeImg } from "./utils.js";

let product = null;
let allProducts = [];
let state = { color: null, size: null, qty: 1, img: 0 };

async function boot() {
  renderNavbar("");
  renderFooter();

  const id = param("id");
  allProducts = await loadProducts();
  product = id ? await getProduct(id) : null;

  if (!product) {
    document.getElementById("pdpRoot").innerHTML = `
      <div class="wish-empty">
        <b>Product not found</b>
        <p class="muted">This item may have been removed or the link is out of date.</p>
        <a class="btn btn-primary" href="index.html" style="margin-top:20px">Back to shop</a>
      </div>`;
    return;
  }

  // --- normalise: a product saved without images/colours/sizes must still render ---
  if (!Array.isArray(product.images) || !product.images.length) {
    product.images = [product.image].filter(Boolean);
  }
  if (!product.images.length && product.image) product.images = [product.image];
  if (!Array.isArray(product.colors) || !product.colors.length) {
    product.colors = [{ name: "Default", hex: "#111111" }];
  }
  if (!Array.isArray(product.sizes)) product.sizes = [];

  state.color = (product.colors && product.colors[0] && product.colors[0].name) || null;
  state.size =
  (product.sizes &&
   product.sizes.length &&
   !product.sizes.includes("Unstitched"))
    ? product.sizes[Math.floor(product.sizes.length / 2)]
    : null;
  if (typeof state.img !== "number" || state.img >= product.images.length) state.img = 0;

  document.title = `${product.name} — AMEER OFFICIAL`;
  // If anything unexpected throws, show the product instead of a blank page.
  try {
    renderPDP();
    renderReviews();
    renderRelated();
    initReveal();
  } catch (err) {
    console.error("Product page render failed:", err);
    document.getElementById("pdpRoot").innerHTML = `
      <div class="wish-empty">
        <b>${esc(product.name || "Product")}</b>
        <p class="muted">${esc(product.desc || "We couldn't display this product fully.")}</p>
        <a class="btn btn-primary" href="women.html" style="margin-top:20px">Continue shopping</a>
      </div>`;
  }
}

// ---------------- gallery + info column ----------------
function renderPDP() {
  const root = document.getElementById("pdpRoot");
  const images = product.images && product.images.length ? product.images : [product.image];
  const wish = lsGet("lx-wish", []);
  const saved = wish.includes(product.id);

  const off = product.salePrice
    ? Math.round((1 - product.salePrice / product.price) * 100)
    : 0;

  const stockClass = product.stock > 10 ? "stock-in" : product.stock > 0 ? "stock-low" : "stock-out";
  const stockText = product.stock > 10 ? "In stock" : product.stock > 0 ? `Only ${product.stock} left` : "Out of stock";

  root.innerHTML = `
    <div class="crumb">
      <a href="index.html">Home</a><span>/</span>
      <a href="${esc(product.category)}.html">${esc(cap(product.category))}</a><span>/</span>
      ${esc(product.name)}
    </div>
    <div class="pdp">
      <div class="gallery">
        <div class="gal-main" id="galMain">
          <img id="galMainImg" src="${esc(optimizeImg(images[state.img], 1000))}" data-raw="${esc(images[state.img])}" alt="${esc(product.name)}" onerror="if(this.src!==this.dataset.raw){this.src=this.dataset.raw}">
        </div>
        ${images.length > 1 ? `<div class="gal-thumbs" id="galThumbs">
          ${images.map((src, i) => `<button class="${i === state.img ? "on" : ""}" data-i="${i}"><img src="${esc(optimizeImg(src, 150))}" data-raw="${esc(src)}" alt="" onerror="if(this.src!==this.dataset.raw){this.src=this.dataset.raw}"></button>`).join("")}
        </div>` : ""}
      </div>
      <div class="pdp-info">
        <div class="pdp-brand">${esc(product.brand || "AMEER OFFICIAL")}</div>
        <h1 class="pdp-title">${esc(product.name)}</h1>
        ${Array.isArray(product.quality) && product.quality.length
          ? `<div class="pdp-quality">${product.quality.map((q) => `<span class="q-badge">${esc(q)}</span>`).join("")}</div>`
          : ""}
        <div class="pdp-rating"><span class="stars">${stars(product.rating)}</span> ${(product.rating || 0).toFixed(1)} · ${reviewCount()} reviews</div>
        <div class="pdp-price">
          ${product.salePrice
            ? `<span class="now">${money(product.salePrice)}</span><span class="was">${money(product.price)}</span><span class="off">-${off}%</span>`
            : `<span class="now">${money(product.price)}</span>`}
        </div>
        <p class="pdp-desc">${esc(product.desc)}</p>

        ${product.colors && product.colors.length ? `
        <div class="pdp-opt">
          <div class="opt-label">Color <b id="colorLabel">${esc(state.color)}</b></div>
          <div class="p-swatches" id="colorPicks" style="gap:10px">
            ${product.colors.map(c => `<span data-c="${esc(c.name)}" style="background:${esc(c.hex)};width:30px;height:30px;cursor:pointer;${c.name === state.color ? "outline:2px solid var(--gold);outline-offset:2px" : ""}" title="${esc(c.name)}"></span>`).join("")}
          </div>
        </div>` : ""}

      ${product.sizes &&
product.sizes.length &&
!product.sizes.includes("Unstitched") ? `
        <div class="pdp-opt">
          <div class="opt-label">Size <b id="sizeLabel">${esc(state.size)}</b></div>
          <div class="p-swatches" id="sizePicks" style="gap:10px">
            ${product.sizes.map(s => `<button class="size-pick ${s === state.size ? "on" : ""}" data-s="${esc(s)}" style="min-width:44px;height:38px;border:1.5px solid var(--line-strong);border-radius:8px;background:${s === state.size ? "var(--ink)" : "transparent"};color:${s === state.size ? "#fff" : "var(--ink)"};cursor:pointer;font-size:.82rem">${esc(s)}</button>`).join("")}
          </div>
        </div>` : ""}

        <div class="stock-line ${stockClass}"><span class="stock-dot"></span>${stockText}</div>

        <div class="pdp-actions">
          <div class="qty-box">
            <button id="qtyMinus" aria-label="Decrease quantity">−</button>
            <span id="qtyVal">${state.qty}</span>
            <button id="qtyPlus" aria-label="Increase quantity">+</button>
          </div>
          <button class="btn btn-primary" id="addToCartBtn" ${product.stock <= 0 ? "disabled" : ""}>Add to bag</button>
        </div>

        <div class="pdp-secondary">
          <button id="wishBtn" class="${saved ? "on" : ""}">
            <svg viewBox="0 0 24 24"><path d="M12 20s-7-4.6-9.2-8.8C1.2 8 3 4.8 6.4 4.8c2 0 3.6 1.1 4.4 2.6h2.4c.8-1.5 2.4-2.6 4.4-2.6 3.4 0 5.2 3.2 3.6 6.4C19 15.4 12 20 12 20Z"/></svg>
            ${saved ? "Saved" : "Save"}
          </button>
        </div>

        <div class="pdp-perks">
          <div class="pdp-perk"><svg viewBox="0 0 24 24"><path d="M3 12l6 6L21 6"/></svg>Free shipping over Rs 10000</div>
          <div class="pdp-perk"><svg viewBox="0 0 24 24"><path d="M3 12l6 6L21 6"/></svg>Authenticity guaranteed</div>
        </div>

        <details class="acc" open>
          <summary>Details</summary>
          <div class="acc-body">${esc(product.desc)}</div>
        </details>
        <details class="acc">
          <summary>Specifications</summary>
          <div class="acc-body">
            <table class="spec-table">
              ${Object.entries(product.specs || {}).map(([k, v]) => `<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join("")}
            </table>
          </div>
        </details>
        <details class="acc">
          <summary>Shipping &amp; returns</summary>
          <div class="acc-body">Orders ship within 2–4 business days. See our Refund Policy for how returns and exchanges work.</div>
        </details>
      </div>
    </div>`;

  wirePDP(images);
}

function wirePDP(images) {
  // gallery thumbs
  document.querySelectorAll("#galThumbs button").forEach((btn) => {
    btn.onclick = () => {
      state.img = Number(btn.dataset.i);
      const mainImg = document.getElementById("galMainImg");
      mainImg.dataset.raw = images[state.img];
      mainImg.src = optimizeImg(images[state.img], 1000);
      document.querySelectorAll("#galThumbs button").forEach((b) => b.classList.remove("on"));
      btn.classList.add("on");
    };
  });
  // zoom
  const galMain = document.getElementById("galMain");
  if (galMain) galMain.onclick = () => galMain.classList.toggle("zoom");

  // color
  document.querySelectorAll("#colorPicks span").forEach((sw) => {
    sw.onclick = () => {
      state.color = sw.dataset.c;
      document.getElementById("colorLabel").textContent = state.color;
      document.querySelectorAll("#colorPicks span").forEach((s) => (s.style.outline = "none"));
      sw.style.outline = "2px solid var(--gold)";
      sw.style.outlineOffset = "2px";
    };
  });

  // size
  document.querySelectorAll(".size-pick").forEach((btn) => {
    btn.onclick = () => {
      state.size = btn.dataset.s;
      document.getElementById("sizeLabel").textContent = state.size;
      document.querySelectorAll(".size-pick").forEach((b) => {
        b.classList.remove("on");
        b.style.background = "transparent";
        b.style.color = "var(--ink)";
      });
      btn.classList.add("on");
      btn.style.background = "var(--ink)";
      btn.style.color = "#fff";
    };
  });

  // qty
  const qtyVal = document.getElementById("qtyVal");
  document.getElementById("qtyMinus").onclick = () => {
    state.qty = Math.max(1, state.qty - 1);
    qtyVal.textContent = state.qty;
  };
  document.getElementById("qtyPlus").onclick = () => {
    state.qty = Math.min(product.stock || 99, state.qty + 1);
    qtyVal.textContent = state.qty;
  };

  // add to cart
  document.getElementById("addToCartBtn").onclick = () => {
 addToCart(
  product,
  state.color || "Default",
  product.sizes && product.sizes.includes("Unstitched")
    ? ""
    : (state.size || "One Size"),
  state.qty
   );
  };

  // wishlist
  document.getElementById("wishBtn").onclick = () => {
    const wish = lsGet("lx-wish", []);
    const i = wish.indexOf(product.id);
    const btn = document.getElementById("wishBtn");
    if (i >= 0) {
      wish.splice(i, 1);
      btn.classList.remove("on");
      btn.innerHTML = btn.innerHTML.replace("Saved", "Save");
      toast("Removed from wishlist");
    } else {
      wish.push(product.id);
      btn.classList.add("on");
      btn.innerHTML = btn.innerHTML.replace("Save", "Saved");
      toast("Saved to wishlist ♥", "ok");
    }
    lsSet("lx-wish", wish);
  };
}

// ---------------- reviews ----------------
function getReviews() {
  const all = lsGet("lx-reviews", {});
  return all[product.id] || [];
}
function reviewCount() { return getReviews().length; }

function renderReviews() {
  const root = document.getElementById("reviewsRoot");
  const revs = getReviews();
  const avg = revs.length ? revs.reduce((s, r) => s + r.stars, 0) / revs.length : product.rating || 0;

  root.innerHTML = `
    <h2>Reviews</h2>
    <div class="rev-summary">
      <div class="rev-big">
        <div class="num">${avg.toFixed(1)}</div>
        <div class="stars">${stars(avg)}</div>
        <small>${revs.length} review${revs.length === 1 ? "" : "s"}</small>
      </div>
    </div>
    <div class="rev-list" id="revList">
      ${revs.length ? revs.map(reviewRow).join("") : `<p class="muted">No reviews yet — be the first to share your thoughts.</p>`}
    </div>
    <div class="rev-form">
      <h4>Write a review</h4>
      <div class="star-pick" id="starPick">${[1,2,3,4,5].map(n => `<span data-n="${n}">★</span>`).join("")}</div>
      <div class="field"><input type="text" id="revName" placeholder="Your name"></div>
      <div class="field"><textarea id="revText" placeholder="Share your experience with this product…" rows="3"></textarea></div>
      <button class="btn btn-primary" id="revSubmit">Submit review</button>
    </div>`;

  let picked = 5;
  document.querySelectorAll("#starPick span").forEach((s) => {
    s.onclick = () => {
      picked = Number(s.dataset.n);
      document.querySelectorAll("#starPick span").forEach((x) => x.classList.toggle("on", Number(x.dataset.n) <= picked));
    };
  });
  document.querySelectorAll("#starPick span").forEach((x) => x.classList.toggle("on", Number(x.dataset.n) <= picked));

  document.getElementById("revSubmit").onclick = () => {
    const name = document.getElementById("revName").value.trim() || "Guest";
    const text = document.getElementById("revText").value.trim();
    if (!text) { toast("Please add a few words about the product"); return; }
    const all = lsGet("lx-reviews", {});
    all[product.id] = all[product.id] || [];
    all[product.id].unshift({ name, text, stars: picked, date: new Date().toISOString() });
    lsSet("lx-reviews", all);
    toast("Thanks for your review ✦", "ok");
    renderReviews();
  };
}

function reviewRow(r) {
  return `<div class="rev">
    <div class="rev-head"><b>${esc(r.name)}</b><span class="rev-date">${new Date(r.date).toLocaleDateString()}</span></div>
    <div class="stars">${stars(r.stars)}</div>
    <p>${esc(r.text)}</p>
  </div>`;
}

// ---------------- related products ----------------
function renderRelated() {
  const root = document.getElementById("relatedRoot");
  const related = allProducts
    .filter((p) => p.id !== product.id && (p.category === product.category || p.sub === product.sub))
    .slice(0, 4);
  if (!related.length) { root.innerHTML = ""; return; }
  root.innerHTML = `
    <h2>You may also like</h2>
    <div class="p-grid" id="relatedGrid"></div>`;
  renderGrid("relatedGrid", related);
}

// ---------------- helpers ----------------
function stars(n) {
  const r = Math.round(n || 0);
  return "★★★★★☆☆☆☆☆".slice(5 - r, 10 - r);
}
function cap(s) { return String(s || "").charAt(0).toUpperCase() + String(s || "").slice(1); }

boot();
