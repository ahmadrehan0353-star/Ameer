// ============================================================
// AMEER OFFICIAL — one-time product importer
//
// Adds the 19 products from the supplier WhatsApp catalogue to Firestore,
// uploading their photos to Cloudinary on the way. This is a throwaway
// page: run it once, check /admin/products, then delete this file and
// admin/import.html from the repo.
//
// Nothing here is reachable from the sidebar — open it directly at
// /admin/import.html. It never runs on its own.
// ============================================================
import { requireAdmin, renderAdminShell } from "./admin-guard.js";
import { adminSaveProduct, uploadImage, cloudinaryReady, listBrands, saveBrand } from "./admin-data.js";
import { esc, toast } from "./utils.js";

// Photo files are matched to products by filename: every photo in
// 03-baroque-luxury-chiffon/ is named baroque-luxury-chiffon-1.jpeg,
// -2.jpeg and so on, so the slug is just the name minus the trailing
// "-<n>.jpeg". Don't rename the files before importing.
const CATALOGUE = [
  {
    slug: "crimson-chikankari-lawn",
    name: "Crimson Chikankari Lawn Embroidered Luxury Unstitched 3pc",
    brand: "Crimson",
    category: "women", sub: "Unstitched",
    price: 5500,
    photos: 0,
    desc: "Chikankari lawn embroidered luxury unstitched 3pc.\n\n- Shirt: chikankari lawn embroidered\n- Daman: chikankari emb on fabric\n- Sleeves: chikankari lawn embroidered\n- Trouser: plain lawn & emb patch\n- Dupatta: chiffon embroidered"
  },
  {
    slug: "afrozeh-organza",
    name: "Afrozeh Organza Embroidered Unstitched 3pc",
    brand: "Afrozeh",
    category: "women", sub: "Unstitched",
    price: 7000,
    photos: 0,
    desc: "Organza embroidered alternate front embelish with stone work. Front embroidered daman embelish with stone work n tussels.\n\nOrganza embroidered alternate back. Embroidered back daman with tussels.\n\nOrganza embroidered seleeves embelish with stone work. Embroidered cuff patch with tussels.\n\nOrganza embroidered dupatta with 4side satin cut work embroidered lace attached along with tussels.\n\nDyed malai trouser.\n\nAvailable in two colours (teal, pink)."
  },
  {
    slug: "baroque-luxury-chiffon",
    name: "Baroque Luxury Chiffon Hand Embellished Festive 2025",
    brand: "Baroque",
    category: "women", sub: "Unstitched",
    price: 5500,
    photos: 6,
    desc: "Luxury chiffon hand embellished festive collection 2025.\n\nChiffon dyed front along with elegant embroidered neck patches with heavy adda work.\n\nChiffon heavy alternate embroidered seleeves with heavy adda work cuff on fabric with hanging tussle as like original.\n\nDyed chiffon back.\n\nDyed chiffon dupatta with heavy embroidery 3D tussle attached on 4 side (ready to wear).\n\nDyed malai trouser.\n\nAvailable in two colours (mint green, pink)."
  },
  {
    slug: "elaaf-bridal-organza",
    name: "Elaaf Bridal Organza Embroidered Unstitched 3pc",
    brand: "Elaaf Bridal",
    category: "women", sub: "Unstitched",
    price: 6000,
    photos: 0,
    desc: "Fabric details: Organza (shirt), Organza (dupatta), Malai (trousers).\n\n- Front: embroidered with stones handwork\n- Neck: embroidered with stones handwork and addawork\n- Front border: embroidered with hanging tassel's\n- Back: plane\n- Back border: embroidered with cutwork\n- Sleeves: embroidered\n- Sleeves border: embroidered with attached pearls\n- Dupatta: embroidered with 4 side embroidered border and with hanging tassel's\n\nPremium quality."
  },
  {
    slug: "izel-lawn-elegant",
    name: "Izel Lawn Embroidered Elegant Unstitched 3pc",
    brand: "Izel",
    category: "women", sub: "Unstitched",
    price: 5000,
    photos: 4,
    desc: "Lawn embroidered elegant unstitced 3pc.\n\n- Shirt: lawn chikankari embroidered\n- Sleeves: lawn embroidered\n- Trouser: dyed plain lawn\n- Dupatta: voil lawn printed\n\nAvailable in two colours (green, red)."
  },
  {
    slug: "izel-lawn-summer",
    name: "Izel Lawn Embroidered Summer Unstitched 3pc",
    brand: "Izel",
    category: "women", sub: "Unstitched",
    price: 5000,
    photos: 4,
    desc: "Lawn embroidered summer unstitced 3pc.\n\n- Front: lawn embroidered\n- Sleeves: lawn embroidered\n- Daman: embroidered on fabric\n- Neck: embroidered on fabric\n- Back: dyed lawn\n- Trouser: dyed lawn\n- Shawl: monark voil printed\n\nAvailable in two colours (maroon, navy)."
  },
  {
    slug: "aneelas-lawn-hit-code",
    name: "Aneela's Lawn Embroidered Hit Code Unstitched 3pc",
    brand: "Aneela's",
    category: "women", sub: "Unstitched",
    price: 4500,
    photos: 4,
    desc: "Lawn embroidered hit code unstitced 3pc.\n\n- Shirt: lawn embroidered\n- Daman: embroidered on fabric\n- Sleeves: lawn embroidered\n- Trouser: dyed lawn & emb patch\n- Dupatta: voil lawn printed\n\nAvailable in two colours (black, blue)."
  },
  {
    slug: "maria-b-lawn-chiffon",
    name: "Maria.B Printed Lawn & Chiffon Unstitched 3pc",
    brand: "Maria B",
    category: "women", sub: "Unstitched",
    price: 5000,
    photos: 6,
    desc: "Fabric details: Lawn & Chiffon.\n\n- Printed lawn chikankari front with laser work\n- Front embroidered daman patch\n- Printed lawn back\n- Printed lawn sleeves\n- Sleeves embroidered patch\n- Chiffon printed dupatta with 4 sided embroidered laced\n- Printed trouser\n\nAvailable in four colours (black, aqua, yellow, pink)."
  },
  {
    slug: "angan-lawn-cotton",
    name: "Angan Lawn Cotton Embroidered Hit Code Unstitched 3pc",
    brand: "Angan",
    category: "women", sub: "Unstitched",
    price: 4500,
    photos: 4,
    desc: "Lawn cotton embroidered hit code unstitched 3pc.\n\n- Shirt: lawn cotton embroidered\n- Sleeves: lawn cotton embroidered\n- Trouser: lawn cotton embroidered\n- Dupatta: printed doriaya\n\nAvailable in two colours (maroon, black)."
  },
  {
    slug: "bareeze-lawn-cotton-2pc",
    name: "Bareeze Lawn Cotton Embroidered Hit Code Unstitched 2pc",
    brand: "Bareeze",
    category: "women", sub: "Unstitched",
    price: 3200,
    photos: 5,
    desc: "Lawn cotton embroidered hit code unstitced 2pc.\n\n- Front: lawn cotton embroidered\n- Sleeves: lawn cotton embroidered\n- Trouser: dyed lawn cotton plain\n\nAvailable in five colours (pink, white, green, yellow, rose)."
  },
  {
    slug: "asim-jofa-lawn-luxury",
    name: "Asim Jofa Lawn Embroidered Luxury Unstitched 3pc",
    brand: "Asim Jofa",
    category: "women", sub: "Unstitched",
    price: 5500,
    photos: 4,
    desc: "Lawn embroidered luxury unstitced 3pc.\n\n- Shirt: lawn embroidered\n- Daman: embroidered patch\n- Sleeves: lawn embroidered\n- Trouser: dyed lawn\n- Dupatta: bamber chiffon embroidered"
  },
  {
    slug: "ikrash-lawn",
    name: "Ikrash Lawn Embroidered Unstitched 3pc",
    brand: "Ikrash",
    category: "women", sub: "Unstitched",
    price: 5500,
    photos: 3,
    desc: "Lawn embroidered unstitched 3pc.\n\n- Front: embroidered lawn\n- Daman: embroiderd on fabric\n- Sleeves: embroidered lawn\n- Back: plain lawn\n- Trouser: plain lawn\n- Dupatta: embroidered lawn"
  },
  {
    slug: "azure-lawn-luxury",
    name: "Azure Lawn Embroidered Luxury Unstitched 3pc",
    brand: "Azure",
    category: "women", sub: "Unstitched",
    price: 5500,
    photos: 4,
    desc: "Lawn embroidered luxury unstitced 3pc.\n\n- Shirt: lawn embroidered\n- Neckline: embroidered patch\n- Daman: embroidered patch\n- Sleeves: lawn embroidered\n- Trouser: plain lawn & emb patch\n- Dupatta: organza embroidered"
  },
  {
    slug: "jazmin-lawn-hit-code",
    name: "Jazmin Lawn Embroidered Hit Code Unstitched 3pc",
    brand: "Jazmin",
    category: "women", sub: "Unstitched",
    price: 4500,
    photos: 4,
    desc: "Lawn embroidered hit code unstitced 3pc.\n\n- Shirt: lawn embroidered\n- Sleeves: lawn embroidered\n- Trouser: dyed plain lawn\n- Dupatta: voil lawn printed"
  },
  {
    slug: "zara-shahjahan-lawn",
    name: "Zara Shahjahan Lawn Embroidered Hit Code Unstitched 3pc",
    brand: "Zara Shahjahan",
    category: "women", sub: "Unstitched",
    price: 4300,
    photos: 4,
    desc: "Lawn embroidered hit code unstitced 3pc.\n\n- Front: lawn embroidered\n- Back: plain lawn with emb patch\n- Sleeves: lawn embroidered\n- Trouser: lawn embroidered\n- Dupatta: voil lawn tye & dye"
  },
  {
    slug: "imrozia-chiffon-net",
    name: "Imrozia Chiffon / Net Embroidered Unstitched 3pc",
    brand: "Imrozia",
    category: "women", sub: "Unstitched",
    price: 9000,
    photos: 6,
    desc: "Fabric details: Shirt - chiffon, Dupatta - net, Trouser - malai.\n\nEmbroidery details:\n- Neck embroidered (with addawork)\n- Front embroidered (with handwork)\n- Front border embroidered (with handwork and hanging tassels)\n- Back embroidered\n- Back border embroidered\n- Sleeves embroidered\n- Sleeves border embroidered (with hanging tassels)\n- Dupatta embroidered with 4 side embroidered border & hanging tassels\n- Trouser patch embroidered"
  },
  {
    slug: "elaf-organza-malai",
    name: "Elaf Organza & Malai Heavy Embroidered Unstitched 3pc",
    brand: "Elaf",
    category: "women", sub: "Unstitched",
    price: 8500,
    photos: 4,
    desc: "Fabric details: Organza & Malai.\n\n- Front: organza heavy embroidered front embelish with handwork and mirror work along with embroidered border patch (2 pcs), tussels attached\n- Sleeves: organza embroidered seleeves embelish with handwork and mirror work along with embroidered cuff patch (2pcs), tussels attached\n- Back: dyed back with embroidered border patch (2pcs)\n- Dupatta: organza embroidered dupatta with 4side cutwork embroidered border along with attached tussels\n- Trouser: dyed malai trouser"
  },
  {
    slug: "adan-libas-festive",
    name: "Adan Libas Festive Collection Organza Embroidered 3pc",
    brand: "Adan Libas",
    category: "women", sub: "Unstitched",
    price: 8000,
    photos: 3,
    desc: "Most demanded article. Festive collection.\n\nOrganza embroidered sequence front embelish with handwork.\n\nHeavy sequence embroidered daman patch embellish with handwork and hanging tussels.\n\nOrganza heavy embroidered seleeves embelish with handwork and hanging tussel.\n\nSequence embroidered back with emb daman patch.\n\nHeavy embroidered organza dupatta along with embroidred pallu attached and 4side embroidered lace attached embelish with hanging tussles.\n\nMalai dyed trouser."
  },
  {
    slug: "markhor-galaxy-cotton",
    name: "Markhor Galaxy Cotton \u2014 Premium Egyptian Cotton (Unstitched Fabric)",
    brand: "Markhor",
    category: "men", sub: "Shalwar Kameez",
    price: 6500,
    photos: 8,
    desc: "Premium egyption cotton, Galaxy Cotton by Markhor.\n\n- 4.5 meter: 6500/Rs\n- 5.5 meter: 8000/Rs\n\nChat quoted Olive Green; the photos show several shades (tags read Shade #5, #6, #7, #8)."
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
      <h1>Import supplier catalogue</h1>
      <p class="muted">19 products, 73 photos. Safe to run more than once — each
         product has a fixed id, so a second run updates rather than duplicates.</p>

      <div class="im-note">
        <b>Pick the photos first.</b> Select all 73 .jpeg files from the catalog
        folder — open every product subfolder and select everything, or just
        drag the whole lot in at once. Filenames are what map a photo to its
        product, so don't rename them.
      </div>

      <input type="file" id="imFiles" multiple accept="image/*">
      <p id="imCount" class="muted" style="margin-top:8px">No files chosen.</p>

      <button class="btn btn-primary" id="imRun" disabled style="margin-top:12px">
        Import 19 products
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

    // A data-URL fallback would push ~500KB of base64 into each Firestore
    // document and blow the 1MB per-doc limit. Refuse rather than corrupt.
    if (!(await cloudinaryReady())) {
      log("Cloudinary isn't configured in firebase-config.js — stopping.", "err");
      log("Without it the photos would be inlined as base64 and the writes would fail.", "err");
      btn.disabled = false; btn.textContent = "Import 19 products";
      return;
    }

    // Group the chosen files by slug.
    const bySlug = {};
    for (const f of files) {
      const s = slugOf(f.name);
      (bySlug[s] = bySlug[s] || []).push(f);
    }
    for (const s of Object.keys(bySlug)) {
      bySlug[s].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    }

    // Make sure every brand exists so the product form's dropdown matches.
    let brands = await listBrands();
    for (const p of CATALOGUE) {
      if (!brands.some((b) => (b.name || "").toLowerCase() === p.brand.toLowerCase())) {
        try {
          await saveBrand({ name: p.brand, order: brands.length + 1 });
          brands = await listBrands();
          log(`brand added: ${p.brand}`, "ok");
        } catch (e) {
          log(`brand "${p.brand}" failed: ${e.code || e.message}`, "err");
        }
      }
    }

    let done = 0, failed = 0;
    for (const p of CATALOGUE) {
      log(`${p.name}`, "head");
      const chosen = bySlug[p.slug] || [];
      if (chosen.length !== p.photos) {
        log(`  expected ${p.photos} photo(s), found ${chosen.length}`,
            chosen.length ? "warn" : "err");
      }

      const urls = [];
      for (const f of chosen) {
        try {
          const url = await uploadImage(f);
          if (!/^https:\/\//.test(url)) throw new Error("upload fell back to a local preview");
          urls.push(url);
          log(`  uploaded ${f.name}`, "ok");
        } catch (e) {
          log(`  ${f.name}: ${e.message}`, "err");
        }
      }

      if (!urls.length && p.photos > 0) {
        log("  no photos uploaded — skipping this product", "err");
        failed++; continue;
      }

      try {
        await adminSaveProduct({
          id: "cat-" + p.slug,          // fixed id → re-running updates in place
          name: p.name,
          category: p.category,
          sub: p.sub,
          brand: p.brand,
          quality: [],
          price: p.price,
          salePrice: null,
          stock: 0,                      // set your real stock in /admin/products
          rating: 4.6,
          desc: p.desc,
          colors: [{ name: "As shown", hex: "#c9b18b" }],
          sizes: [],
          images: urls.length ? urls : undefined,
          image: urls[0],
          featured: false, trending: false, bestseller: false, isNew: true,
          active: false                  // hidden until you set stock and check it
        });
        log(`  saved (${urls.length} photo${urls.length === 1 ? "" : "s"})`, "ok");
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
    log("Every product is saved INACTIVE with stock 0 — set stock and tick", "");
    log("active in /admin/products before they show on the storefront.", "");
    toast(`${done} product(s) imported`, failed ? "err" : "ok");
    btn.textContent = "Run again";
    btn.disabled = false;
  };
})();
