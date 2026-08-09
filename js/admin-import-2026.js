// ============================================================
// AMEER OFFICIAL — 2026 Collections importer (one-off)
//
// Imports 70 products across 8 collections through the same
// adminSaveProduct path the product editor uses — Firestore when
// configured (live site + admin), local admin store otherwise.
// Fixed ids → pressing Import twice overwrites, never duplicates.
//
// Every product: category Women, stock 10, quality Original.
// The noCoupon flag is deliberately NOT set, so coupons stay
// allowed by default and can be switched off per product later
// from the product editor.
//
// IMAGE PATHS use a leading slash ("/assets/images/...") on
// purpose. The admin panel is served from /admin/, so a relative
// path like "assets/images/x.jpg" would resolve to
// /admin/assets/images/x.jpg and show a broken thumbnail in
// Admin → Products. Root-relative paths resolve correctly from
// BOTH the storefront pages and the admin panel.
//
// Throwaway page — delete admin/import-2026.html and this file
// once the products are in.
// ============================================================
import { requireAdmin, renderAdminShell } from "./admin-guard.js";
import { adminSaveProduct } from "./admin-data.js";
import { esc, toast } from "./utils.js";

const BASE = "/assets/images/";
const STOCK = 10;

// ---- collection definitions -------------------------------------------
// sub: "Unstitched" | "Stitched"   sizes: [] means unstitched fabric
const COLLECTIONS = [
  {
    key: "narmin",
    label: "Narmin Lawn 3-Pcs 2026",
    brand: "Narmin",
    sub: "Unstitched",
    sizes: ["Unstitched"],
    price: 4290,
    salePrice: null,
    desc:
      "Narmin 100% Original Outlet Stock — unstitched lawn 3-piece suit, 2026 collection.\n\n" +
      "SHIRT: Digital printed lawn shirt — 3 M\n" +
      "DUPATTA: Digital printed lawn dupatta — 2.5 M\n" +
      "TROUSER: Dyed cambric trouser\n\n" +
      "Unstitched fabric — model photos show a styled sample for reference only.",
    items: [
      ["sage-stripe", "Sage Stripe", "#9BAE93"],
      ["rose-pink", "Rose Pink", "#E38FA0"],
      ["olive-green", "Olive Green", "#5E6B3B"],
      ["lilac", "Lilac", "#B49AD4"],
      ["blush-peach", "Blush Peach", "#F0C9B4"],
      ["mustard-navy", "Mustard & Navy", "#D9A227"],
      ["sage-mustard", "Sage & Mustard", "#A7AE84"],
      ["emerald-teal", "Emerald Teal", "#1F9E86"],
      ["navy-charcoal", "Navy Charcoal", "#2C3444"],
      ["mustard-yellow", "Mustard Yellow", "#DCB43C"],
      ["ivory-floral", "Ivory Floral", "#EFE7D6"],
      ["pink", "Pink", "#EFA8BC"],
      ["mint-green", "Mint Green", "#AEDCBB"],
      ["white-mint-floral", "White Mint Floral", "#E8F0E4"],
      ["lime-yellow", "Lime Yellow", "#DCD866"],
      ["sky-blue", "Sky Blue", "#8FB9DE"],
      ["deep-teal", "Deep Teal", "#20706E"],
      ["light-green", "Light Green", "#A9D69A"],
      ["ice-blue", "Ice Blue", "#BFD3DC"],
      ["pale-sage", "Pale Sage", "#CBD8BE"],
      ["aqua-blue", "Aqua Blue", "#7FC6DE"],
      ["apple-green", "Apple Green", "#96C464"],
      ["duck-egg-blue", "Duck Egg Blue", "#A9C4CB"],
      ["slate-navy", "Slate Navy", "#3B4A63"],
      ["jade-green", "Jade Green", "#2E8B62"],
      ["magenta-pink", "Magenta Pink", "#C24E86"],
      ["white-green", "White Green", "#EAF1E6"],
      ["charcoal-purple", "Charcoal Purple", "#4A4356"],
      ["teal-floral", "Teal Floral", "#1E7F80"],
      ["bottle-green", "Bottle Green", "#1E5E3C"],
      ["mint-sage", "Mint Sage", "#BCD6C2"],
      ["black", "Black", "#22201F"],
      ["pale-lemon", "Pale Lemon", "#EFE9B8"],
    ],
  },
  {
    key: "lakhany-lawn",
    label: "Lakhany Lawn 3-Pcs 2026",
    brand: "Lakhany",
    sub: "Unstitched",
    sizes: ["Unstitched"],
    price: 4000,
    salePrice: null,
    desc:
      "Lakhany 100% Original Outlet Stock — unstitched lawn 3-piece suit, 2026 collection.\n\n" +
      "SHIRT: Digital printed lawn / textured shirt\n" +
      "DUPATTA: Digital printed lawn / textured dupatta\n" +
      "TROUSER: Dyed cambric / textured trouser\n\n" +
      "Unstitched fabric — model photos show a styled sample for reference only.",
    items: [
      ["royal-blue-floral", "Royal Blue Floral", "#2E4E9B"],
      ["bottle-green", "Bottle Green", "#1D5245"],
      ["navy-blue", "Navy Blue", "#243A66"],
      ["black", "Black", "#232323"],
      ["navy-rust-dupatta", "Navy with Rust Dupatta", "#2B3C6B"],
      ["sky-blue", "Sky Blue", "#9CC7E0"],
      ["rust-brown", "Rust Brown", "#A84E2C"],
      ["black-green-dupatta", "Black with Green Dupatta", "#262A26"],
      ["sage-green", "Sage Green", "#9FBE8E"],
      ["emerald-green", "Emerald Green", "#1B7A55"],
      ["golden-yellow", "Golden Yellow", "#E0B341"],
      ["maroon", "Maroon", "#7C2233"],
      ["charcoal-grey", "Charcoal Grey", "#4A4E52"],
      ["mustard-yellow", "Mustard Yellow", "#DDB63F"],
    ],
  },
  {
    key: "lakhany-cottel",
    label: "Lakhany Stitched Winter Cottel 2-Pcs",
    brand: "Lakhany",
    sub: "Stitched",
    sizes: ["S", "L", "XL"],
    price: 4600,
    salePrice: null,
    desc:
      "Lakhany 100% Original Outlet Stock — stitched Cottel 2-piece winter suit.\n\n" +
      "SHIRT: Printed Cottel shirt\n" +
      "TROUSER: Printed Cottel trouser\n\n" +
      "Available in sizes S, L and XL. Ready to wear.",
    items: [
      ["teal-floral", "Teal Floral", "#1C6B79"],
      ["sage-green-floral", "Sage Green Floral", "#7FA98E"],
      ["black-floral", "Black Floral", "#1F1D1E"],
      ["lilac-floral", "Lilac Floral", "#C9AECB"],
    ],
  },
  {
    key: "ss-mahay-lawn",
    label: "Sana Safinaz Mahay Lawn 2-Pcs 2026",
    brand: "Sana Safinaz",
    sub: "Unstitched",
    sizes: ["Unstitched"],
    price: 3000,
    salePrice: null,
    desc:
      "Sana Safinaz Mahay 100% Original Outlet Stock — unstitched lawn 2-piece suit, 2026 collection.\n\n" +
      "SHIRT: Digital printed front on lawn — 1.15 M\n" +
      "Digital printed back on lawn — 1.15 M\n" +
      "Digital printed sleeves on lawn — 0.65 M\n" +
      "Embroidered border on organza — 1 M\n" +
      "DUPATTA: Digital printed dupatta on tennis net — 2.25 M\n\n" +
      "Unstitched fabric — model photos show a styled sample for reference only.",
    items: [
      ["sky-blue", "Sky Blue", "#67C4DE"],
      ["white-multi", "White Multi", "#F2F0EC"],
    ],
  },
  {
    key: "ss-mahay-winter",
    label: "Sana Safinaz Mahay Winter Linen/Slub 2-Pcs 2026",
    brand: "Sana Safinaz",
    sub: "Unstitched",
    sizes: ["Unstitched"],
    price: 4490,
    salePrice: null,
    desc:
      "Sana Safinaz Mahay 100% Original Outlet Stock — unstitched Linen/Slub 2-piece winter suit, 2026 collection.\n\n" +
      "SHIRT: Digital printed linen / slub shirt\n" +
      "DUPATTA: Digital printed linen / khaddar dupatta\n\n" +
      "Unstitched fabric — model photos show a styled sample for reference only.",
    items: [
      ["cream-paisley", "Cream Paisley", "#E8D9C0"],
      ["green-multi", "Green Multi", "#7FB68A"],
    ],
  },
  {
    key: "ss-stitched-linen",
    label: "Sana Safinaz Stitched Winter Linen 2-Pcs 2026",
    brand: "Sana Safinaz",
    sub: "Stitched",
    sizes: ["XS", "S", "M", "L"],
    price: 4000,
    salePrice: null,
    desc:
      "Sana Safinaz 100% Original Outlet Stock — stitched linen 2-piece winter suit, 2026 collection.\n\n" +
      "SHIRT: Digital printed linen shirt\n" +
      "DUPATTA / TROUSER: Digital printed linen dupatta / trouser\n\n" +
      "Available in sizes XS, S, M and L. Ready to wear.",
    items: [
      ["dusty-pink", "Dusty Pink", "#C08795"],
      ["white-rust-block", "White & Rust Block Print", "#E9DED2"],
      ["mint-floral", "Mint Floral", "#A8CEB0"],
      ["ivory-navy-dupatta", "Ivory with Navy Dupatta", "#EDE6D6"],
      ["cream-herringbone", "Cream Herringbone", "#E7E0CE"],
    ],
  },
  {
    key: "alkaram",
    label: "ALKARAM Winter Khaddar 2-Pcs",
    brand: "ALKARAM",
    sub: "Unstitched",
    sizes: ["Unstitched"],
    price: 3190,
    salePrice: null,
    desc:
      "ALKARAM 100% Original Outlet Stock — unstitched 2-piece digital printed khaddar winter suit.\n\n" +
      "SHIRT: Printed khaddar shirt — 1.75 M\n" +
      "TROUSER: Printed khaddar trouser — 1.5 M\n\n" +
      "Unstitched fabric — model photos show a styled sample for reference only.",
    items: [
      ["navy-blue", "Navy Blue", "#2A3358"],
      ["teal-geometric", "Teal Geometric", "#1F7F86"],
      ["royal-blue", "Royal Blue", "#25459B"],
      ["lime-stripe", "Lime Stripe", "#C6D64E"],
      ["maroon", "Maroon", "#7A2530"],
    ],
  },
  {
    key: "muzlin",
    label: "Sana Safinaz Muzlin Embroidered 3-Pcs 2026",
    brand: "Sana Safinaz",
    sub: "Unstitched",
    sizes: ["Unstitched"],
    price: 10000,     // regular price, shown struck through
    salePrice: 7000,  // 30% off
    desc:
      "Sana Safinaz Muzlin 100% Original Outlet Stock — unstitched linen embroidered 3-piece winter suit, 2026 collection.\n\n" +
      "SHIRT: Digital printed linen shirt with embroidered front and organza patti\n" +
      "DUPATTA: Digital printed khaddar dupatta\n" +
      "TROUSER: Dyed cotton trouser\n\n" +
      "Unstitched fabric — model photos show a styled sample for reference only.",
    items: [
      ["jade-green", "Jade Green", "#3AA383"],
      ["peach-pink", "Peach Pink", "#EDA894"],
      ["sage-green", "Sage Green", "#9CBE86"],
      ["ivory-cream", "Ivory Cream", "#EFE6D2"],
      ["champagne-beige", "Champagne Beige", "#E3D8BE"],
    ],
  },
];

// ---- build a flat product list ----------------------------------------
function buildAll() {
  const out = [];
  for (const c of COLLECTIONS) {
    for (const [slug, color, hex] of c.items) {
      const img = `${BASE}${c.key}/${slug}.jpg`;
      out.push({
        _collection: c.label,
        id: `${c.key}-${slug}`,          // fixed id → re-run overwrites
        name: `${c.brand} ${c.sub} — ${color}`,
        category: "women",
        sub: c.sub,
        brand: c.brand,
        quality: ["Original"],
        price: c.price,
        salePrice: c.salePrice,
        stock: STOCK,
        rating: 4.6,
        desc: c.desc,
        colors: [{ name: color, hex }],
        sizes: c.sizes,
        images: [img],
        image: img,
        featured: false,
        trending: false,
        bestseller: false,
        isNew: true,
        active: true,
        createdAt: new Date().toISOString(),
      });
    }
  }
  return out;
}

const ALL = buildAll();

// ---- page --------------------------------------------------------------
(async function () {
  const user = await requireAdmin(); if (!user) return;
  const body = renderAdminShell("products", user);

  const money = (n) => "Rs " + n.toLocaleString("en-PK");

  body.innerHTML = `
    <style>
      .im-wrap{max-width:1000px}
      .im-note{background:var(--surface);border-left:3px solid var(--gold);
               padding:12px 16px;border-radius:8px;margin:14px 0;line-height:1.6;font-size:.9rem}
      .im-coll{margin-top:22px}
      .im-coll h3{margin:0 0 4px;font-size:1.02rem}
      .im-coll .im-sub{color:var(--muted,#888);font-size:.8rem;margin:0 0 10px}
      .im-tiles{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:10px}
      .im-tile{background:var(--surface);border:1px solid var(--line);border-radius:10px;overflow:hidden}
      .im-tile img{width:100%;aspect-ratio:2/3;object-fit:cover;object-position:top;display:block;background:#eee}
      .im-tile .im-cap{padding:6px 8px;font-size:.74rem;line-height:1.3}
      .im-tile .im-st{display:block;font-weight:700;font-size:.7rem;margin-top:3px}
      .im-bar{position:sticky;bottom:0;background:var(--bg);padding:14px 0;margin-top:20px;
              border-top:1px solid var(--line)}
    </style>
    <div class="im-wrap">
      <h2>Import 2026 Collections</h2>
      <div class="im-note">
        Imports <b>${ALL.length} products</b> across <b>${COLLECTIONS.length} collections</b> —
        all under <b>Women</b>, type <b>Original</b>, stock <b>${STOCK}</b> each.
        Coupons are left unset (allowed by default) — switch them off per product in the
        product editor if you need to. Safe to press twice: it updates the same products, never duplicates.
      </div>

      ${COLLECTIONS.map((c) => `
        <div class="im-coll">
          <h3>${esc(c.label)}</h3>
          <p class="im-sub">
            ${c.items.length} designs · ${esc(c.sub)} ·
            ${c.sizes.length && c.sizes[0] !== "Unstitched" ? "Sizes " + c.sizes.join("/") + " · " : ""}
            ${c.salePrice ? `<s>${money(c.price)}</s> ${money(c.salePrice)} (30% off)` : money(c.price)}
          </p>
          <div class="im-tiles">
            ${c.items.map(([slug, color]) => `
              <div class="im-tile">
                <img src="${BASE}${c.key}/${slug}.jpg" alt="${esc(color)}" loading="lazy">
                <div class="im-cap">${esc(color)}
                  <span class="im-st muted" id="st-${c.key}-${slug}">Pending</span>
                </div>
              </div>`).join("")}
          </div>
        </div>`).join("")}

      <div class="im-bar">
        <button class="btn btn-primary" id="importBtn">Import all ${ALL.length} products</button>
        <span id="progress" class="muted" style="margin-left:12px;font-size:.85rem"></span>
        <p class="muted" style="font-size:.8rem;margin-top:10px">
          Once imported, they appear in Admin → Products and on the Women page under the
          Stitched / Unstitched cards. You can then delete this page
          (admin/import-2026.html + js/admin-import-2026.js) from the repo.
        </p>
      </div>
    </div>`;

  document.getElementById("importBtn").onclick = async () => {
    const btn = document.getElementById("importBtn");
    const prog = document.getElementById("progress");
    btn.disabled = true; btn.textContent = "Importing…";
    let ok = 0, fail = 0;

    for (const p of ALL) {
      const st = document.getElementById("st-" + p.id);
      const { _collection, ...doc } = p;      // strip the display-only field
      try {
        await adminSaveProduct(doc);
        if (st) { st.textContent = "✓ Imported"; st.style.color = "var(--ok, #1f7a3f)"; }
        ok++;
      } catch (err) {
        console.error("Import failed for", p.id, err);
        if (st) { st.textContent = "✗ Failed"; st.style.color = "#b0453a"; }
        fail++;
      }
      prog.textContent = `${ok + fail} / ${ALL.length}`;
    }

    btn.disabled = false; btn.textContent = `Import all ${ALL.length} products`;
    toast(
      fail === 0 ? `All ${ok} products imported ✦` : `${ok} imported, ${fail} failed — check console`,
      fail === 0 ? "ok" : "err"
    );
  };
})();
