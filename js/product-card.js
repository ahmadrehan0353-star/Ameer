// ============================================================
// AMEER OFFICIAL — reusable product card + wishlist/quick-add wiring
// ============================================================
import { money, esc, lsGet, lsSet, placeholder, optimizeImg } from "./utils.js";
import { toast } from "./utils.js";
import { refreshCounts } from "./navbar.js";

export function productCard(p) {
  const wish = lsGet("lx-wish", []);
  const saved = wish.includes(p.id) ? "on" : "";
  const price = p.salePrice
    ? `<span class="price"><span class="was">${money(p.price)}</span><span class="now">${money(p.salePrice)}</span></span>`
    : `<span class="price">${money(p.price)}</span>`;
  const badges = [];
  if (p.salePrice) badges.push(`<span class="p-badge sale">Sale</span>`);
  if (p.isNew) badges.push(`<span class="p-badge new">New</span>`);
  const rawImg = p.image || placeholder(p.id);
  const rawAlt = (p.images && p.images[1]) || "";
  const hasAlt = rawAlt && rawAlt !== rawImg;
  const img = optimizeImg(rawImg, 500);
  // SPEED: the second (hover) photo used to download for every card on the
  // page. It is now fetched only when someone actually hovers that card.
  const altTag = hasAlt
    ? `<img class="alt" data-src="${esc(optimizeImg(rawAlt, 500))}" data-raw="${esc(rawAlt)}" alt="">`
    : "";
  return `<article class="p-card">
    <div class="p-frame ${hasAlt ? "has-alt" : ""}" onclick="location.href='product.html?id=${esc(p.id)}'">
      ${badges.length ? `<div class="p-badges">${badges.join("")}</div>` : ""}
      <img class="main" loading="lazy" decoding="async" width="500" height="625" src="${esc(img)}" data-raw="${esc(rawImg)}" alt="${esc(p.name)}">
      ${altTag}
      <button class="p-heart ${saved}" data-id="${esc(p.id)}" aria-label="Save to wishlist" onclick="event.stopPropagation()">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.6-9.2-8.8C1.2 8 3 4.8 6.4 4.8c2.4 0 4.2 1.6 5.6 3.4 1.4-1.8 3.2-3.4 5.6-3.4 3.4 0 5.2 3.2 3.6 6.4C19 15.4 12 20 12 20Z"/></svg>
      </button>
    </div>
    <div class="p-info">
      <span class="cat">${esc(p.sub || p.category)}</span>
      <a class="name" href="product.html?id=${esc(p.id)}">${esc(p.name)}</a>
      ${price}
      <div class="p-swatches">${(p.colors||[]).slice(0,4).map(c=>`<span style="background:${esc(c.hex)}" title="${esc(c.name)}"></span>`).join("")}</div>
    </div>
    <button class="p-quick" data-id="${esc(p.id)}">Add to bag</button>
  </article>`;
}

export function renderGrid(mountId, products) {
  const el = document.getElementById(mountId);
  if (!el) return;
  el.classList.add("stagger");
  el.innerHTML = products.map(productCard).join("");
  wireCards(el, products);
}

function wireCards(scope, products) {
  scope.querySelectorAll(".p-frame.has-alt").forEach((frame) => {
    frame.addEventListener("pointerenter", () => {
      const alt = frame.querySelector("img.alt[data-src]");
      if (alt) { alt.src = alt.dataset.src; alt.removeAttribute("data-src"); }
    }, { once: true });
  });
  scope.querySelectorAll(".p-heart").forEach((btn) => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const wish = lsGet("lx-wish", []);
      const i = wish.indexOf(id);
      if (i >= 0) { wish.splice(i, 1); btn.classList.remove("on"); toast("Removed from wishlist"); }
      else { wish.push(id); btn.classList.add("on"); toast("Saved to wishlist", "ok"); }
      lsSet("lx-wish", wish);
      refreshCounts();
    };
  });
  scope.querySelectorAll(".p-quick").forEach((btn) => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const p = products.find((x) => x.id === btn.dataset.id);
      if (!p) return;
      addToCart(p, p.colors[0]?.name || "Default", p.sizes[Math.floor(p.sizes.length/2)] || "M", 1);
    };
  });
}

export function addToCart(p, color, size, qty) {
  const cart = lsGet("lx-cart", []);
  const line = cart.find((l) => l.pid === p.id && l.color === color && l.size === size);
  if (line) line.qty += qty;
  else cart.push({ pid: p.id, color, size, qty });
  lsSet("lx-cart", cart);
  refreshCounts();
  toast("Added to bag", "ok");
}
