// ============================================================
// AMEER OFFICIAL — Adanslibas Lawnkari importer (one-off)
//
// Imports the 9 "Adanslibas Lawnkari 100% Original Outlet Stock"
// embroidered lawn 3-pc suits (2026) through the same
// adminSaveProduct path the product editor uses — Firestore when
// configured (live site + admin), local admin store otherwise.
// Fixed ids → pressing Import twice overwrites, never duplicates.
//
// All 9: Women → Unstitched, type Original, stock 10, Rs 8,000.
// Coupons left unset (allowed by default) — switch off per
// product in the editor if needed. Wholesale (5,150) is
// deliberately NOT published; only the selling price is.
//
// >>> TWO THINGS YOU CAN EASILY CHANGE <<<
// 1. PRICE: set to 8000 (your latest message). To use the 7,990
//    retail rate instead, change PRICE below to 7990. To show
//    7,990 struck through with 8,000 as the live price, set
//    PRICE = 8000 and REGULAR = 7990 — but note that only makes
//    sense if the higher number is the "before" price.
// 2. DESIGN COUNT: all 9 photos are imported as separate
//    products. If some are alternate shots of the same design,
//    delete the extra entries from ITEMS and add their slugs to
//    the `extra` array of the design they belong to — those
//    images then show in that product's gallery instead.
//
// IMAGE PATHS use a leading slash ("/assets/images/...") so the
// thumbnails resolve correctly from BOTH the storefront and the
// admin panel (which is served from /admin/).
//
// Throwaway page — delete admin/import-lawnkari.html and this
// file once the products are in.
// ============================================================
import { requireAdmin, renderAdminShell } from "./admin-guard.js";
import { adminSaveProduct } from "./admin-data.js";
import { esc, toast } from "./utils.js";

const BASE = "/assets/images/adanslibas-lawnkari/";
const PRICE = 8000;    // selling price shown on the site
const STOCK = 10;

const DESC =
  "Adanslibas Lawnkari 100% Original Outlet Stock — unstitched embroidered lawn 3-piece suit, 2026 collection.\n\n" +
  "SHIRT: Embroidered lawn shirt with embroidered sleeves\n" +
  "DUPATTA: Embroidered lawn voil dupatta\n" +
  "TROUSER: Dyed cotton trouser\n\n" +
  "Unstitched fabric — model photos show a styled sample for reference only.";

// [slug, colour name, swatch hex, extra gallery images]
const ITEMS = [
  ["slate-blue",          "Slate Blue",            "#4A5A78", []],
  ["emerald-teal",        "Emerald Teal",          "#1C7A6B", []],
  ["charcoal-grey",       "Charcoal Grey",         "#4B4B4B", []],
  ["cobalt-blue",         "Cobalt Blue",           "#1F5FBF", []],
  ["navy-floral-dupatta", "Navy Floral",           "#243258", []],
  ["midnight-blue",       "Midnight Blue",         "#1E2A4A", []],
  ["navy-pale-border",    "Navy with Pale Border", "#2A3A66", []],
  ["blue-white-floral",   "Blue & White Floral",   "#7FA8D4", []],
  ["steel-blue",          "Steel Blue",            "#41618C", []],
];

function buildProduct([slug, color, hex, extra]) {
  const main = BASE + slug + ".jpg";
  const gallery = [main, ...extra.map((s) => BASE + s + ".jpg")];
  return {
    id: "lawnkari-" + slug,          // fixed id → re-run overwrites
    name: `Adanslibas Lawnkari Unstitched 3-Pc — ${color}`,
    category: "women",
    sub: "Unstitched",
    brand: "Adanslibas",
    quality: ["Original"],
    price: PRICE,
    salePrice: null,
    stock: STOCK,
    rating: 4.7,
    desc: DESC,
    colors: [{ name: color, hex }],
    sizes: ["Unstitched"],           // unstitched fabric — no size picker
    images: gallery,
    image: main,
    featured: false,
    trending: false,
    bestseller: false,
    isNew: true,
    active: true,
    createdAt: new Date().toISOString(),
  };
}

(async function () {
  const user = await requireAdmin(); if (!user) return;
  const body = renderAdminShell("products", user);
  const money = (n) => "Rs " + n.toLocaleString("en-PK");

  body.innerHTML = `
    <style>
      .lk-wrap{max-width:960px}
      .lk-note{background:var(--surface);border-left:3px solid var(--gold);
               padding:12px 16px;border-radius:8px;margin:14px 0;line-height:1.6;font-size:.9rem}
      .lk-tiles{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:12px;margin-top:16px}
      .lk-tile{background:var(--surface);border:1px solid var(--line);border-radius:10px;overflow:hidden}
      .lk-tile img{width:100%;aspect-ratio:2/3;object-fit:cover;object-position:top;display:block;background:#eee}
      .lk-cap{padding:7px 9px;font-size:.78rem;line-height:1.35}
      .lk-st{display:block;font-weight:700;font-size:.72rem;margin-top:3px}
      .lk-bar{position:sticky;bottom:0;background:var(--bg);padding:14px 0;margin-top:20px;
              border-top:1px solid var(--line)}
    </style>
    <div class="lk-wrap">
      <h2>Import Adanslibas Lawnkari</h2>
      <div class="lk-note">
        Imports <b>${ITEMS.length} embroidered lawn 3-pc suits</b> —
        Women → <b>Unstitched</b>, type <b>Original</b>, stock <b>${STOCK}</b> each,
        <b>${money(PRICE)}</b>. Coupons left unset (allowed by default).
        Wholesale rate is not published. Safe to press twice: it updates the same
        products, never duplicates.
      </div>
      <div class="lk-tiles">
        ${ITEMS.map(([slug, color]) => `
          <div class="lk-tile">
            <img src="${BASE}${slug}.jpg" alt="${esc(color)}" loading="lazy">
            <div class="lk-cap">${esc(color)}
              <span class="lk-st muted" id="st-${slug}">Pending</span>
            </div>
          </div>`).join("")}
      </div>
      <div class="lk-bar">
        <button class="btn btn-primary" id="importBtn">Import all ${ITEMS.length} products</button>
        <span id="progress" class="muted" style="margin-left:12px;font-size:.85rem"></span>
        <p class="muted" style="font-size:.8rem;margin-top:10px">
          Once imported, they appear in Admin → Products and on the Women page under the
          Unstitched card. You can then delete this page (admin/import-lawnkari.html +
          js/admin-import-lawnkari.js) from the repo.
        </p>
      </div>
    </div>`;

  document.getElementById("importBtn").onclick = async () => {
    const btn = document.getElementById("importBtn");
    const prog = document.getElementById("progress");
    btn.disabled = true; btn.textContent = "Importing…";
    let ok = 0, fail = 0;

    for (const it of ITEMS) {
      const st = document.getElementById("st-" + it[0]);
      try {
        await adminSaveProduct(buildProduct(it));
        if (st) { st.textContent = "✓ Imported"; st.style.color = "var(--ok, #1f7a3f)"; }
        ok++;
      } catch (err) {
        console.error("Import failed for", it[0], err);
        if (st) { st.textContent = "✗ Failed"; st.style.color = "#b0453a"; }
        fail++;
      }
      prog.textContent = `${ok + fail} / ${ITEMS.length}`;
    }

    btn.disabled = false; btn.textContent = `Import all ${ITEMS.length} products`;
    toast(
      fail === 0 ? `All ${ok} products imported ✦` : `${ok} imported, ${fail} failed — check console`,
      fail === 0 ? "ok" : "err"
    );
  };
})();
