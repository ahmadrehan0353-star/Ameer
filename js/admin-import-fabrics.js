// ============================================================
// AMEER OFFICIAL — fabric catalogue importer (Markhor / Glorious)
//
// Adds the 36 unstitched fabric pieces from the supplier WhatsApp
// catalogue to Firestore, uploading their photos to Cloudinary on the
// way. This is a throwaway page: run it once, check /admin/products,
// then delete this file and admin/import-fabrics.html from the repo.
//
// Nothing here is reachable from the sidebar — open it directly at
// /admin/import-fabrics.html. It never runs on its own.
//
// Photo matching: one photo per product, matched by filename — every
// photo must be named exactly "<slug>.jpg" (see the slug field below).
// The photos that shipped with this catalogue are already named this
// way (see /catalogue-photos in the delivery package); just select all
// 36 of them when the file picker opens. Some colours repeat across two
// photo batches (slightly different dye lots), so their slugs end in
// "-2" — that's expected, not a bug.
//
// A couple of products were numbered by eye from the supplier's photo
// set rather than confirmed one-by-one against the original WhatsApp
// order, so double check each photo lines up with its listed colour
// during review — every product is saved INACTIVE until you do.
// ============================================================
import { requireAdmin, renderAdminShell } from "./admin-guard.js";
import { adminSaveProduct, uploadImage, cloudinaryReady, listBrands, saveBrand } from "./admin-data.js";
import { esc, toast } from "./utils.js";

const CATALOGUE = [
  {
    slug: "glorious-brilliant-black",
    name: "Glorious (Brilliant) Black — Egyptian Cotton Unstitched",
    brand: "Glorious (Brilliant)",
    color: "Black",
    hex: "#1B1B1B",
    fabric: "Egyptian Cotton",
    price: 6500,
    desc: "Egyptian Cotton unstitched shalwar kameez fabric in Black.\n\n- 4.5 metre: Rs. 6500\n- 5.5 metre: Rs. 8000\n\nColour shown: Black (swatch #1B1B1B).",
  },
  {
    slug: "glorious-brilliant-navy-blue",
    name: "Glorious (Brilliant) Navy Blue — Egyptian Cotton Unstitched",
    brand: "Glorious (Brilliant)",
    color: "Navy Blue",
    hex: "#1E4E8C",
    fabric: "Egyptian Cotton",
    price: 6500,
    desc: "Egyptian Cotton unstitched shalwar kameez fabric in Navy Blue.\n\n- 4.5 metre: Rs. 6500\n- 5.5 metre: Rs. 8000\n\nColour shown: Navy Blue (swatch #1E4E8C).",
  },
  {
    slug: "glorious-brilliant-sky-blue",
    name: "Glorious (Brilliant) Sky Blue — Egyptian Cotton Unstitched",
    brand: "Glorious (Brilliant)",
    color: "Sky Blue",
    hex: "#6FA9E8",
    fabric: "Egyptian Cotton",
    price: 6500,
    desc: "Egyptian Cotton unstitched shalwar kameez fabric in Sky Blue.\n\n- 4.5 metre: Rs. 6500\n- 5.5 metre: Rs. 8000\n\nColour shown: Sky Blue (swatch #6FA9E8).",
  },
  {
    slug: "glorious-lord-olive-green",
    name: "Glorious (Lord) Olive Green — Egyptian Cotton Unstitched",
    brand: "Glorious (Lord)",
    color: "Olive Green",
    hex: "#7A8468",
    fabric: "Egyptian Cotton",
    price: 6500,
    desc: "Egyptian Cotton unstitched shalwar kameez fabric in Olive Green.\n\n- 4.5 metre: Rs. 6500\n- 5.5 metre: Rs. 8000\n\nColour shown: Olive Green (swatch #7A8468).",
  },
  {
    slug: "glorious-lord-pure-white",
    name: "Glorious (Lord) Pure White — Egyptian Cotton Unstitched",
    brand: "Glorious (Lord)",
    color: "Pure White",
    hex: "#F6F6F4",
    fabric: "Egyptian Cotton",
    price: 6500,
    desc: "Egyptian Cotton unstitched shalwar kameez fabric in Pure White.\n\n- 4.5 metre: Rs. 6500\n- 5.5 metre: Rs. 8000\n\nColour shown: Pure White (swatch #F6F6F4).",
  },
  {
    slug: "glorious-lord-skin",
    name: "Glorious (Lord) Skin — Egyptian Cotton Unstitched",
    brand: "Glorious (Lord)",
    color: "Skin",
    hex: "#D8C1A3",
    fabric: "Egyptian Cotton",
    price: 6500,
    desc: "Egyptian Cotton unstitched shalwar kameez fabric in Skin.\n\n- 4.5 metre: Rs. 6500\n- 5.5 metre: Rs. 8000\n\nColour shown: Skin (swatch #D8C1A3).",
  },
  {
    slug: "glorious-lord-light-brown",
    name: "Glorious (Lord) Light Brown — Egyptian Cotton Unstitched",
    brand: "Glorious (Lord)",
    color: "Light Brown",
    hex: "#B88C63",
    fabric: "Egyptian Cotton",
    price: 6500,
    desc: "Egyptian Cotton unstitched shalwar kameez fabric in Light Brown.\n\n- 4.5 metre: Rs. 6500\n- 5.5 metre: Rs. 8000\n\nColour shown: Light Brown (swatch #B88C63).",
  },
  {
    slug: "glorious-lord-off-white",
    name: "Glorious (Lord) Off White — Egyptian Cotton Unstitched",
    brand: "Glorious (Lord)",
    color: "Off White",
    hex: "#F2EFE8",
    fabric: "Egyptian Cotton",
    price: 6500,
    desc: "Egyptian Cotton unstitched shalwar kameez fabric in Off White.\n\n- 4.5 metre: Rs. 6500\n- 5.5 metre: Rs. 8000\n\nColour shown: Off White (swatch #F2EFE8).",
  },
  {
    slug: "glorious-lord-navy-blue",
    name: "Glorious (Lord) Navy Blue — Egyptian Cotton Unstitched",
    brand: "Glorious (Lord)",
    color: "Navy Blue",
    hex: "#223D73",
    fabric: "Egyptian Cotton",
    price: 6500,
    desc: "Egyptian Cotton unstitched shalwar kameez fabric in Navy Blue.\n\n- 4.5 metre: Rs. 6500\n- 5.5 metre: Rs. 8000\n\nColour shown: Navy Blue (swatch #223D73).",
  },
  {
    slug: "glorious-lord-brown",
    name: "Glorious (Lord) Brown — Egyptian Cotton Unstitched",
    brand: "Glorious (Lord)",
    color: "Brown",
    hex: "#6A4B33",
    fabric: "Egyptian Cotton",
    price: 6500,
    desc: "Egyptian Cotton unstitched shalwar kameez fabric in Brown.\n\n- 4.5 metre: Rs. 6500\n- 5.5 metre: Rs. 8000\n\nColour shown: Brown (swatch #6A4B33).",
  },
  {
    slug: "glorious-lord-black",
    name: "Glorious (Lord) Black — Egyptian Cotton Unstitched",
    brand: "Glorious (Lord)",
    color: "Black",
    hex: "#1C1C1C",
    fabric: "Egyptian Cotton",
    price: 6500,
    desc: "Egyptian Cotton unstitched shalwar kameez fabric in Black.\n\n- 4.5 metre: Rs. 6500\n- 5.5 metre: Rs. 8000\n\nColour shown: Black (swatch #1C1C1C).",
  },
  {
    slug: "glorious-lord-mehroon",
    name: "Glorious (Lord) Mehroon — Egyptian Cotton Unstitched",
    brand: "Glorious (Lord)",
    color: "Mehroon",
    hex: "#6E1F2A",
    fabric: "Egyptian Cotton",
    price: 6500,
    desc: "Egyptian Cotton unstitched shalwar kameez fabric in Mehroon.\n\n- 4.5 metre: Rs. 6500\n- 5.5 metre: Rs. 8000\n\nColour shown: Mehroon (swatch #6E1F2A).",
  },
  {
    slug: "markhor-olive-green",
    name: "Markhor Olive Green — Premium Egyptian Cotton Unstitched",
    brand: "Markhor",
    color: "Olive Green",
    hex: "#6F7D3C",
    fabric: "Premium Egyptian Cotton",
    price: 6500,
    desc: "Premium Egyptian Cotton unstitched shalwar kameez fabric in Olive Green.\n\n- 4.5 metre: Rs. 6500\n- 5.5 metre: Rs. 8000\n\nColour shown: Olive Green (swatch #6F7D3C).",
  },
  {
    slug: "markhor-silver-light-grey",
    name: "Markhor Silver / Light Grey — Premium Egyptian Cotton Unstitched",
    brand: "Markhor",
    color: "Silver / Light Grey",
    hex: "#C9CBCD",
    fabric: "Premium Egyptian Cotton",
    price: 6500,
    desc: "Premium Egyptian Cotton unstitched shalwar kameez fabric in Silver / Light Grey.\n\n- 4.5 metre: Rs. 6500\n- 5.5 metre: Rs. 8000\n\nColour shown: Silver / Light Grey (swatch #C9CBCD).",
  },
  {
    slug: "markhor-metallic-blue",
    name: "Markhor Metallic Blue — Premium Egyptian Cotton Unstitched",
    brand: "Markhor",
    color: "Metallic Blue",
    hex: "#4E7295",
    fabric: "Premium Egyptian Cotton",
    price: 6500,
    desc: "Premium Egyptian Cotton unstitched shalwar kameez fabric in Metallic Blue.\n\n- 4.5 metre: Rs. 6500\n- 5.5 metre: Rs. 8000\n\nColour shown: Metallic Blue (swatch #4E7295).",
  },
  {
    slug: "markhor-pistachio",
    name: "Markhor Pistachio — Premium Egyptian Cotton Unstitched",
    brand: "Markhor",
    color: "Pistachio",
    hex: "#A9C58C",
    fabric: "Premium Egyptian Cotton",
    price: 6500,
    desc: "Premium Egyptian Cotton unstitched shalwar kameez fabric in Pistachio.\n\n- 4.5 metre: Rs. 6500\n- 5.5 metre: Rs. 8000\n\nColour shown: Pistachio (swatch #A9C58C).",
  },
  {
    slug: "markhor-pure-white",
    name: "Markhor Pure White — Premium Egyptian Cotton Unstitched",
    brand: "Markhor",
    color: "Pure White",
    hex: "#FAFAF8",
    fabric: "Premium Egyptian Cotton",
    price: 6500,
    desc: "Premium Egyptian Cotton unstitched shalwar kameez fabric in Pure White.\n\n- 4.5 metre: Rs. 6500\n- 5.5 metre: Rs. 8000\n\nColour shown: Pure White (swatch #FAFAF8).",
  },
  {
    slug: "markhor-tea-pink",
    name: "Markhor Tea Pink — Premium Egyptian Cotton Unstitched",
    brand: "Markhor",
    color: "Tea Pink",
    hex: "#D9B1A8",
    fabric: "Premium Egyptian Cotton",
    price: 6500,
    desc: "Premium Egyptian Cotton unstitched shalwar kameez fabric in Tea Pink.\n\n- 4.5 metre: Rs. 6500\n- 5.5 metre: Rs. 8000\n\nColour shown: Tea Pink (swatch #D9B1A8).",
  },
  {
    slug: "markhor-ash-green",
    name: "Markhor Ash Green — Premium Egyptian Cotton Unstitched",
    brand: "Markhor",
    color: "Ash Green",
    hex: "#8B9B84",
    fabric: "Premium Egyptian Cotton",
    price: 6500,
    desc: "Premium Egyptian Cotton unstitched shalwar kameez fabric in Ash Green.\n\n- 4.5 metre: Rs. 6500\n- 5.5 metre: Rs. 8000\n\nColour shown: Ash Green (swatch #8B9B84).",
  },
  {
    slug: "markhor-light-blue",
    name: "Markhor Light Blue — Premium Egyptian Cotton Unstitched",
    brand: "Markhor",
    color: "Light Blue",
    hex: "#8BBEE8",
    fabric: "Premium Egyptian Cotton",
    price: 6500,
    desc: "Premium Egyptian Cotton unstitched shalwar kameez fabric in Light Blue.\n\n- 4.5 metre: Rs. 6500\n- 5.5 metre: Rs. 8000\n\nColour shown: Light Blue (swatch #8BBEE8).",
  },
  {
    slug: "markhor-olive-green-2",
    name: "Markhor Olive Green — Premium Egyptian Cotton Unstitched",
    brand: "Markhor",
    color: "Olive Green",
    hex: "#6E7C3A",
    fabric: "Premium Egyptian Cotton",
    price: 6500,
    desc: "Premium Egyptian Cotton unstitched shalwar kameez fabric in Olive Green.\n\n- 4.5 metre: Rs. 6500\n- 5.5 metre: Rs. 8000\n\nColour shown: Olive Green (swatch #6E7C3A).",
  },
  {
    slug: "markhor-silver-light-grey-2",
    name: "Markhor Silver / Light Grey — Premium Egyptian Cotton Unstitched",
    brand: "Markhor",
    color: "Silver / Light Grey",
    hex: "#C8CACB",
    fabric: "Premium Egyptian Cotton",
    price: 6500,
    desc: "Premium Egyptian Cotton unstitched shalwar kameez fabric in Silver / Light Grey.\n\n- 4.5 metre: Rs. 6500\n- 5.5 metre: Rs. 8000\n\nColour shown: Silver / Light Grey (swatch #C8CACB).",
  },
  {
    slug: "markhor-metallic-blue-2",
    name: "Markhor Metallic Blue — Premium Egyptian Cotton Unstitched",
    brand: "Markhor",
    color: "Metallic Blue",
    hex: "#55789A",
    fabric: "Premium Egyptian Cotton",
    price: 6500,
    desc: "Premium Egyptian Cotton unstitched shalwar kameez fabric in Metallic Blue.\n\n- 4.5 metre: Rs. 6500\n- 5.5 metre: Rs. 8000\n\nColour shown: Metallic Blue (swatch #55789A).",
  },
  {
    slug: "markhor-pistachio-2",
    name: "Markhor Pistachio — Premium Egyptian Cotton Unstitched",
    brand: "Markhor",
    color: "Pistachio",
    hex: "#A8C48E",
    fabric: "Premium Egyptian Cotton",
    price: 6500,
    desc: "Premium Egyptian Cotton unstitched shalwar kameez fabric in Pistachio.\n\n- 4.5 metre: Rs. 6500\n- 5.5 metre: Rs. 8000\n\nColour shown: Pistachio (swatch #A8C48E).",
  },
  {
    slug: "markhor-pure-white-2",
    name: "Markhor Pure White — Premium Egyptian Cotton Unstitched",
    brand: "Markhor",
    color: "Pure White",
    hex: "#F8F8F6",
    fabric: "Premium Egyptian Cotton",
    price: 6500,
    desc: "Premium Egyptian Cotton unstitched shalwar kameez fabric in Pure White.\n\n- 4.5 metre: Rs. 6500\n- 5.5 metre: Rs. 8000\n\nColour shown: Pure White (swatch #F8F8F6).",
  },
  {
    slug: "markhor-tea-pink-2",
    name: "Markhor Tea Pink — Premium Egyptian Cotton Unstitched",
    brand: "Markhor",
    color: "Tea Pink",
    hex: "#D8AEA5",
    fabric: "Premium Egyptian Cotton",
    price: 6500,
    desc: "Premium Egyptian Cotton unstitched shalwar kameez fabric in Tea Pink.\n\n- 4.5 metre: Rs. 6500\n- 5.5 metre: Rs. 8000\n\nColour shown: Tea Pink (swatch #D8AEA5).",
  },
  {
    slug: "markhor-ash-green-2",
    name: "Markhor Ash Green — Premium Egyptian Cotton Unstitched",
    brand: "Markhor",
    color: "Ash Green",
    hex: "#8C9C86",
    fabric: "Premium Egyptian Cotton",
    price: 6500,
    desc: "Premium Egyptian Cotton unstitched shalwar kameez fabric in Ash Green.\n\n- 4.5 metre: Rs. 6500\n- 5.5 metre: Rs. 8000\n\nColour shown: Ash Green (swatch #8C9C86).",
  },
  {
    slug: "markhor-light-blue-2",
    name: "Markhor Light Blue — Premium Egyptian Cotton Unstitched",
    brand: "Markhor",
    color: "Light Blue",
    hex: "#8EC0E8",
    fabric: "Premium Egyptian Cotton",
    price: 6500,
    desc: "Premium Egyptian Cotton unstitched shalwar kameez fabric in Light Blue.\n\n- 4.5 metre: Rs. 6500\n- 5.5 metre: Rs. 8000\n\nColour shown: Light Blue (swatch #8EC0E8).",
  },
  {
    slug: "glorious-lord-brown-2",
    name: "Glorious (Lord) Brown — Egyptian Cotton Unstitched",
    brand: "Glorious (Lord)",
    color: "Brown",
    hex: "#6B4A34",
    fabric: "Egyptian Cotton",
    price: 6500,
    desc: "Egyptian Cotton unstitched shalwar kameez fabric in Brown.\n\n- 4.5 metre: Rs. 6500\n- 5.5 metre: Rs. 8000\n\nColour shown: Brown (swatch #6B4A34).",
  },
  {
    slug: "glorious-brilliant-sky-blue-2",
    name: "Glorious (Brilliant) Sky Blue — Egyptian Cotton Unstitched",
    brand: "Glorious (Brilliant)",
    color: "Sky Blue",
    hex: "#70ACEA",
    fabric: "Egyptian Cotton",
    price: 6500,
    desc: "Egyptian Cotton unstitched shalwar kameez fabric in Sky Blue.\n\n- 4.5 metre: Rs. 6500\n- 5.5 metre: Rs. 8000\n\nColour shown: Sky Blue (swatch #70ACEA).",
  },
  {
    slug: "glorious-brilliant-white-black",
    name: "Glorious (Brilliant) White Black — Egyptian Cotton Unstitched",
    brand: "Glorious (Brilliant)",
    color: "White Black",
    hex: "#EDEAE4",
    fabric: "Egyptian Cotton",
    price: 6500,
    desc: "Egyptian Cotton unstitched shalwar kameez fabric in White Black.\n\n- 4.5 metre: Rs. 6500\n- 5.5 metre: Rs. 8000\n\nColour shown: White Black (swatch #EDEAE4).",
  },
  {
    slug: "glorious-brilliant-navy-blue-2",
    name: "Glorious (Brilliant) Navy Blue — Egyptian Cotton Unstitched",
    brand: "Glorious (Brilliant)",
    color: "Navy Blue",
    hex: "#21467A",
    fabric: "Egyptian Cotton",
    price: 6500,
    desc: "Egyptian Cotton unstitched shalwar kameez fabric in Navy Blue.\n\n- 4.5 metre: Rs. 6500\n- 5.5 metre: Rs. 8000\n\nColour shown: Navy Blue (swatch #21467A).",
  },
  {
    slug: "glorious-lord-off-white-2",
    name: "Glorious (Lord) Off White — Egyptian Cotton Unstitched",
    brand: "Glorious (Lord)",
    color: "Off White",
    hex: "#F1EEE7",
    fabric: "Egyptian Cotton",
    price: 6500,
    desc: "Egyptian Cotton unstitched shalwar kameez fabric in Off White.\n\n- 4.5 metre: Rs. 6500\n- 5.5 metre: Rs. 8000\n\nColour shown: Off White (swatch #F1EEE7).",
  },
  {
    slug: "glorious-lord-light-brown-2",
    name: "Glorious (Lord) Light Brown — Egyptian Cotton Unstitched",
    brand: "Glorious (Lord)",
    color: "Light Brown",
    hex: "#B99068",
    fabric: "Egyptian Cotton",
    price: 6500,
    desc: "Egyptian Cotton unstitched shalwar kameez fabric in Light Brown.\n\n- 4.5 metre: Rs. 6500\n- 5.5 metre: Rs. 8000\n\nColour shown: Light Brown (swatch #B99068).",
  },
  {
    slug: "glorious-lord-black-2",
    name: "Glorious (Lord) Black — Egyptian Cotton Unstitched",
    brand: "Glorious (Lord)",
    color: "Black",
    hex: "#1A1A1A",
    fabric: "Egyptian Cotton",
    price: 6500,
    desc: "Egyptian Cotton unstitched shalwar kameez fabric in Black.\n\n- 4.5 metre: Rs. 6500\n- 5.5 metre: Rs. 8000\n\nColour shown: Black (swatch #1A1A1A).",
  },
  {
    slug: "glorious-lord-mehroon-2",
    name: "Glorious (Lord) Mehroon — Egyptian Cotton Unstitched",
    brand: "Glorious (Lord)",
    color: "Mehroon",
    hex: "#6C1E2C",
    fabric: "Egyptian Cotton",
    price: 6500,
    desc: "Egyptian Cotton unstitched shalwar kameez fabric in Mehroon.\n\n- 4.5 metre: Rs. 6500\n- 5.5 metre: Rs. 8000\n\nColour shown: Mehroon (swatch #6C1E2C).",
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
  return filename.replace(/\.[^.]+$/, "");
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
      <h1>Import fabric catalogue</h1>
      <p class="muted">36 products (Markhor + Glorious), 1 photo each. Safe to run more
         than once — each product has a fixed id, so a second run updates rather than
         duplicates.</p>

      <div class="im-note">
        <b>Pick the photos first.</b> Select all 36 .jpg files from the
        <code>catalogue-photos</code> folder that shipped with this importer — they're
        already named to match. Don't rename them.
      </div>

      <input type="file" id="imFiles" multiple accept="image/*">
      <p id="imCount" class="muted" style="margin-top:8px">No files chosen.</p>

      <button class="btn btn-primary" id="imRun" disabled style="margin-top:12px">
        Import 36 products
      </button>

      <div class="im-log" id="imLog"></div>
    </div>`;

  let files = [];
  document.getElementById("imFiles").onchange = (e) => {
    files = [...e.target.files];
    document.getElementById("imCount").textContent =
      `${files.length} file${files.length === 1 ? "" : "s"} chosen.`;
    document.getElementById("imRun").disabled = files.length === 0;
  };

  document.getElementById("imRun").onclick = async () => {
    const btn = document.getElementById("imRun");
    btn.disabled = true; btn.textContent = "Importing…";
    document.getElementById("imLog").innerHTML = "";

    // A data-URL fallback would push a few hundred KB of base64 into each
    // Firestore document. Refuse rather than corrupt.
    if (!(await cloudinaryReady())) {
      log("Cloudinary isn't configured in firebase-config.js — stopping.", "err");
      log("Without it the photos would be inlined as base64 and the writes would fail.", "err");
      btn.disabled = false; btn.textContent = "Import 36 products";
      return;
    }

    // Map chosen files by slug (filename minus extension).
    const bySlug = {};
    for (const f of files) bySlug[slugOf(f.name)] = f;

    // Make sure every brand exists so the product form's dropdown matches.
    let brands = await listBrands();
    const brandNames = [...new Set(CATALOGUE.map((p) => p.brand))];
    for (const name of brandNames) {
      if (!brands.some((b) => (b.name || "").toLowerCase() === name.toLowerCase())) {
        try {
          await saveBrand({ name, order: brands.length + 1 });
          brands = await listBrands();
          log(`brand added: ${name}`, "ok");
        } catch (e) {
          log(`brand "${name}" failed: ${e.code || e.message}`, "err");
        }
      }
    }

    let done = 0, failed = 0;
    for (const p of CATALOGUE) {
      log(`${p.name}`, "head");
      const file = bySlug[p.slug];
      if (!file) {
        log(`  no photo found for "${p.slug}.jpg" — skipping`, "err");
        failed++; continue;
      }

      let url;
      try {
        url = await uploadImage(file);
        if (!/^https:\/\//.test(url)) throw new Error("upload fell back to a local preview");
        log(`  uploaded ${file.name}`, "ok");
      } catch (e) {
        log(`  ${file.name}: ${e.message}`, "err");
        failed++; continue;
      }

      try {
        await adminSaveProduct({
          id: "fab-" + p.slug,           // fixed id → re-running updates in place
          name: p.name,
          category: "men",
          sub: "Unstitched Fabric",
          brand: p.brand,
          quality: [p.fabric],
          price: p.price,
          salePrice: null,
          stock: 0,                       // set your real stock in /admin/products
          rating: 4.6,
          desc: p.desc,
          colors: [{ name: p.color, hex: p.hex }],
          sizes: ["4.5 metre", "5.5 metre"],
          images: [url],
          image: url,
          featured: false, trending: false, bestseller: false, isNew: true,
          active: false                   // hidden until you set stock and check it
        });
        log(`  saved`, "ok");
        done++;
      } catch (e) {
        console.error(e);
        log(`  save failed: ${e.code || e.message}`, "err");
        if (String(e.code || "").includes("permission-denied")) {
          log("  → your admin email is probably not verified yet", "err");
        }
        failed++;
      }
    }

    log("", "");
    log(`Done. ${done} imported, ${failed} failed.`, failed ? "warn" : "ok");
    log("Every product is saved INACTIVE with stock 0 — set stock, verify the photo", "");
    log("matches the listed colour, and tick active in /admin/products before it", "");
    log("shows on the storefront.", "");
    toast(`${done} product(s) imported`, failed ? "err" : "ok");
    btn.textContent = "Run again";
    btn.disabled = false;
  };
})();
