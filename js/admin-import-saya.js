// ============================================================
// AMEER OFFICIAL — SAYA Paste Kari Collection importer (one-off)
//
// Adds the 11 "SAYA 100% Original Embroidered Paste Printed Lawn"
// unstitched 3-pc suits (Volume 2026) through the same
// adminSaveProduct path the product editor uses — Firestore when
// configured (live site + admin), local admin store otherwise.
// Fixed ids → pressing Import twice overwrites, never duplicates.
//
// All 11 are: Women → Unstitched, type Original, stock 10,
// price shown as tag price with sale Rs 4,990, coupons allowed.
// Each product's gallery has the model photo + the official SAYA
// spec-sheet card. Photos live in assets/images/saya-pastekari/.
//
// Throwaway page — delete admin/import-saya.html and this file
// once the products are in.
// ============================================================
import { requireAdmin, renderAdminShell } from "./admin-guard.js";
import { adminSaveProduct } from "./admin-data.js";
import { esc, toast } from "./utils.js";

const IMG_BASE = "assets/images/saya-pastekari/";
const SALE = 4990;

// includes-text shared by the two fabric series
const PASTE_KARI = [
  "Premium paste printed lawn shirt — 1.75 m (wider length)",
  "Embroidered patti on organza — 1.50 m",
  "Premium paste printed lawn dupatta — 2.50 m",
  "Premium dyed cambric trouser — 1.80 m",
];
const ARABIC_LAWN = [
  "Premium printed embroidered Arabic lawn front — 1.15 (wider length)",
  "Premium printed Arabic lawn back — 1.15 (wider length)",
  "Premium printed embroidered Arabic lawn sleeves — 1.15 (wider length)",
  "Premium printed lawn dupatta — 2.50 m",
  "Premium printed cambric trouser — 1.10 m (wider width)",
];

const CARE =
  "CARE: Dry clean recommended. Do not use bleach or stain-removing chemicals. " +
  "Soak fabric in water before stitching. Wash coloured and white fabrics separately.";

// slug = image filename base; extra = series-specific embroidery lines
const ITEMS = [
  { id: "saya-26149-e04a", article: "U01-26149-E04A", sku: "WUNS-7690", color: "Ice Blue",     hex: "#C9D8E8", tag: 4999, slug: "u01-26149-e04a-ice-blue",
    inc: [PASTE_KARI[0], PASTE_KARI[1], "Embroidered border on organza — 1 pc", PASTE_KARI[2], PASTE_KARI[3]] },
  { id: "saya-26149-e06b", article: "U01-26149-E06B", sku: "WUNS-7695", color: "Peach",        hex: "#F6C9C0", tag: 4999, slug: "u01-26149-e06b-peach",
    inc: [PASTE_KARI[0], PASTE_KARI[1], "Embroidered border on organza — 1 pc", "Embroidered bunches on organza — 2 pcs", PASTE_KARI[2], PASTE_KARI[3]] },
  { id: "saya-26149-e02b", article: "U01-26149-E02B", sku: "WUNS-7687", color: "Light Yellow", hex: "#F2E8BE", tag: 4999, slug: "u01-26149-e02b-light-yellow",
    inc: [PASTE_KARI[0], PASTE_KARI[1], "Embroidered borders on organza — 2 pcs", PASTE_KARI[2], PASTE_KARI[3]] },
  { id: "saya-26149-e06a", article: "U01-26149-E06A", sku: "WUNS-7694", color: "Lilac",        hex: "#C5A8DC", tag: 4999, slug: "u01-26149-e06a-lilac",
    inc: [PASTE_KARI[0], PASTE_KARI[1], "Embroidered border on organza — 1 pc", "Embroidered bunches on organza — 2 pcs", PASTE_KARI[2], PASTE_KARI[3]] },
  { id: "saya-26156-e02a", article: "U01-26156-E02A", sku: "WUNS-7510", color: "Ivory",        hex: "#EFEAE0", tag: 5999, slug: "u01-26156-e02a-ivory",
    inc: ARABIC_LAWN },
  { id: "saya-26149-e03b", article: "U01-26149-E03B", sku: "WUNS-7689", color: "Ice Blue",     hex: "#D3E5E8", tag: 4999, slug: "u01-26149-e03b-ice-blue",
    inc: [PASTE_KARI[0], PASTE_KARI[1], "Embroidered border on organza — 1 pc", PASTE_KARI[2], PASTE_KARI[3]] },
  { id: "saya-26149-e03a", article: "U01-26149-E03A", sku: "WUNS-7688", color: "Pastel Pink",  hex: "#F6D3DE", tag: 4999, slug: "u01-26149-e03a-pastel-pink",
    inc: [PASTE_KARI[0], "Embroidered border on organza — 1 pc", PASTE_KARI[1], PASTE_KARI[2], PASTE_KARI[3]] },
  { id: "saya-26156-e08a", article: "U01-26156-E08A", sku: "WUNS-7555", color: "Ash Grey",     hex: "#D7DEE3", tag: 5999, slug: "u01-26156-e08a-ash-grey",
    inc: ARABIC_LAWN },
  { id: "saya-26149-e01a", article: "U01-26149-E01A", sku: "WUNS-7684", color: "Cream",        hex: "#EBDFC9", tag: 4999, slug: "u01-26149-e01a-cream",
    inc: [PASTE_KARI[0], PASTE_KARI[1], "Embroidered border on organza — 1 pc", PASTE_KARI[2], PASTE_KARI[3]] },
  { id: "saya-26149-e04b", article: "U01-26149-E04B", sku: "WUNS-7691", color: "Pastel Green", hex: "#E4EDDC", tag: 4999, slug: "u01-26149-e04b-pastel-green",
    inc: [PASTE_KARI[0], PASTE_KARI[1], "Embroidered border on organza — 1 pc", PASTE_KARI[2], PASTE_KARI[3]] },
  { id: "saya-26156-e03a", article: "U01-26156-E03A", sku: "WUNS-7512", color: "Pastel Pink",  hex: "#F3CFD3", tag: 5999, slug: "u01-26156-e03a-pastel-pink",
    inc: ARABIC_LAWN },
];

function buildProduct(it) {
  const series = it.article.includes("26156") ? "Arabic Lawn" : "Paste Kari";
  return {
    id: it.id,                        // fixed id → re-running overwrites, never duplicates
    name: `SAYA ${series} Unstitched 3-Pc — ${it.color} (${it.article})`,
    category: "women",
    sub: "Unstitched",
    brand: "SAYA",
    quality: ["Original"],
    price: it.tag,                    // official tag price…
    salePrice: SALE,                  // …selling at Rs 4,990
    stock: 10,
    rating: 4.7,
    desc:
      "SAYA 100% Original Embroidered Paste Printed Lawn — Unstitched 3-piece suit, Volume 2026.\n\n" +
      `Article: ${it.article} · ${it.sku}\n\nWHAT'S IN THE SUIT:\n` +
      it.inc.map((x) => "- " + x).join("\n") +
      "\n\n" + CARE,
    colors: [{ name: it.color, hex: it.hex }],
    sizes: ["Unstitched"],            // the site hides the size picker for unstitched
    images: [IMG_BASE + it.slug + ".jpg", IMG_BASE + it.slug + "-card.jpg"],
    image: IMG_BASE + it.slug + ".jpg",
    featured: false,
    trending: false,
    bestseller: false,
    isNew: true,                      // fresh volume — shows in New Arrivals
    noCoupon: false,                  // coupons allowed on these
    active: true,
    createdAt: new Date().toISOString(),
  };
}

(async function () {
  const user = await requireAdmin(); if (!user) return;
  const body = renderAdminShell("products", user);

  body.innerHTML = `
    <style>
      .si-wrap{max-width:960px}
      .si-note{background:var(--surface);border-left:3px solid var(--gold);
               padding:12px 16px;border-radius:8px;margin:14px 0;line-height:1.6;font-size:.9rem}
      .si-grid{display:flex;flex-direction:column;gap:10px;margin-top:16px}
      .si-row{display:flex;gap:14px;align-items:center;background:var(--surface);
              border:1px solid var(--line);border-radius:10px;padding:10px}
      .si-row img{width:56px;height:74px;object-fit:cover;object-position:top;border-radius:8px;flex-shrink:0}
      .si-row .si-meta{flex:1;font-size:.85rem}
      .si-row .si-meta b{display:block;font-size:.92rem}
      .si-tagline{display:flex;gap:8px;flex-wrap:wrap;margin-top:4px}
      .si-tag{font-size:.68rem;font-weight:700;letter-spacing:.05em;text-transform:uppercase;
              background:var(--bg);border:1px solid var(--line);border-radius:999px;padding:2px 9px}
      .si-status{font-size:.78rem;font-weight:700}
    </style>
    <div class="si-wrap">
      <h2>Import SAYA Paste Kari Collection</h2>
      <div class="si-note">
        Imports the <b>11 SAYA Original</b> unstitched 3-pc lawn suits below —
        Women → Unstitched, type <b>Original</b>, stock <b>10</b> each,
        selling at <b>Rs 4,990</b> (tag price shown struck through), coupons allowed.
        Each product's gallery includes the model photo <i>and</i> the official spec-sheet card.
        Safe to press twice: it updates the same 11 products, never duplicates.
      </div>
      <div class="si-grid">
        ${ITEMS.map((it) => `
          <div class="si-row">
            <img src="../${IMG_BASE}${esc(it.slug)}.jpg" alt="${esc(it.color)}">
            <div class="si-meta">
              <b>${esc(it.color)} — ${esc(it.article)}</b>
              <div class="si-tagline">
                <span class="si-tag">Women · Unstitched</span>
                <span class="si-tag">Original</span>
                <span class="si-tag">${esc(it.sku)}</span>
                <span class="si-tag">Stock 10</span>
                <span class="si-tag">Rs ${it.tag} → 4,990</span>
              </div>
            </div>
            <span class="si-status muted" id="st-${it.id}">Pending</span>
          </div>`).join("")}
      </div>
      <button class="btn btn-primary" id="importBtn" style="margin-top:18px">Import all 11 products</button>
      <p class="muted" style="font-size:.8rem;margin-top:10px">
        Once imported, they appear in Admin → Products and on the Women page under the
        Unstitched card. You can then delete this page (admin/import-saya.html +
        js/admin-import-saya.js) from the repo.
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
    btn.disabled = false; btn.textContent = "Import all 11 products";
    toast(ok === ITEMS.length ? "All 11 products imported ✦" : `${ok} of ${ITEMS.length} imported — check console`, ok === ITEMS.length ? "ok" : "err");
  };
})();
