// ============================================================
// AMEER OFFICIAL — Adanslibas Collection importer (one-off)
//
// Adds the 7 "Adanslibas 100% Original Outlet Stock" stitched
// 3-pc embroidered lawn suits (2026 collection) through the same
// adminSaveProduct path the product editor uses — Firestore when
// configured (live site + admin), local admin store otherwise.
// Fixed ids → pressing Import twice overwrites, never duplicates.
//
// All 7 are: Women → Unstitched, type Original, stock 10, Rs 6,500,
// coupons NOT allowed (noCoupon: true). Photos live in
// assets/images/adanslibas-stitched/ so they show everywhere the
// site runs.
//
// Throwaway page — delete admin/import-adanslibas.html and this
// file once the products are in.
// ============================================================
import { requireAdmin, renderAdminShell } from "./admin-guard.js";
import { adminSaveProduct } from "./admin-data.js";
import { esc, toast } from "./utils.js";

const IMG_BASE = "assets/images/adanslibas-stitched/";
const PRICE = 6500;

const COMMON_DESC =
  "Adanslibas 100% Original Outlet Stock — unstitched embroidered lawn 3-piece suit, 2026 collection.\n\n" +
  "SHIRT: Digital printed lawn shirt with embroidered neckline, embroidered border or embroidered sleeves\n" +
  "DUPATTA: Bamber chiffon dupatta\n" +
  "TROUSER: Printed cotton trouser\n\n" +
  "Unstitched fabric — model photos show a styled/stitched sample for reference only.";

const ITEMS = [
  { id: "adanslibas-mint-lace",     name: "Adanslibas Unstitched 3-Pc — Ice Mint Lace",     color: "Ice Mint",    hex: "#B9D6CE", slug: "adanslibas-mint-lace" },
  { id: "adanslibas-yellow-multi",  name: "Adanslibas Unstitched 3-Pc — Yellow Multi Floral",color: "Yellow Multi",hex: "#EDD98C", slug: "adanslibas-yellow-multi" },
  { id: "adanslibas-peach-vintage", name: "Adanslibas Unstitched 3-Pc — Peach Vintage Floral",color: "Peach",      hex: "#F1DCB8", slug: "adanslibas-peach-vintage" },
  { id: "adanslibas-white-stripe",  name: "Adanslibas Unstitched 3-Pc — White Floral, Black Stripe Dupatta", color: "White", hex: "#F3EFE9", slug: "adanslibas-white-stripe" },
  { id: "adanslibas-black-floral",  name: "Adanslibas Unstitched 3-Pc — Black Floral",      color: "Black",       hex: "#26241F", slug: "adanslibas-black-floral" },
  { id: "adanslibas-mauve-lilac",   name: "Adanslibas Unstitched 3-Pc — Mauve Lilac",       color: "Mauve Lilac", hex: "#C9A6C4", slug: "adanslibas-mauve-lilac" },
  { id: "adanslibas-teal-blue",     name: "Adanslibas Unstitched 3-Pc — Teal Blue",         color: "Teal Blue",   hex: "#1F6E7A", slug: "adanslibas-teal-blue" },
];

function buildProduct(it) {
  return {
    id: it.id,                       // fixed id → re-running overwrites, never duplicates
    name: it.name,
    category: "women",
    sub: "Unstitched",
    brand: "Adanslibas",
    quality: ["Original"],           // "type" filter on the site
    price: PRICE,
    salePrice: null,
    stock: 10,
    rating: 4.6,
    desc: COMMON_DESC,
    colors: [{ name: it.color, hex: it.hex }],
    sizes: ["Unstitched"],           // unstitched fabric — no size picker on the site
    images: [IMG_BASE + it.slug + ".jpg"],
    image: IMG_BASE + it.slug + ".jpg",
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
      .ai-wrap{max-width:900px}
      .ai-note{background:var(--surface);border-left:3px solid var(--gold);
               padding:12px 16px;border-radius:8px;margin:14px 0;line-height:1.6;font-size:.9rem}
      .ai-grid{display:flex;flex-direction:column;gap:10px;margin-top:16px}
      .ai-row{display:flex;gap:14px;align-items:center;background:var(--surface);
              border:1px solid var(--line);border-radius:10px;padding:10px}
      .ai-row img{width:56px;height:74px;object-fit:cover;object-position:top;border-radius:8px;flex-shrink:0}
      .ai-row .ai-meta{flex:1;font-size:.85rem}
      .ai-row .ai-meta b{display:block;font-size:.92rem}
      .ai-status{font-size:.78rem;font-weight:700}
      .ai-tagline{display:flex;gap:8px;flex-wrap:wrap;margin-top:4px}
      .ai-tag{font-size:.68rem;font-weight:700;letter-spacing:.05em;text-transform:uppercase;
              background:var(--bg);border:1px solid var(--line);border-radius:999px;padding:2px 9px}
    </style>
    <div class="ai-wrap">
      <h2>Import Adanslibas Collection</h2>
      <div class="ai-note">
        Imports the <b>7 Adanslibas Original Outlet</b> unstitched 3-pc lawn suits below —
        Women → Unstitched, type <b>Original</b>, stock <b>10</b> each,
        <b>Rs 6,500</b>, and <b>coupons disabled</b> on all of them.
        Safe to press twice: it updates the same 7 products, never duplicates.
      </div>
      <div class="ai-grid">
        ${ITEMS.map((it) => `
          <div class="ai-row" id="row-${it.id}">
            <img src="../${IMG_BASE}${esc(it.slug)}.jpg" alt="${esc(it.color)}">
            <div class="ai-meta">
              <b>${esc(it.name)}</b>
              <div class="ai-tagline">
                <span class="ai-tag">Women · Unstitched</span>
                <span class="ai-tag">Original</span>
                <span class="ai-tag">Stock 10</span>
                <span class="ai-tag">Rs 6,500</span>
                <span class="ai-tag" style="color:#b0453a;border-color:#b0453a">No coupons</span>
              </div>
            </div>
            <span class="ai-status muted" id="st-${it.id}">Pending</span>
          </div>`).join("")}
      </div>
      <button class="btn btn-primary" id="importBtn" style="margin-top:18px">Import all 7 products</button>
      <p class="muted" style="font-size:.8rem;margin-top:10px">
        Once imported, they appear in Admin → Products and on the Women page under the
        Unstitched card. You can then delete this page (admin/import-adanslibas.html +
        js/admin-import-adanslibas.js) from the repo.
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
    btn.disabled = false; btn.textContent = "Import all 7 products";
    toast(ok === ITEMS.length ? "All 7 products imported ✦" : `${ok} of ${ITEMS.length} imported — check console`, ok === ITEMS.length ? "ok" : "err");
  };
})();
