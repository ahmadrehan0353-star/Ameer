// ============================================================
// AMEER OFFICIAL — navbar: injects shared header, wires search + counts
// ============================================================
import { lsGet, esc, debounce, placeholder, money, optimizeImg } from "./utils.js";
import { toggleTheme, initTheme } from "./utils.js";

const CATS = { women: "women.html", men: "men.html" };

export function renderNavbar(active = "") {
  initTheme();
  const mount = document.getElementById("navbar");
  if (!mount) return;
  // which chip is "on": the page's own section, refined by ?cat= / ?flag=
  const qs = new URLSearchParams(location.search);
  const cat = qs.get("cat") || "";
  const flag = (qs.get("flag") || "").toLowerCase();
  const on = (k) => {
    const is =
      k === "new" ? (flag === "new" || active === "new") :
      k === "sale" ? flag === "sale" :
      k === "Unstitched" || k === "Stitched" ? (active === "women" && cat === k) :
      (active === k && !cat && !flag);
    return is ? "active" : "";
  };
  mount.innerHTML = `
  <div class="topbar">Free shipping over Rs 10,000 · Members get early access</div>
  <header class="nav">
    <div class="wrap nav-inner">
      <button class="ic-btn nav-burger" aria-label="Menu" id="burger">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
      </button>
      <a class="nav-logo" href="index.html" aria-label="AMEER OFFICIAL — home">
        <span class="brandmark">
          <span class="brandmark-top">AMEER</span>
          <span class="brandmark-line"></span>
          <span class="brandmark-bottom">OFFICIAL</span>
        </span>
      </a>
      <div class="nav-search" role="search">
        <input type="search" id="navSearch" placeholder="Search suits, lawn, collections…" aria-label="Search AMEER OFFICIAL" autocomplete="off">
        <button class="ic-btn" id="navSearchBtn" aria-label="Search">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>
        </button>
        <div class="ac-panel" id="acPanel"></div>
      </div>
      <div class="nav-actions">
        <button class="ic-btn" id="themeBtn" aria-label="Toggle dark mode">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/></svg>
        </button>
        <a class="ic-btn" href="wishlist.html" aria-label="Wishlist">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.6-9.2-8.8C1.2 8 3 4.8 6.4 4.8c2.4 0 4.2 1.6 5.6 3.4 1.4-1.8 3.2-3.4 5.6-3.4 3.4 0 5.2 3.2 3.6 6.4C19 15.4 12 20 12 20Z"/></svg>
          <span class="ic-count" id="wishCount" style="display:none">0</span>
        </a>
        <a class="nav-account" href="profile.html" id="navAccount" aria-label="Account">
          <span class="ic-btn">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6"/></svg>
          </span>
          <span class="nav-account-text" id="navAccountText">Sign in / Sign up</span>
        </a>
        <a class="ic-btn ic-bag" href="cart.html" aria-label="Bag">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 8h12l-1 12H7L6 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>
          <span class="ic-count" id="cartCount" style="display:none">0</span>
        </a>
      </div>
    </div>
  </header>
  <nav class="wrap nav-menu" aria-label="Shop">
    <a href="women.html" class="${on("women")}">Women</a>
    <a href="men.html" class="${on("men")}">Men</a>
    <a href="women.html?cat=Unstitched" class="${on("Unstitched")}">Unstitched</a>
    <a href="women.html?cat=Stitched" class="${on("Stitched")}">Stitched</a>
    <a href="collection.html?flag=new" class="${on("new")}">New In</a>
    <a href="collection.html?flag=sale" class="chip-sale ${on("sale")}">Sale</a>
    <a href="track.html" class="${on("track")}">Track Order</a>
  </nav>
  <div class="m-drawer" id="mDrawer">
    <button class="m-close" id="mClose" aria-label="Close menu">×</button>
    <a href="women.html">Women</a>
    <a href="men.html">Men</a>
    <a href="collection.html?flag=new">New In</a>
    <a href="collection.html?flag=sale">Sale</a>
    <a href="track.html">Track Order</a>
    <a href="wishlist.html">Wishlist</a>
    <a href="profile.html">My Account</a>
  </div>`;

  // theme
  document.getElementById("themeBtn").onclick = toggleTheme;
  // burger
  const drawer = document.getElementById("mDrawer");
  document.getElementById("burger").onclick = () => drawer.classList.add("open");
  document.getElementById("mClose").onclick = () => drawer.classList.remove("open");
  // counts
  refreshCounts();
  // search
  wireSearch();
  // reflect auth state in the account link
  reflectAccount();
}

async function reflectAccount() {
  const txt = document.getElementById("navAccountText");
  if (!txt) return;
  try {
    const { currentUser } = await import("./auth.js");
    const u = await currentUser();
    if (u) {
      const first = (u.displayName || u.email || "Account").split(" ")[0].split("@")[0];
      txt.textContent = "Hi, " + first;
    } else {
      txt.textContent = "Sign in / Sign up";
    }
  } catch { /* leave default */ }
}

export function refreshCounts() {
  const cart = lsGet("lx-cart", []);
  const wish = lsGet("lx-wish", []);
  const cc = cart.reduce((s, l) => s + l.qty, 0);
  const cEl = document.getElementById("cartCount");
  const wEl = document.getElementById("wishCount");
  if (cEl) { cEl.textContent = cc; cEl.style.display = cc ? "grid" : "none"; }
  if (wEl) { wEl.textContent = wish.length; wEl.style.display = wish.length ? "grid" : "none"; }
}

function wireSearch() {
  const input = document.getElementById("navSearch");
  const panel = document.getElementById("acPanel");
  const go = (q) => { if (q && q.trim()) location.href = "women.html?q=" + encodeURIComponent(q.trim()); };
  document.getElementById("navSearchBtn").onclick = () => go(input.value);
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") go(input.value); });

  const run = debounce(async (q) => {
    q = q.trim().toLowerCase();
    if (q.length < 2) { panel.classList.remove("open"); return; }
    const items = await window.__lxSearch?.(q) || [];
    if (!items.length) {
      panel.innerHTML = `<div class="ac-empty">No matches for “${esc(q)}”</div>`;
    } else {
      panel.innerHTML = items.slice(0, 6).map((p) => `
        <a class="ac-item" href="product.html?id=${esc(p.id)}">
          <img src="${esc(optimizeImg(p.image || placeholder(p.id), 150))}" data-raw="${esc(p.image || "")}" alt="" loading="lazy">
          <div><b>${esc(p.name)}</b><br><small>${esc(p.category || "")} · ${money(p.price)}</small></div>
        </a>`).join("");
    }
    panel.classList.add("open");
  }, 200);

  input.addEventListener("input", (e) => run(e.target.value));
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".nav-search")) panel.classList.remove("open");
  });
}
