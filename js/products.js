// ============================================================
// AMEER OFFICIAL — product data layer
// Reads live products from Firestore when configured; otherwise
// serves a rich built-in catalog so the storefront always works.
// The admin dashboard writes to the same Firestore collection,
// so admin edits appear on the public site automatically.
// ============================================================
import { placeholder } from "./utils.js";

let _cache = null;

// ---- built-in seed catalog (professional placeholder imagery via picsum) ----
const SEED = buildSeed();

function buildSeed() {
  const mk = (id, name, category, sub, price, sale, tags, colors, sizes, imgs) => {
    const pics = imgs && imgs.length ? imgs : [placeholder(id + "a"), placeholder(id + "b")];
    return {
      id, name, category, sub, price,
      salePrice: sale || null,
      colors: colors || [{ name: "Black", hex: "#111" }, { name: "Ivory", hex: "#efe9dd" }],
      sizes: sizes || ["XS", "S", "M", "L", "XL"],
      featured: tags.includes("featured"),
      trending: tags.includes("trending"),
      bestseller: tags.includes("best"),
      isNew: tags.includes("new"),
      stock: 24,
      rating: 4.6,
      images: pics,
      image: pics[0],
      desc: `The ${name} is a AMEER OFFICIAL signature — crafted from premium fabric with a considered, elegant finish. A versatile piece designed to be worn and loved season after season.`,
      specs: { Fabric: "Premium quality", Fit: "True to size", Care: "Follow care label", Origin: "Ethically crafted" },
      active: true
    };
  };

  // Real themed photos via Unsplash source (always returns a live image for the keywords).
  // Curated fabric & textile close-ups (no people) — elegant, on-brand,
  // and reliable. Each product gets a deterministic pick so it's consistent.
  const FABRIC_IMG = [
    "1470071459604-3b5ec3a7fe05",
    "1441974231531-c6227db76b6e",
    "1501785888041-af3ef285b470",
    "1416879595882-3373a0480b5b",
    "1447752875215-b2761acb3c5d"
  ];
  const pickImg = (id) => {
    let h = 0; const str = String(id || "x");
    for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
    return FABRIC_IMG[h % FABRIC_IMG.length];
  };
  const IMG = (kw, id) => {
    const pid = pickImg(id);
    return [
      `https://images.unsplash.com/photo-${pid}?auto=format&fit=crop&w=700&q=80`,
      `https://images.unsplash.com/photo-${pid}?auto=format&fit=crop&w=700&q=80&sat=-40`
    ];
  };

  return [
  // ── ZELLBURY MOTHER COLLECTION '26 ─────────────────────────────────────
  // 20 × 3-piece unstitched lawn. Images go in assets/images/mothers/.
  // These appear on /mothers.html and within the Women › Unstitched filter.
  // ─────────────────────────────────────────────────────────────────────────
  {
    id:"WUS26X38006", name:"Mauve Pink Floral 3-Piece Lawn", category:"women", sub:"Unstitched",
    price:2790, salePrice:null, stock:10, rating:4.5, collection:"mothers26", brand:"Zellbury",
    quality:["Original","Unstitched"], featured:false, trending:false, bestseller:false, isNew:true, active:true,
    colors:[{name:"Mauve Pink",hex:"#C87FA4"}], sizes:["Unstitched"],
    image:"assets/images/mothers/WUS26X38006.jpg",
    images:["assets/images/mothers/WUS26X38006.jpg"],
    desc:"Soft mauve pink with an all-over tonal floral print and lace trim on sleeves, paired with a digital-printed dupatta and dyed cambric trouser.\nProduct Code: WUS26X38006 — You can verify this design on the original website at zellbury.com\nSize: Unstitched — cut and stitch as per your measurements.",
    specs:{Fabric:"Digital Printed Lawn",Pieces:"3-Piece",Shirt:"Digital Printed Lawn",Dupatta:"Digital Printed Lawn",Trouser:"Dyed Cambric",Type:"Unstitched",Brand:"Zellbury"}
  },
  {
    id:"WUS26X38007", name:"Ivory Peach Floral 3-Piece Lawn", category:"women", sub:"Unstitched",
    price:2790, salePrice:null, stock:10, rating:4.5, collection:"mothers26", brand:"Zellbury",
    quality:["Original","Unstitched"], featured:false, trending:false, bestseller:false, isNew:true, active:true,
    colors:[{name:"Ivory Peach",hex:"#F2DDD4"}], sizes:["Unstitched"],
    image:"assets/images/mothers/WUS26X38007.jpg",
    images:["assets/images/mothers/WUS26X38007.jpg"],
    desc:"White base with vibrant peach and coral rose blooms, diagonal-stripe dupatta and lace-trimmed sleeves.\nProduct Code: WUS26X38007 — You can verify this design on the original website at zellbury.com\nSize: Unstitched — cut and stitch as per your measurements.",
    specs:{Fabric:"Digital Printed Lawn",Pieces:"3-Piece",Shirt:"Digital Printed Lawn",Dupatta:"Digital Printed Lawn",Trouser:"Dyed Cambric",Type:"Unstitched",Brand:"Zellbury"}
  },
  {
    id:"WUS26X38008", name:"Mustard Gold Rose 3-Piece Lawn", category:"women", sub:"Unstitched",
    price:2790, salePrice:null, stock:10, rating:4.5, collection:"mothers26", brand:"Zellbury",
    quality:["Original","Unstitched"], featured:false, trending:false, bestseller:false, isNew:true, active:true,
    colors:[{name:"Mustard Gold",hex:"#D4A017"}], sizes:["Unstitched"],
    image:"assets/images/mothers/WUS26X38008.jpg",
    images:["assets/images/mothers/WUS26X38008.jpg"],
    desc:"Rich mustard base with cascading pink roses and vine patterns. Detailed neck embellishment with pearl-tone buttons. Ivory printed dupatta.\nProduct Code: WUS26X38008 — You can verify this design on the original website at zellbury.com\nSize: Unstitched — cut and stitch as per your measurements.",
    specs:{Fabric:"Digital Printed Lawn",Pieces:"3-Piece",Shirt:"Digital Printed Lawn",Dupatta:"Digital Printed Lawn",Trouser:"Dyed Cambric",Type:"Unstitched",Brand:"Zellbury"}
  },
  {
    id:"WUS26X38009", name:"Teal Blue Boteh 3-Piece Lawn", category:"women", sub:"Unstitched",
    price:2790, salePrice:null, stock:10, rating:4.5, collection:"mothers26", brand:"Zellbury",
    quality:["Original","Unstitched"], featured:false, trending:false, bestseller:false, isNew:true, active:true,
    colors:[{name:"Teal Blue",hex:"#3ABCB4"}], sizes:["Unstitched"],
    image:"assets/images/mothers/WUS26X38009.jpg",
    images:["assets/images/mothers/WUS26X38009.jpg"],
    desc:"Turquoise ground with repeated deep navy boteh motifs and contrasting navy border. Navy scallop lace trim on sleeves.\nProduct Code: WUS26X38009 — You can verify this design on the original website at zellbury.com\nSize: Unstitched — cut and stitch as per your measurements.",
    specs:{Fabric:"Digital Printed Lawn",Pieces:"3-Piece",Shirt:"Digital Printed Lawn",Dupatta:"Digital Printed Lawn",Trouser:"Dyed Cambric",Type:"Unstitched",Brand:"Zellbury"}
  },
  {
    id:"WUS26X38012", name:"Crimson Floral Sleeveless 3-Piece Lawn", category:"women", sub:"Unstitched",
    price:2790, salePrice:null, stock:10, rating:4.5, collection:"mothers26", brand:"Zellbury",
    quality:["Original","Unstitched"], featured:false, trending:false, bestseller:false, isNew:true, active:true,
    colors:[{name:"Crimson Red",hex:"#B5294E"}], sizes:["Unstitched"],
    image:"assets/images/mothers/WUS26X38012.jpg",
    images:["assets/images/mothers/WUS26X38012.jpg"],
    desc:"Deep crimson red with scattered floral blooms and a mint green lace placket. Sleeveless cut with chevron-print dupatta in matching tones.\nProduct Code: WUS26X38012 — You can verify this design on the original website at zellbury.com\nSize: Unstitched — cut and stitch as per your measurements.",
    specs:{Fabric:"Digital Printed Lawn",Pieces:"3-Piece",Shirt:"Digital Printed Lawn (Sleeveless)",Dupatta:"Digital Printed Lawn",Trouser:"Dyed Cambric",Type:"Unstitched",Brand:"Zellbury"}
  },
  {
    id:"WUS26X38013", name:"Mint Green Floral 3-Piece Lawn", category:"women", sub:"Unstitched",
    price:2790, salePrice:null, stock:10, rating:4.5, collection:"mothers26", brand:"Zellbury",
    quality:["Original","Unstitched"], featured:true, trending:false, bestseller:false, isNew:true, active:true,
    colors:[{name:"Mint Green",hex:"#8EC9A2"}], sizes:["Unstitched"],
    image:"assets/images/mothers/WUS26X38013.jpg",
    images:["assets/images/mothers/WUS26X38013.jpg"],
    desc:"Soft mint green with white rose and leafy botanical prints. White lace trim on V-neckline and sleeves.\nProduct Code: WUS26X38013 — You can verify this design on the original website at zellbury.com\nSize: Unstitched — cut and stitch as per your measurements.",
    specs:{Fabric:"Digital Printed Lawn",Pieces:"3-Piece",Shirt:"Digital Printed Lawn",Dupatta:"Digital Printed Lawn",Trouser:"Dyed Cambric",Type:"Unstitched",Brand:"Zellbury"}
  },
  {
    id:"WUS26X38014", name:"Navy Blue Floral 3-Piece Lawn", category:"women", sub:"Unstitched",
    price:2790, salePrice:null, stock:10, rating:4.5, collection:"mothers26", brand:"Zellbury",
    quality:["Original","Unstitched"], featured:false, trending:true, bestseller:false, isNew:true, active:true,
    colors:[{name:"Navy Blue",hex:"#2A3F7A"}], sizes:["Unstitched"],
    image:"assets/images/mothers/WUS26X38014.jpg",
    images:["assets/images/mothers/WUS26X38014.jpg"],
    desc:"Deep navy base with dense floral bloom print in pink, orange and green. Bold diagonal-stripe dupatta with fuchsia border and dark berry lace trim.\nProduct Code: WUS26X38014 — You can verify this design on the original website at zellbury.com\nSize: Unstitched — cut and stitch as per your measurements.",
    specs:{Fabric:"Digital Printed Lawn",Pieces:"3-Piece",Shirt:"Digital Printed Lawn",Dupatta:"Digital Printed Lawn",Trouser:"Dyed Cambric",Type:"Unstitched",Brand:"Zellbury"}
  },
  {
    id:"WUS26X38015", name:"Olive Green Boteh 3-Piece Lawn", category:"women", sub:"Unstitched",
    price:2790, salePrice:null, stock:10, rating:4.5, collection:"mothers26", brand:"Zellbury",
    quality:["Original","Unstitched"], featured:false, trending:false, bestseller:false, isNew:true, active:true,
    colors:[{name:"Olive Green",hex:"#556B2F"}], sizes:["Unstitched"],
    image:"assets/images/mothers/WUS26X38015.jpg",
    images:["assets/images/mothers/WUS26X38015.jpg"],
    desc:"Earthy olive green with scattered white boteh all-over print. Contrasting ivory dupatta with detailed olive border.\nProduct Code: WUS26X38015 — You can verify this design on the original website at zellbury.com\nSize: Unstitched — cut and stitch as per your measurements.",
    specs:{Fabric:"Digital Printed Lawn",Pieces:"3-Piece",Shirt:"Digital Printed Lawn",Dupatta:"Digital Printed Lawn",Trouser:"Dyed Cambric",Type:"Unstitched",Brand:"Zellbury"}
  },
  {
    id:"WUS26X38017", name:"Blush Pink Rose 3-Piece Lawn", category:"women", sub:"Unstitched",
    price:2790, salePrice:null, stock:10, rating:4.5, collection:"mothers26", brand:"Zellbury",
    quality:["Original","Unstitched"], featured:false, trending:false, bestseller:true, isNew:true, active:true,
    colors:[{name:"Blush Pink",hex:"#EAADB8"}], sizes:["Unstitched"],
    image:"assets/images/mothers/WUS26X38017.jpg",
    images:["assets/images/mothers/WUS26X38017.jpg"],
    desc:"Delicate blush pink with small rose floral all-over print. Deep crimson border trim on the dupatta. Tulip silhouette trouser included.\nProduct Code: WUS26X38017 — You can verify this design on the original website at zellbury.com\nSize: Unstitched — cut and stitch as per your measurements.",
    specs:{Fabric:"Digital Printed Lawn",Pieces:"3-Piece",Shirt:"Digital Printed Lawn",Dupatta:"Digital Printed Lawn",Trouser:"Dyed Cambric",Type:"Unstitched",Brand:"Zellbury"}
  },
  {
    id:"WUS26X38018", name:"Lilac Purple Sleeveless 3-Piece Lawn", category:"women", sub:"Unstitched",
    price:2790, salePrice:null, stock:10, rating:4.5, collection:"mothers26", brand:"Zellbury",
    quality:["Original","Unstitched"], featured:false, trending:false, bestseller:false, isNew:true, active:true,
    colors:[{name:"Lilac Purple",hex:"#C9A6D8"}], sizes:["Unstitched"],
    image:"assets/images/mothers/WUS26X38018.jpg",
    images:["assets/images/mothers/WUS26X38018.jpg"],
    desc:"Soft white-lilac base with oversized purple rose blooms. Sleeveless kurta with purple band collar and embellished placket. Shalwar-style cambric trouser included.\nProduct Code: WUS26X38018 — You can verify this design on the original website at zellbury.com\nSize: Unstitched — cut and stitch as per your measurements.",
    specs:{Fabric:"Digital Printed Lawn",Pieces:"3-Piece",Shirt:"Digital Printed Lawn (Sleeveless)",Dupatta:"Digital Printed Lawn",Trouser:"Dyed Cambric",Type:"Unstitched",Brand:"Zellbury"}
  },
  {
    id:"WUS26X38019", name:"Soft Peach Floral 3-Piece Lawn", category:"women", sub:"Unstitched",
    price:2790, salePrice:null, stock:10, rating:4.5, collection:"mothers26", brand:"Zellbury",
    quality:["Original","Unstitched"], featured:false, trending:false, bestseller:false, isNew:true, active:true,
    colors:[{name:"Soft Peach",hex:"#F2C4A8"}], sizes:["Unstitched"],
    image:"assets/images/mothers/WUS26X38019.jpg",
    images:["assets/images/mothers/WUS26X38019.jpg"],
    desc:"White base with peachy-coral rose clusters and soft green foliage. Watercolour-wash dupatta with green border and tassel detailing.\nProduct Code: WUS26X38019 — You can verify this design on the original website at zellbury.com\nSize: Unstitched — cut and stitch as per your measurements.",
    specs:{Fabric:"Digital Printed Lawn",Pieces:"3-Piece",Shirt:"Digital Printed Lawn",Dupatta:"Digital Printed Lawn",Trouser:"Dyed Cambric",Type:"Unstitched",Brand:"Zellbury"}
  },
  {
    id:"WUS26X38022", name:"Steel Blue Floral 3-Piece Lawn", category:"women", sub:"Unstitched",
    price:2790, salePrice:null, stock:10, rating:4.5, collection:"mothers26", brand:"Zellbury",
    quality:["Original","Unstitched"], featured:false, trending:true, bestseller:false, isNew:true, active:true,
    colors:[{name:"Steel Blue",hex:"#7BA7B8"}], sizes:["Unstitched"],
    image:"assets/images/mothers/WUS26X38022.jpg",
    images:["assets/images/mothers/WUS26X38022.jpg"],
    desc:"Dusty steel blue with intricate pink flower and vine all-over print. Features cutwork sleeve detail with scallop lace trim.\nProduct Code: WUS26X38022 — You can verify this design on the original website at zellbury.com\nSize: Unstitched — cut and stitch as per your measurements.",
    specs:{Fabric:"Digital Printed Lawn",Pieces:"3-Piece",Shirt:"Digital Printed Lawn",Dupatta:"Digital Printed Lawn",Trouser:"Dyed Cambric",Type:"Unstitched",Brand:"Zellbury"}
  },
  {
    id:"WUS26X38023", name:"Warm Peach Ditsy Floral 3-Piece Lawn", category:"women", sub:"Unstitched",
    price:2790, salePrice:null, stock:10, rating:4.5, collection:"mothers26", brand:"Zellbury",
    quality:["Original","Unstitched"], featured:false, trending:false, bestseller:false, isNew:true, active:true,
    colors:[{name:"Warm Peach",hex:"#E8B89A"}], sizes:["Unstitched"],
    image:"assets/images/mothers/WUS26X38023.jpg",
    images:["assets/images/mothers/WUS26X38023.jpg"],
    desc:"Warm peach with small ditsy floral pattern and intricate banded hems. Cutwork sleeve inserts and lace cuff trim. Matching printed dupatta with tassel ends.\nProduct Code: WUS26X38023 — You can verify this design on the original website at zellbury.com\nSize: Unstitched — cut and stitch as per your measurements.",
    specs:{Fabric:"Digital Printed Lawn",Pieces:"3-Piece",Shirt:"Digital Printed Lawn",Dupatta:"Digital Printed Lawn",Trouser:"Dyed Cambric",Type:"Unstitched",Brand:"Zellbury"}
  },
  {
    id:"WUS26X38024", name:"Lime Yellow Geometric 3-Piece Lawn", category:"women", sub:"Unstitched",
    price:2790, salePrice:null, stock:10, rating:4.5, collection:"mothers26", brand:"Zellbury",
    quality:["Original","Unstitched"], featured:false, trending:false, bestseller:false, isNew:true, active:true,
    colors:[{name:"Lime Yellow",hex:"#D4E07A"}], sizes:["Unstitched"],
    image:"assets/images/mothers/WUS26X38024.jpg",
    images:["assets/images/mothers/WUS26X38024.jpg"],
    desc:"Pale lime yellow with subtle geometric self-print. Deep navy geometric bordered dupatta with cloud motif. Ring-detail lace trim on cuffs.\nProduct Code: WUS26X38024 — You can verify this design on the original website at zellbury.com\nSize: Unstitched — cut and stitch as per your measurements.",
    specs:{Fabric:"Digital Printed Lawn",Pieces:"3-Piece",Shirt:"Digital Printed Lawn",Dupatta:"Digital Printed Lawn",Trouser:"Dyed Cambric",Type:"Unstitched",Brand:"Zellbury"}
  },
  {
    id:"WUS26X38025", name:"Coral Floral 3-Piece Lawn", category:"women", sub:"Unstitched",
    price:2790, salePrice:null, stock:10, rating:4.5, collection:"mothers26", brand:"Zellbury",
    quality:["Original","Unstitched"], featured:false, trending:false, bestseller:true, isNew:true, active:true,
    colors:[{name:"Coral Orange",hex:"#E8825A"}], sizes:["Unstitched"],
    image:"assets/images/mothers/WUS26X38025.jpg",
    images:["assets/images/mothers/WUS26X38025.jpg"],
    desc:"Warm coral with a dense all-over floral print in tonal red tones. Scalloped shirt hem. Long printed dupatta with tassel ends.\nProduct Code: WUS26X38025 — You can verify this design on the original website at zellbury.com\nSize: Unstitched — cut and stitch as per your measurements.",
    specs:{Fabric:"Digital Printed Lawn",Pieces:"3-Piece",Shirt:"Digital Printed Lawn",Dupatta:"Digital Printed Lawn",Trouser:"Dyed Cambric",Type:"Unstitched",Brand:"Zellbury"}
  },
  {
    id:"WUS26X38026", name:"Aqua Mint Abstract 3-Piece Lawn", category:"women", sub:"Unstitched",
    price:2790, salePrice:null, stock:10, rating:4.5, collection:"mothers26", brand:"Zellbury",
    quality:["Original","Unstitched"], featured:false, trending:false, bestseller:false, isNew:true, active:true,
    colors:[{name:"Aqua Mint",hex:"#9DD5CF"}], sizes:["Unstitched"],
    image:"assets/images/mothers/WUS26X38026.jpg",
    images:["assets/images/mothers/WUS26X38026.jpg"],
    desc:"Light aqua mint with diamond geometric motifs and large paisley medallion at neckline. Pearl-and-berry bead trim on sleeves. Diagonal-stripe dupatta with tassel.\nProduct Code: WUS26X38026 — You can verify this design on the original website at zellbury.com\nSize: Unstitched — cut and stitch as per your measurements.",
    specs:{Fabric:"Digital Printed Lawn",Pieces:"3-Piece",Shirt:"Digital Printed Lawn",Dupatta:"Digital Printed Lawn",Trouser:"Dyed Cambric",Type:"Unstitched",Brand:"Zellbury"}
  },
  {
    id:"WUS26X38027", name:"Golden Mustard Ethnic 3-Piece Lawn", category:"women", sub:"Unstitched",
    price:2790, salePrice:null, stock:10, rating:4.5, collection:"mothers26", brand:"Zellbury",
    quality:["Original","Unstitched"], featured:true, trending:false, bestseller:false, isNew:true, active:true,
    colors:[{name:"Golden Mustard",hex:"#C9921A"}], sizes:["Unstitched"],
    image:"assets/images/mothers/WUS26X38027.jpg",
    images:["assets/images/mothers/WUS26X38027.jpg"],
    desc:"Rich golden mustard with white floral and boteh all-over print. Shell-and-fringe tassel trim on sleeves and shirt hem. Long ornate dupatta with tassel border.\nProduct Code: WUS26X38027 — You can verify this design on the original website at zellbury.com\nSize: Unstitched — cut and stitch as per your measurements.",
    specs:{Fabric:"Digital Printed Lawn",Pieces:"3-Piece",Shirt:"Digital Printed Lawn",Dupatta:"Digital Printed Lawn",Trouser:"Dyed Cambric",Type:"Unstitched",Brand:"Zellbury"}
  },
  {
    id:"WUS26X38030", name:"Off-White Blue Boteh 3-Piece Lawn", category:"women", sub:"Unstitched",
    price:2790, salePrice:null, stock:10, rating:4.5, collection:"mothers26", brand:"Zellbury",
    quality:["Original","Unstitched"], featured:false, trending:false, bestseller:false, isNew:true, active:true,
    colors:[{name:"Off-White Blue",hex:"#DAE4F0"}], sizes:["Unstitched"],
    image:"assets/images/mothers/WUS26X38030.jpg",
    images:["assets/images/mothers/WUS26X38030.jpg"],
    desc:"Crisp off-white with indigo blue all-over boteh and medallion print. Scalloped neckline and matching blue lace cuff trim. Blue border printed dupatta with fringe ends.\nProduct Code: WUS26X38030 — You can verify this design on the original website at zellbury.com\nSize: Unstitched — cut and stitch as per your measurements.",
    specs:{Fabric:"Digital Printed Lawn",Pieces:"3-Piece",Shirt:"Digital Printed Lawn",Dupatta:"Digital Printed Lawn",Trouser:"Dyed Cambric",Type:"Unstitched",Brand:"Zellbury"}
  },
  {
    id:"WUS26X38031", name:"Cream Yellow Floral 3-Piece Lawn", category:"women", sub:"Unstitched",
    price:2790, salePrice:null, stock:10, rating:4.5, collection:"mothers26", brand:"Zellbury",
    quality:["Original","Unstitched"], featured:false, trending:false, bestseller:false, isNew:true, active:true,
    colors:[{name:"Cream Yellow",hex:"#F0E4A0"}], sizes:["Unstitched"],
    image:"assets/images/mothers/WUS26X38031.jpg",
    images:["assets/images/mothers/WUS26X38031.jpg"],
    desc:"Soft cream-yellow with watercolour pink and lilac rose scatter. Round neckline with white lace trim. Gold-thread cuff band and white lace hem.\nProduct Code: WUS26X38031 — You can verify this design on the original website at zellbury.com\nSize: Unstitched — cut and stitch as per your measurements.",
    specs:{Fabric:"Digital Printed Lawn",Pieces:"3-Piece",Shirt:"Digital Printed Lawn",Dupatta:"Digital Printed Lawn",Trouser:"Dyed Cambric",Type:"Unstitched",Brand:"Zellbury"}
  },
  {
    id:"WUS26X38035", name:"Ivory Teal Motif 3-Piece Lawn", category:"women", sub:"Unstitched",
    price:2790, salePrice:null, stock:10, rating:4.5, collection:"mothers26", brand:"Zellbury",
    quality:["Original","Unstitched"], featured:false, trending:false, bestseller:false, isNew:true, active:true,
    colors:[{name:"Ivory Beige",hex:"#D8CFC0"}], sizes:["Unstitched"],
    image:"assets/images/mothers/WUS26X38035.jpg",
    images:["assets/images/mothers/WUS26X38035.jpg"],
    desc:"Warm ivory with scattered teal and grey medallion motifs. Intricate border panel at shirt hem. V-neckline with lace trim. Multi-border dupatta with tassel ends.\nProduct Code: WUS26X38035 — You can verify this design on the original website at zellbury.com\nSize: Unstitched — cut and stitch as per your measurements.",
    specs:{Fabric:"Digital Printed Lawn",Pieces:"3-Piece",Shirt:"Digital Printed Lawn",Dupatta:"Digital Printed Lawn",Trouser:"Dyed Cambric",Type:"Unstitched",Brand:"Zellbury"}
  },
];
}

// ---- Firestore-aware loader ----
// Priority: live Firestore products → otherwise the built-in seed catalog
// merged with any local admin edits (so the admin panel controls the public
// site even before Firebase is connected).
//
// PERFORMANCE NOTE: this site is multi-page (not a single-page app), so
// without a cache, every single page navigation (home → women → a product
// → cart …) was re-downloading the ENTIRE product catalog from Firestore
// from scratch. That was the single biggest cause of the site feeling slow.
// We now cache the result in sessionStorage for a short window, so repeat
// navigations within the same visit reuse it instantly instead of waiting
// on a fresh network round trip every time. It still refreshes automatically
// after CATALOG_TTL_MS, so admin edits show up quickly without needing a
// hard refresh.
const CATALOG_KEY = "lx-catalog-cache";
const CATALOG_TTL_MS = 60 * 1000; // 60s — long enough to skip repeat fetches while browsing, short enough to stay fresh

function readCatalogCache() {
  try {
    const raw = sessionStorage.getItem(CATALOG_KEY);
    if (!raw) return null;
    const { ts, products } = JSON.parse(raw);
    if (!ts || Date.now() - ts > CATALOG_TTL_MS) return null;
    return products;
  } catch { return null; }
}
function writeCatalogCache(products) {
  try { sessionStorage.setItem(CATALOG_KEY, JSON.stringify({ ts: Date.now(), products })); }
  catch { /* storage full or unavailable — safe to skip caching */ }
}

export async function loadProducts() {
  if (_cache) return _cache;

  const cached = readCatalogCache();
  if (cached) {
    _cache = cached;
    wireSearch();
    return _cache;
  }

  try {
    const { db, collection, getDocs } = await import("./firebase.js");
    const snap = await getDocs(collection(db, "products"));
    if (!snap.empty) {
      const live = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        .filter((p) => p.active !== false)
        .map(normalize);
      _cache = live;
      writeCatalogCache(live);
      wireSearch();
      return live;
    }
  } catch (e) {
    // Firebase not configured yet — fall through to seed + local admin edits.
    console.info("AMEER OFFICIAL: using local catalog (Firebase not configured yet).");
  }
  _cache = mergeLocal(SEED).filter((p) => p.active !== false).map(normalize);
  wireSearch();
  return _cache;
}

// Merge the built-in seed catalog with local admin changes stored in the browser.
// lx-admin-products holds: { edits:{id:patch}, added:[product], removed:[id] }
function mergeLocal(seed) {
  let store;
  try { store = JSON.parse(localStorage.getItem("lx-admin-products")) || {}; }
  catch { store = {}; }
  const edits = store.edits || {};
  const added = store.added || [];
  const removed = new Set(store.removed || []);

  let list = seed.map((p) => (edits[p.id] ? { ...p, ...edits[p.id] } : p));
  list = list.filter((p) => !removed.has(p.id));
  return [...added, ...list];
}

// let the admin invalidate the public-site cache after edits
export function clearProductCache() { _cache = null; }

function normalize(p) {
  const images = p.images && p.images.length ? p.images : [p.image || placeholder(p.id)];
  return {
    ...p,
    images,
    image: p.image || images[0],
    salePrice: p.salePrice || null,
    colors: p.colors || [{ name: "Black", hex: "#111" }],
    sizes: p.sizes || ["S", "M", "L"],
  };
}

export async function getProduct(id) {
  const all = await loadProducts();
  return all.find((p) => p.id === id) || null;
}

// Admin-facing: every product including inactive/disabled ones (for the dashboard).
export async function loadAllForAdmin() {
  try {
    const { db, collection, getDocs } = await import("./firebase.js");
    const snap = await getDocs(collection(db, "products"));
    if (!snap.empty) return snap.docs.map((d) => ({ id: d.id, ...d.data() })).map(normalize);
  } catch {}
  return mergeLocal(SEED).map(normalize);
}
export { SEED as SEED_CATALOG };
export async function byCategory(cat) {
  const all = await loadProducts();
  const want = String(cat || "").toLowerCase();
  return want === "all" ? all : all.filter((p) => String(p.category || "").toLowerCase() === want);
}
export async function featured() { return (await loadProducts()).filter((p) => p.featured); }
export async function trending() { return (await loadProducts()).filter((p) => p.trending); }
export async function bestsellers() { return (await loadProducts()).filter((p) => p.bestseller); }
export async function newArrivals() {
  return (await loadProducts())
    .filter((p) => p.isNew)
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
}

// expose a search fn for the navbar autocomplete
function wireSearch() {
  window.__lxSearch = async (q) => {
    const all = await loadProducts();
    return all.filter((p) =>
      (p.name + " " + p.category + " " + (p.sub||"") + " " + p.colors.map(c=>c.name).join(" "))
        .toLowerCase().includes(q));
  };
}

export const CATEGORIES = {
  women: ["Unstitched","Stitched","Kurtis","Shalwar Kameez","Lawn","Formals","Party Wear","Abayas","Hijabs","Accessories"],
  men: ["Shirts","T-Shirts","Kurtas","Shalwar Kameez","Waistcoats","Trousers","Accessories"],
  kids: ["Girls","Boys","Babies","Accessories"]
};
