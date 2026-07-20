// ============================================================
// AMEER OFFICIAL — one-time importer: Sapphire Lawn Vol-13/14 + Elaya
// Prints "Ko Ko" Co-Ord Set (20 designs total)
//
// PRICE FLAG: Elaya's price (Rs 2500) is UNCONFIRMED — it was inferred by
// matching a WhatsApp caption's description to this catalogue's product
// type, not read directly off anything. Fix it below, or in
// /admin/products after import, before making those 10 active.
//
// Throwaway page — run once, check /admin/products, then delete this file
// and admin/import2.html.
// ============================================================
import { requireAdmin, renderAdminShell } from "./admin-guard.js";
import { adminSaveProduct, uploadImage, cloudinaryReady, listBrands, saveBrand } from "./admin-data.js";
import { esc, toast } from "./utils.js";

const CATALOGUE = [
  {
    slug: "sapphire-ws26cl13-124",
    name: "Sapphire Lawn — Teal (WS26CL13-124)",
    brand: "Sapphire",
    category: "women", sub: "Unstitched",
    price: 4990,
    color: { name: "Teal", hex: "#1f4d47" },
    photos: 1,
    desc: '3 Piece — Printed Lawn Suit.\n\n- Printed lawn shirt (3m)\n- Printed voile dupatta (2.5m)\n- Dyed cotton trouser (2.5m)\n\nActual product colour may vary slightly from the image.'
  },
  {
    slug: "sapphire-ws26cl13-125",
    name: "Sapphire Lawn — Mustard (WS26CL13-125)",
    brand: "Sapphire",
    category: "women", sub: "Unstitched",
    price: 4990,
    color: { name: "Mustard", hex: "#c8891f" },
    photos: 1,
    desc: '3 Piece — Printed Lawn Suit.\n\n- Printed lawn shirt (3m)\n- Printed voile dupatta (2.5m)\n- Dyed cotton trouser (2.5m)\n\nActual product colour may vary slightly from the image.'
  },
  {
    slug: "sapphire-ws26cl13-122",
    name: "Sapphire Lawn — Rust Brown (WS26CL13-122)",
    brand: "Sapphire",
    category: "women", sub: "Unstitched",
    price: 4990,
    color: { name: "Rust Brown", hex: "#5c2a1e" },
    photos: 1,
    desc: '3 Piece — Printed Lawn Suit.\n\n- Printed lawn shirt (3m)\n- Printed voile dupatta (2.5m)\n- Dyed cotton trouser (2.5m)\n\nActual product colour may vary slightly from the image.'
  },
  {
    slug: "sapphire-ws26cl14-134",
    name: "Sapphire Lawn — Taupe (WS26CL14-134)",
    brand: "Sapphire",
    category: "women", sub: "Unstitched",
    price: 4990,
    color: { name: "Taupe", hex: "#c9b8a8" },
    photos: 1,
    desc: '3 Piece — Printed Lawn Suit.\n\n- Printed lawn shirt (3m)\n- Printed voile dupatta (2.5m)\n- Dyed cotton trouser (2.5m)\n\nActual product colour may vary slightly from the image.'
  },
  {
    slug: "sapphire-ws26cl13-121",
    name: "Sapphire Lawn — Black (WS26CL13-121)",
    brand: "Sapphire",
    category: "women", sub: "Unstitched",
    price: 4990,
    color: { name: "Black", hex: "#1a1a1a" },
    photos: 1,
    desc: '3 Piece — Printed Lawn Suit.\n\n- Printed lawn shirt (3m)\n- Printed voile dupatta (2.5m)\n- Dyed cotton trouser (2.5m)\n\nActual product colour may vary slightly from the image.'
  },
  {
    slug: "sapphire-ws26cl13-126",
    name: "Sapphire Lawn — Sage Green (WS26CL13-126)",
    brand: "Sapphire",
    category: "women", sub: "Unstitched",
    price: 4990,
    color: { name: "Sage Green", hex: "#7fa89c" },
    photos: 1,
    desc: '3 Piece — Printed Lawn Suit.\n\n- Printed lawn shirt (3m)\n- Printed voile dupatta (2.5m)\n- Dyed cotton trouser (2.5m)\n\nActual product colour may vary slightly from the image.'
  },
  {
    slug: "sapphire-ws26cl13-127",
    name: "Sapphire Lawn — Mauve (WS26CL13-127)",
    brand: "Sapphire",
    category: "women", sub: "Unstitched",
    price: 4990,
    color: { name: "Mauve", hex: "#7a3b5e" },
    photos: 1,
    desc: '3 Piece — Printed Lawn Suit.\n\n- Printed lawn shirt (3m)\n- Printed voile dupatta (2.5m)\n- Dyed cotton trouser (2.5m)\n\nActual product colour may vary slightly from the image.'
  },
  {
    slug: "sapphire-ws26cl13-123",
    name: "Sapphire Lawn — Navy (WS26CL13-123)",
    brand: "Sapphire",
    category: "women", sub: "Unstitched",
    price: 4990,
    color: { name: "Navy", hex: "#1c2340" },
    photos: 1,
    desc: '3 Piece — Printed Lawn Suit.\n\n- Printed lawn shirt (3m)\n- Printed voile dupatta (2.5m)\n- Dyed cotton trouser (2.5m)\n\nActual product colour may vary slightly from the image.'
  },
  {
    slug: "sapphire-ws26cl13-130",
    name: "Sapphire Lawn — Ivory (WS26CL13-130)",
    brand: "Sapphire",
    category: "women", sub: "Unstitched",
    price: 4990,
    color: { name: "Ivory", hex: "#e8e2d5" },
    photos: 1,
    desc: '3 Piece — Printed Lawn Suit.\n\n- Printed lawn shirt (3m)\n- Printed voile dupatta (2.5m)\n- Dyed cotton trouser (2.5m)\n\nActual product colour may vary slightly from the image.'
  },
  {
    slug: "sapphire-ws26cl12-117",
    name: "Sapphire Lawn — Maroon (WS26CL12-117)",
    brand: "Sapphire",
    category: "women", sub: "Unstitched",
    price: 4990,
    color: { name: "Maroon", hex: "#5c1f30" },
    photos: 1,
    desc: '3 Piece — Printed Lawn Suit.\n\n- Printed lawn shirt (3m)\n- Printed voile dupatta (2.5m)\n- Dyed cotton trouser (2.5m)\n\nActual product colour may vary slightly from the image.'
  },
  {
    slug: "elaya-kk-2p-01",
    name: "Elaya Ko Ko Co-Ord Set — Sage Green (ELP-0026-2P-01)",
    brand: "Elaya Prints",
    category: "women", sub: "Unstitched",
    price: 2500,   // UNCONFIRMED — see chat
    color: { name: "Sage Green", hex: "#8ba888" },
    photos: 1,
    desc: "Ko Ko — Co-Ord Set, Drop 01: Luxury Co-Ord Sets.\n\nUnstitched shirt & trouser, premium digital printed.\n\nCare: no bleach or stain remover; wash colours and whites separately; don't dry cotton in direct sunlight; iron at moderate heat; soak fabric in lukewarm water for 2 hours before stitching; dry clean recommended."
  },
  {
    slug: "elaya-kk-2p-02",
    name: "Elaya Ko Ko Co-Ord Set — Yellow (ELP-0026-2P-02)",
    brand: "Elaya Prints",
    category: "women", sub: "Unstitched",
    price: 2500,   // UNCONFIRMED — see chat
    color: { name: "Yellow", hex: "#d9c23a" },
    photos: 1,
    desc: "Ko Ko — Co-Ord Set, Drop 01: Luxury Co-Ord Sets.\n\nUnstitched shirt & trouser, premium digital printed.\n\nCare: no bleach or stain remover; wash colours and whites separately; don't dry cotton in direct sunlight; iron at moderate heat; soak fabric in lukewarm water for 2 hours before stitching; dry clean recommended."
  },
  {
    slug: "elaya-kk-2p-03",
    name: "Elaya Ko Ko Co-Ord Set — Mint (ELP-0026-2P-03)",
    brand: "Elaya Prints",
    category: "women", sub: "Unstitched",
    price: 2500,   // UNCONFIRMED — see chat
    color: { name: "Mint", hex: "#b9d6cf" },
    photos: 1,
    desc: "Ko Ko — Co-Ord Set, Drop 01: Luxury Co-Ord Sets.\n\nUnstitched shirt & trouser, premium digital printed.\n\nCare: no bleach or stain remover; wash colours and whites separately; don't dry cotton in direct sunlight; iron at moderate heat; soak fabric in lukewarm water for 2 hours before stitching; dry clean recommended."
  },
  {
    slug: "elaya-kk-2p-04",
    name: "Elaya Ko Ko Co-Ord Set — Olive (ELP-0026-2P-04)",
    brand: "Elaya Prints",
    category: "women", sub: "Unstitched",
    price: 2500,   // UNCONFIRMED — see chat
    color: { name: "Olive", hex: "#cabf98" },
    photos: 1,
    desc: "Ko Ko — Co-Ord Set, Drop 01: Luxury Co-Ord Sets.\n\nUnstitched shirt & trouser, premium digital printed.\n\nCare: no bleach or stain remover; wash colours and whites separately; don't dry cotton in direct sunlight; iron at moderate heat; soak fabric in lukewarm water for 2 hours before stitching; dry clean recommended."
  },
  {
    slug: "elaya-kk-2p-05",
    name: "Elaya Ko Ko Co-Ord Set — Blush Pink (ELP-0026-2P-05)",
    brand: "Elaya Prints",
    category: "women", sub: "Unstitched",
    price: 2500,   // UNCONFIRMED — see chat
    color: { name: "Blush Pink", hex: "#d9a9a3" },
    photos: 1,
    desc: "Ko Ko — Co-Ord Set, Drop 01: Luxury Co-Ord Sets.\n\nUnstitched shirt & trouser, premium digital printed.\n\nCare: no bleach or stain remover; wash colours and whites separately; don't dry cotton in direct sunlight; iron at moderate heat; soak fabric in lukewarm water for 2 hours before stitching; dry clean recommended."
  },
  {
    slug: "elaya-kk-2p-06",
    name: "Elaya Ko Ko Co-Ord Set — Black (ELP-0026-2P-06)",
    brand: "Elaya Prints",
    category: "women", sub: "Unstitched",
    price: 2500,   // UNCONFIRMED — see chat
    color: { name: "Black", hex: "#1a1a1a" },
    photos: 1,
    desc: "Ko Ko — Co-Ord Set, Drop 01: Luxury Co-Ord Sets.\n\nUnstitched shirt & trouser, premium digital printed.\n\nCare: no bleach or stain remover; wash colours and whites separately; don't dry cotton in direct sunlight; iron at moderate heat; soak fabric in lukewarm water for 2 hours before stitching; dry clean recommended."
  },
  {
    slug: "elaya-kk-2p-07",
    name: "Elaya Ko Ko Co-Ord Set — Mint (ELP-0026-2P-07)",
    brand: "Elaya Prints",
    category: "women", sub: "Unstitched",
    price: 2500,   // UNCONFIRMED — see chat
    color: { name: "Mint", hex: "#bcd6cb" },
    photos: 1,
    desc: "Ko Ko — Co-Ord Set, Drop 01: Luxury Co-Ord Sets.\n\nUnstitched shirt & trouser, premium digital printed.\n\nCare: no bleach or stain remover; wash colours and whites separately; don't dry cotton in direct sunlight; iron at moderate heat; soak fabric in lukewarm water for 2 hours before stitching; dry clean recommended."
  },
  {
    slug: "elaya-kk-2p-08",
    name: "Elaya Ko Ko Co-Ord Set — Navy (ELP-0026-2P-08)",
    brand: "Elaya Prints",
    category: "women", sub: "Unstitched",
    price: 2500,   // UNCONFIRMED — see chat
    color: { name: "Navy", hex: "#232c47" },
    photos: 1,
    desc: "Ko Ko — Co-Ord Set, Drop 01: Luxury Co-Ord Sets.\n\nUnstitched shirt & trouser, premium digital printed.\n\nCare: no bleach or stain remover; wash colours and whites separately; don't dry cotton in direct sunlight; iron at moderate heat; soak fabric in lukewarm water for 2 hours before stitching; dry clean recommended."
  },
  {
    slug: "elaya-kk-2p-09",
    name: "Elaya Ko Ko Co-Ord Set — Beige (ELP-0026-2P-09)",
    brand: "Elaya Prints",
    category: "women", sub: "Unstitched",
    price: 2500,   // UNCONFIRMED — see chat
    color: { name: "Beige", hex: "#d9c9a8" },
    photos: 1,
    desc: "Ko Ko — Co-Ord Set, Drop 01: Luxury Co-Ord Sets.\n\nUnstitched shirt & trouser, premium digital printed.\n\nCare: no bleach or stain remover; wash colours and whites separately; don't dry cotton in direct sunlight; iron at moderate heat; soak fabric in lukewarm water for 2 hours before stitching; dry clean recommended."
  },
  {
    slug: "elaya-kk-2p-10",
    name: "Elaya Ko Ko Co-Ord Set — Mustard (ELP-0026-2P-10)",
    brand: "Elaya Prints",
    category: "women", sub: "Unstitched",
    price: 2500,   // UNCONFIRMED — see chat
    color: { name: "Mustard", hex: "#c99a3a" },
    photos: 1,
    desc: "Ko Ko — Co-Ord Set, Drop 01: Luxury Co-Ord Sets.\n\nUnstitched shirt & trouser, premium digital printed.\n\nCare: no bleach or stain remover; wash colours and whites separately; don't dry cotton in direct sunlight; iron at moderate heat; soak fabric in lukewarm water for 2 hours before stitching; dry clean recommended."
  },
];

const log = (msg, kind = "") => {
  const el = document.getElementById("imLog");
  const line = document.createElement("div");
  line.className = "im-line " + kind;
  line.textContent = msg;
  el.appendChild(line);
  el.scrollTop = el.scrollHeight;
};

function slugOf(filename) {
  return filename.replace(/\.[^.]+$/, "").replace(/-\d+$/, "");
}
function saveErrorText(e, what) {
  const code = e?.code || "";
  if (code.includes("permission-denied")) return `Not allowed to save that ${what} — is your admin email verified?`;
  if (code.includes("unavailable") || code.includes("network")) return "Couldn't reach the database — check your connection.";
  return e?.message || `Couldn't save that ${what}.`;
}

(async function () {
  const user = await requireAdmin(); if (!user) return;
  const body = renderAdminShell("products", user);

  body.innerHTML = `
    <style>
      .im-wrap{max-width:760px}
      .im-log{background:var(--surface);border:1px solid var(--line);border-radius:10px;
              padding:14px;height:340px;overflow:auto;font-family:ui-monospace,monospace;
              font-size:.82rem;line-height:1.7;margin-top:18px}
      .im-line.ok{color:#2e7d32}.im-line.err{color:#c62828}.im-line.warn{color:#e07b00}
      .im-line.head{font-weight:700;margin-top:8px}
      .im-note{background:var(--surface);border-left:3px solid var(--gold);
               padding:12px 16px;border-radius:8px;margin:14px 0;line-height:1.6;font-size:.9rem}
    </style>
    <div class="im-wrap">
      <h1>Import: Sapphire + Elaya Ko Ko</h1>
      <p class="muted">20 products, 20 photos (one each). Safe to run more than once —
         each product has a fixed id, so a second run updates rather than duplicates.</p>

      <div class="im-note">
        <b>⚠ Elaya's price (Rs 2500) is unconfirmed</b> — see the chat for why. The 10
        Sapphire products (Rs 4,990) are confirmed and safe.
      </div>
      <div class="im-note">
        Select all 20 photos from the folder you were given — filenames map each photo
        to its product, so don't rename them.
      </div>

      <input type="file" id="imFiles" multiple accept="image/*">
      <p id="imCount" class="muted" style="margin-top:8px">No files chosen.</p>
      <button class="btn btn-primary" id="imRun" disabled style="margin-top:12px">Import 20 products</button>
      <div class="im-log" id="imLog"></div>
    </div>`;

  let files = [];
  document.getElementById("imFiles").onchange = (e) => {
    files = [...e.target.files];
    document.getElementById("imCount").textContent = `${files.length} file${files.length===1?"":"s"} chosen.`;
    document.getElementById("imRun").disabled = files.length === 0;
  };

  document.getElementById("imRun").onclick = async () => {
    const btn = document.getElementById("imRun");
    btn.disabled = true; btn.textContent = "Importing…";
    document.getElementById("imLog").innerHTML = "";

    if (!(await cloudinaryReady())) {
      log("Cloudinary isn't configured — stopping (would corrupt Firestore docs).", "err");
      btn.disabled = false; btn.textContent = "Import 20 products";
      return;
    }

    const bySlug = {};
    for (const f of files) (bySlug[slugOf(f.name)] = bySlug[slugOf(f.name)] || []).push(f);

    let brands = await listBrands();
    for (const p of CATALOGUE) {
      if (!brands.some((b) => (b.name||"").toLowerCase() === p.brand.toLowerCase())) {
        try { await saveBrand({ name: p.brand, order: brands.length + 1 }); brands = await listBrands(); log(`brand added: ${p.brand}`, "ok"); }
        catch (e) { log(`brand "${p.brand}" failed: ${e.code || e.message}`, "err"); }
      }
    }

    let done = 0, failed = 0;
    for (const p of CATALOGUE) {
      log(p.name, "head");
      const chosen = bySlug[p.slug] || [];
      if (chosen.length !== p.photos) log(`  expected ${p.photos}, found ${chosen.length}`, chosen.length ? "warn" : "err");

      const urls = [];
      for (const f of chosen) {
        try {
          const url = await uploadImage(f);
          if (!/^https:\/\//.test(url)) throw new Error("upload fell back to a local preview");
          urls.push(url); log(`  uploaded ${f.name}`, "ok");
        } catch (e) { log(`  ${f.name}: ${e.message}`, "err"); }
      }
      if (!urls.length) { log("  no photo — skipping", "err"); failed++; continue; }

      try {
        await adminSaveProduct({
          id: "cat2-" + p.slug,
          name: p.name, category: p.category, sub: p.sub, brand: p.brand,
          quality: [], price: p.price, salePrice: null, stock: 0, rating: 4.6,
          desc: p.desc, colors: [p.color], sizes: [],
          images: urls, image: urls[0],
          featured: false, trending: false, bestseller: false, isNew: true,
          active: false
        });
        log(`  saved`, "ok"); done++;
      } catch (e) {
        log(`  save failed: ${saveErrorText(e, "product")}`, "err"); failed++;
      }
    }
    log("");
    log(`Done. ${done} imported, ${failed} failed.`, failed ? "warn" : "ok");
    log("All saved INACTIVE, stock 0. Fix Elaya's price before activating those 10.", "");
    toast(`${done} product(s) imported`, failed ? "err" : "ok");
    btn.textContent = "Run again"; btn.disabled = false;
  };
})();
