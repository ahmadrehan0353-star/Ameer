// ============================================================
// AMEER OFFICIAL — Gullal Stitched Collection importer (one-off)
//
// Adds the 5 "Gullal 100% Original Outlet Stock" stitched 2-pc
// lawn suits through the same adminSaveProduct path the product
// editor uses — so they land in Firestore when it's configured
// (visible on the live site + admin) or in the local admin store
// otherwise. Each product has a FIXED id, so pressing Import
// twice just overwrites the same 5 products — it never duplicates.
//
// All 5 are: Women → Stitched, type Original, sizes S/M/L/XL,
// stock 10, Rs 4,000, coupons NOT allowed (noCoupon: true).
// Photos live in the repo at assets/images/gullal-stitched/ so
// they show everywhere the site runs.
//
// Throwaway page — delete admin/import-gullal.html and this file
// once the products are in.
// ============================================================
import { requireAdmin, renderAdminShell } from "./admin-guard.js";
import { adminSaveProduct } from "./admin-data.js";
import { esc, toast } from "./utils.js";

const IMG_BASE = "assets/images/gullal-stitched/";

const COMMON_DESC =
  "Gullal 100% Original Outlet Stock — stitched 2-piece lawn suit.\n\n" +
  "SHIRT: Printed lawn shirt\n" +
  "TROUSER: Printed cambric trouser\n\n" +
  "Available in sizes S, M, L and XL. Ready to wear.";

const ITEMS = [
  { id: "gullal-st-yellow",   name: "Gullal Stitched 2-Pc Lawn Suit — Yellow Floral",   color: "Yellow",      hex: "#E8C84C", img: "gullal-yellow.jpg" },
  { id: "gullal-st-magenta",  name: "Gullal Stitched 2-Pc Lawn Suit — Magenta",         color: "Magenta",     hex: "#B0175C", img: "gullal-magenta.jpg" },
  { id: "gullal-st-teal",     name: "Gullal Stitched 2-Pc Lawn Suit — Teal Green",      color: "Teal Green",  hex: "#2E6B5E", img: "gullal-teal.jpg" },
  { id: "gullal-st-paisley",  name: "Gullal Stitched 2-Pc Lawn Suit — Charcoal Paisley",color: "Charcoal",    hex: "#4A4A48", img: "gullal-charcoal-paisley.jpg" },
  { id: "gullal-st-blue",     name: "Gullal Stitched 2-Pc Lawn Suit — Royal Blue",      color: "Royal Blue",  hex: "#3B57B5", img: "gullal-royal-blue.jpg" },
];

function buildProduct(it) {
  return {
    id: it.id,                       // fixed id → re-running overwrites, never duplicates
    name: it.name,
    category: "women",
    sub: "Stitched",
    brand: "Gullal",
    quality: ["Original"],           // "type" filter on the site
    price: 4000,                     // outlet retail
    salePrice: null,
    stock: 10,
    rating: 4.6,
    desc: COMMON_DESC,
    colors: [{ name: it.color, hex: it.hex }],
    sizes: ["S", "M", "L", "XL"],
    images: [IMG_BASE + it.img],
    image: IMG_BASE + it.img,
    featured: false,
    trending: false,
    bestseller: false,
    isNew: true,                     // fresh stock — shows in New Arrivals
    noCoupon: true,                  // coupons cannot be used on these
    active: true,
    createdAt: new Date().toISOString(),
  };
}

(async function () {
  const user = await requireAdmin(); if (!user) return;
  const body = renderAdminShell("products", user);

  body.innerHTML = `
    <style>
      .gi-wrap{max-width:900px}
      .gi-note{background:var(--surface);border-left:3px solid var(--gold);
               padding:12px 16px;border-radius:8px;margin:14px 0;line-height:1.6;font-size:.9rem}
      .gi-grid{display:flex;flex-direction:column;gap:10px;margin-top:16px}
      .gi-row{display:flex;gap:14px;align-items:center;background:var(--surface);
              border:1px solid var(--line);border-radius:10px;padding:10px}
      .gi-row img{width:56px;height:74px;object-fit:cover;border-radius:8px;flex-shrink:0}
      .gi-row .gi-meta{flex:1;font-size:.85rem}
      .gi-row .gi-meta b{display:block;font-size:.92rem}
      .gi-row .gi-status{font-size:.78rem;font-weight:700}
      .gi-tagline{display:flex;gap:8px;flex-wrap:wrap;margin-top:4px}
      .gi-tag{font-size:.68rem;font-weight:700;letter-spacing:.05em;text-transform:uppercase;
              background:var(--bg);border:1px solid var(--line);border-radius:999px;padding:2px 9px}
    </style>
    <div class="gi-wrap">
      <h2>Import Gullal Stitched Collection</h2>
      <div class="gi-note">
        Imports the <b>5 Gullal Original Outlet</b> stitched 2-pc lawn suits below —
        Women → Stitched, type <b>Original</b>, sizes <b>S/M/L/XL</b>, stock <b>10</b> each,
        <b>Rs 4,000</b>, and <b>coupons disabled</b> on all of them.
        Safe to press twice: it updates the same 5 products, never duplicates.
      </div>
      <div class="gi-grid">
        ${ITEMS.map((it) => `
          <div class="gi-row" id="row-${it.id}">
            <img src="../${IMG_BASE}${esc(it.img)}" alt="${esc(it.color)}">
            <div class="gi-meta">
              <b>${esc(it.name)}</b>
              <div class="gi-tagline">
                <span class="gi-tag">Women · Stitched</span>
                <span class="gi-tag">Original</span>
                <span class="gi-tag">S–XL</span>
                <span class="gi-tag">Stock 10</span>
                <span class="gi-tag">Rs 4,000</span>
                <span class="gi-tag" style="color:#b0453a;border-color:#b0453a">No coupons</span>
              </div>
            </div>
            <span class="gi-status muted" id="st-${it.id}">Pending</span>
          </div>`).join("")}
      </div>
      <button class="btn btn-primary" id="importBtn" style="margin-top:18px">Import all 5 products</button>
      <p class="muted" style="font-size:.8rem;margin-top:10px">
        Once imported, they appear in Admin → Products and on the Women page under the
        Stitched card. You can then delete this page (admin/import-gullal.html +
        js/admin-import-gullal.js) from the repo.
      </p>
    </div>`;

  document.getElementById("importBtn").onclick = async () => {
    const btn = document.getElementById("importBtn");
    btn.disabled = true; btn.textContent = "Importing…";
    let ok = 0;
    for (const it of ITEMS) {
      const st = document.getElementById("st-" + it.id);
      try {
        await adminSaveProduct(buildProduct(it));
        st.textContent = "✓ Imported"; st.style.color = "var(--ok, #1f7a3f)";
        ok++;
      } catch (err) {
        console.error("Import failed for", it.id, err);
        st.textContent = "✗ Failed"; st.style.color = "#b0453a";
      }
    }
    btn.disabled = false; btn.textContent = "Import all 5 products";
    toast(ok === ITEMS.length ? "All 5 products imported ✦" : `${ok} of ${ITEMS.length} imported — check console`, ok === ITEMS.length ? "ok" : "err");
  };
})();
