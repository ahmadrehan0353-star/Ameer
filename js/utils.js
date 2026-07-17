// ============================================================
// AMEER OFFICIAL — shared utilities
// ============================================================
import { CLOUDINARY } from "../firebase/firebase-config.js";

// ---- money ----
export const money = (n) => "Rs " + Number(n || 0).toLocaleString("en-PK", { maximumFractionDigits: 0 });

// ---- input sanitising (prevents HTML/script injection in rendered strings) ----
export function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

// ---- validation ----
export const isEmail = (v) => /^\S+@\S+\.\S+$/.test(String(v || "").trim());
export const isNonEmpty = (v) => String(v || "").trim().length > 0;

// ---- localStorage helpers (cart & wishlist for guests) ----
export function lsGet(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}
export function lsSet(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

// ---- URL params ----
export const param = (k) => new URLSearchParams(location.search).get(k);

// ---- toast ----
let toastTimer;
export function toast(msg, kind = "") {
  let el = document.getElementById("lx-toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "lx-toast";
    el.className = "lx-toast";
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.className = "lx-toast show " + kind;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (el.className = "lx-toast"), 2600);
}

// ---- debounce (used by instant search) ----
export function debounce(fn, ms = 220) {
  let t;
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}

// ---- currency-safe cart math ----
export function cartTotals(lines, products) {
  let count = 0, subtotal = 0;
  for (const l of lines) {
    const p = products.find((x) => x.id === l.pid);
    if (!p) continue;
    count += l.qty;
    subtotal += (p.salePrice || p.price) * l.qty;
  }
  return { count, subtotal };
}

// ---- placeholder image (professional royalty-free, deterministic per key) ----
export function placeholder(seed, w = 600, h = 750) {
  const s = encodeURIComponent(seed || "luxora");
  return `https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=${w}&q=80`;
}

// ---- lazy image helper ----
export function lazyImg(src, alt = "") {
  return `<img loading="lazy" src="${esc(optimizeImg(src))}" alt="${esc(alt)}" onerror="this.src='https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=600&q=80'">`;
}

// ---- image optimization ----
// Product photos uploaded through the admin panel are stored on Cloudinary
// at their original size (a phone photo can be several MB). Cloudinary can
// resize + compress on the fly if we add transformation params to the URL —
// this works retroactively on every image already uploaded, no re-upload
// needed. Unsplash URLs get their width/format params corrected to what we
// actually need. Anything else (a pasted product-photo URL from elsewhere)
// gets routed through Cloudinary's "fetch" delivery so it still gets
// resized/compressed instead of shipped at full original size — this falls
// straight back to the original URL if fetch delivery isn't enabled on the
// Cloudinary account yet, since callers wire an <img onerror> fallback.
export function optimizeImg(url, width = 700) {
  if (!url || typeof url !== "string") return url;

  const marker = "/image/upload/";
  const i = url.indexOf(marker);
  if (url.includes("res.cloudinary.com") && i !== -1) {
    const already = url.slice(i + marker.length, i + marker.length + 20);
    if (/^(f_auto|q_auto|w_\d)/.test(already)) return url; // already transformed
    return url.slice(0, i + marker.length) + `f_auto,q_auto,w_${width}/` + url.slice(i + marker.length);
  }

  if (url.includes("images.unsplash.com")) {
    try {
      const u = new URL(url);
      u.searchParams.set("w", String(width));
      u.searchParams.set("auto", "format");
      if (!u.searchParams.get("q")) u.searchParams.set("q", "80");
      return u.toString();
    } catch { return url; }
  }

  const cloud = CLOUDINARY?.cloudName;
  if (/^https?:\/\//.test(url) && cloud && !String(cloud).startsWith("PASTE")) {
    return `https://res.cloudinary.com/${cloud}/image/fetch/f_auto,q_auto,w_${width}/${encodeURIComponent(url)}`;
  }

  return url;
}

// ---- theme (dark mode) ----
// White is the store's default look for every visitor, regardless of what
// their phone or browser is set to. Dark mode still exists — the moon icon
// in the navbar switches to it — but it's an explicit choice, not something
// that silently kicks in because someone's OS happens to be in dark mode.
export function initTheme() {
  const saved = lsGet("lx-theme", null);
  if (saved === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
  }
}
export function toggleTheme() {
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  if (isDark) { document.documentElement.removeAttribute("data-theme"); lsSet("lx-theme", "light"); }
  else { document.documentElement.setAttribute("data-theme", "dark"); lsSet("lx-theme", "dark"); }
}
