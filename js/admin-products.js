import { requireAdmin, renderAdminShell } from "./admin-guard.js";
import { adminListProducts, adminSaveProduct, adminDeleteProduct, adminDuplicateProduct, uploadImage, listCategories, cloudinaryReady,
         listBrands, saveBrand, listQualities, saveQuality, deleteQuality } from "./admin-data.js";
import { money, esc, toast, optimizeImg } from "./utils.js";
import { CATEGORIES } from "./products.js";

let products = [], categories = [], editing = null, workImages = [], workColors = [], workSizes = [];
let brands = [], qualities = [], workQuality = [];

(async function () {
  const user = await requireAdmin(); if (!user) return;
  const body = renderAdminShell("products", user);
  categories = await listCategories();

  body.innerHTML = `
    <div class="ad-h">
      <div><h1>Products</h1><p>Add, edit and manage everything shown on the storefront</p></div>
      <button class="btn btn-primary" id="newBtn">+ New product</button>
    </div>
    <div class="ad-toolbar">
      <input class="ad-search" id="search" placeholder="Search products…">
      <select class="ad-select" id="catFilter"><option value="">All categories</option>
        <option value="women">Women</option><option value="men">Men</option><option value="kids">Kids</option></select>
      <select class="ad-select" id="statusFilter"><option value="">All status</option>
        <option value="active">Active</option><option value="disabled">Disabled</option></select>
    </div>
    <div class="ad-panel" style="padding:0;overflow-x:auto">
      <table class="ad-table"><thead><tr>
        <th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Tags</th><th>Status</th><th>Actions</th>
      </tr></thead><tbody id="rows"></tbody></table>
    </div>`;

  document.getElementById("newBtn").onclick = () => openEditor(null);
  document.getElementById("search").oninput = renderRows;
  document.getElementById("catFilter").onchange = renderRows;
  document.getElementById("statusFilter").onchange = renderRows;

  await reload();
})();

async function reload() { products = await adminListProducts(); renderRows(); }

function renderRows() {
  const q = (document.getElementById("search").value || "").toLowerCase();
  const cat = document.getElementById("catFilter").value;
  const st = document.getElementById("statusFilter").value;
  let list = products.filter((p) =>
    (!q || (p.name + p.sub + p.category).toLowerCase().includes(q)) &&
    (!cat || p.category === cat) &&
    (!st || (st === "active" ? p.active !== false : p.active === false)));

  document.getElementById("rows").innerHTML = list.map((p) => {
    const tags = [p.featured && "Featured", p.trending && "Trending", p.bestseller && "Best", p.isNew && "New"].filter(Boolean);
    return `<tr>
      <td class="prod-cell"><img class="thumb" src="${esc(optimizeImg(p.image, 150))}" alt=""><b>${esc(p.name)}</b></td>
      <td>${esc(p.category)}<br><span class="muted" style="font-size:.78rem">${esc(p.sub || "")}</span></td>
      <td>${p.salePrice ? `<b>${money(p.salePrice)}</b> <span class="muted" style="text-decoration:line-through">${money(p.price)}</span>` : money(p.price)}</td>
      <td>${p.stock ?? 0}</td>
      <td>${tags.map((t) => `<span class="pill feat">${t}</span>`).join(" ") || "—"}</td>
      <td><span class="pill ${p.active === false ? "off" : "on"}">${p.active === false ? "Disabled" : "Active"}</span></td>
      <td><div class="t-actions">
        <button class="mini-btn" data-act="edit" data-id="${esc(p.id)}">Edit</button>
        <button class="mini-btn gold" data-act="toggle" data-id="${esc(p.id)}">${p.active === false ? "Enable" : "Disable"}</button>
        <button class="mini-btn" data-act="dup" data-id="${esc(p.id)}">Duplicate</button>
        <button class="mini-btn danger" data-act="del" data-id="${esc(p.id)}">Delete</button>
      </div></td>
    </tr>`;
  }).join("") || `<tr class="empty-row"><td colspan="7">No products match.</td></tr>`;

  document.getElementById("rows").querySelectorAll("[data-act]").forEach((b) => {
    b.onclick = () => rowAction(b.dataset.act, b.dataset.id);
  });
}

async function rowAction(act, id) {
  const p = products.find((x) => x.id === id);
  if (act === "edit") return openEditor(p);
  if (act === "dup") { await adminDuplicateProduct(p); toast("Product duplicated ✦", "ok"); return reload(); }
  if (act === "toggle") { await adminSaveProduct({ id: p.id, active: !(p.active === false) ? false : true }); toast(p.active === false ? "Enabled" : "Disabled"); return reload(); }
  if (act === "del") return confirmDelete(p);
}

// In-site confirmation modal (replaces the browser's confirm popup)
function confirmDelete(p) {
  const box = document.getElementById("modalBox");
  box.innerHTML = `
    <div style="text-align:center;padding:8px 4px">
      <div style="width:56px;height:56px;border-radius:50%;background:#fbe6e6;display:grid;place-items:center;margin:0 auto 18px">
        <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="#b23838" stroke-width="1.8"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>
      </div>
      <h2 style="margin-bottom:8px">Delete this product?</h2>
      <p class="muted" style="margin-bottom:24px"><b>${esc(p.name)}</b> will be permanently removed from your storefront. This can't be undone.</p>
      <div style="display:flex;gap:12px">
        <button class="btn btn-line" id="delCancel" style="flex:1">Cancel</button>
        <button class="btn btn-primary" id="delConfirm" style="flex:1;background:#b23838">Delete product</button>
      </div>
    </div>`;
  document.getElementById("modalBg").classList.add("open");
  document.getElementById("delCancel").onclick = closeModal;
  document.getElementById("delConfirm").onclick = async () => {
    const btn = document.getElementById("delConfirm");
    btn.disabled = true; btn.textContent = "Deleting…";
    // optimistic: remove from view immediately so it feels instant
    products = products.filter((x) => x.id !== p.id);
    renderRows();
    closeModal();
    toast("Product deleted");
    try { await adminDeleteProduct(p.id); }
    catch (e) { toast("Delete failed — refreshing", "err"); await reload(); }
  };
}

/* ---------- editor modal ---------- */
function openEditor(p) {
  editing = p;
  workImages = p?.images ? [...p.images] : [];
  workColors = p?.colors ? p.colors.map((c) => ({ ...c })) : [];
  workSizes = p?.sizes ? [...p.sizes] : [];
  const subs = CATEGORIES[String(p?.category || "women").toLowerCase()] || [];

  const box = document.getElementById("modalBox");
  box.innerHTML = `
    <span class="close-x" id="closeX">×</span>
    <h2>${p ? "Edit product" : "New product"}</h2>
    <div class="ad-form-grid">
      <div class="field full"><label>Name</label><input id="e-name" value="${esc(p?.name || "")}"></div>
      <div class="field"><label>Category</label><select id="e-cat">
        ${["women","men","kids"].map((c) => `<option value="${c}" ${p?.category === c ? "selected" : ""}>${c[0].toUpperCase()+c.slice(1)}</option>`).join("")}
      </select></div>
      <div class="field"><label>Sub-category</label><select id="e-sub"></select></div>

      <div class="field full">
        <label>Brand</label>
        <div style="display:flex;gap:8px;align-items:center">
          <select id="e-brand" style="flex:1"></select>
          <button type="button" class="mini-btn gold" id="showAddBrand">+ Add brand</button>
        </div>
        <div id="addBrandRow" style="display:none;gap:8px;margin-top:8px">
          <input id="newBrand" placeholder="New brand name" style="flex:1;padding:9px 12px;border:1.5px solid var(--line-strong);border-radius:8px;background:var(--surface);color:var(--ink)">
          <button type="button" class="mini-btn" id="saveNewBrand">Save</button>
          <button type="button" class="mini-btn" id="cancelNewBrand">Cancel</button>
        </div>
      </div>

      <div class="field full">
        <label>Type <span style="font-weight:400;color:var(--ink-soft);font-size:.8rem">— pick from the dropdown, tap × to remove</span></label>
        <div class="chips-input" id="qualityTags" style="margin-bottom:8px"></div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <select id="qualityPicker" style="flex:1;min-width:180px;padding:9px 12px;border:1.5px solid var(--line-strong);border-radius:8px;background:var(--surface);color:var(--ink)">
            <option value="">+ Select a type to add…</option>
          </select>
          <button type="button" class="mini-btn gold" id="showAddQuality">+ New option</button>
          <button type="button" class="mini-btn" id="toggleManageQuality">Manage list</button>
        </div>
        <div id="addQualityRow" style="display:none;gap:8px;margin-top:8px">
          <input id="newQuality" placeholder="e.g. Semi-Stitched" style="flex:1;padding:9px 12px;border:1.5px solid var(--line-strong);border-radius:8px;background:var(--surface);color:var(--ink)">
          <button type="button" class="mini-btn" id="saveNewQuality">Save</button>
          <button type="button" class="mini-btn" id="cancelNewQuality">Cancel</button>
        </div>
        <div id="manageQualityList" style="display:none;flex-direction:column;gap:6px;margin-top:10px;padding:10px;border:1px solid var(--line);border-radius:8px"></div>
      </div>

      <div class="field"><label>Price (Rs)</label><input id="e-price" type="number" min="0" step="0.01" value="${p?.price ?? ""}"></div>
      <div class="field"><label>Sale price (Rs, optional)</label><input id="e-sale" type="number" min="0" step="0.01" value="${p?.salePrice ?? ""}"></div>
      <div class="field"><label>Stock</label><input id="e-stock" type="number" min="0" value="${p?.stock ?? 0}"></div>
      <div class="field"><label>Rating</label><input id="e-rating" type="number" min="0" max="5" step="0.1" value="${p?.rating ?? 4.6}"></div>
      <div class="field full"><label>Description</label><textarea id="e-desc" rows="3">${esc(p?.desc || "")}</textarea></div>
    </div>

    <div class="field full"><label>Colours</label>
      <div id="colorList"></div>
      <div class="color-row">
        <input type="color" id="newColorHex" value="#111111">
        <input id="newColorHexText" value="#111111" maxlength="7" spellcheck="false"
               placeholder="#111111" aria-label="Hex colour code"
               style="width:104px;padding:9px 10px;border:1.5px solid var(--line-strong);border-radius:8px;background:var(--surface);color:var(--ink);font-family:ui-monospace,monospace;text-transform:lowercase">
        <div class="combo-wrap">
          <input id="newColorName" placeholder="Type a colour name, or pick one →" style="padding:9px 12px;border:1.5px solid var(--line-strong);background:var(--surface);color:var(--ink);width:100%">
          <button type="button" class="combo-arrow" id="colorArrow" aria-label="Choose from preset colours"><svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg></button>
          <div class="combo-panel" id="colorPanel"></div>
        </div>
        <button class="mini-btn" id="addColor">Add</button>
      </div>
    </div>

    <div class="field full"><label>Sizes</label>
      <div class="chips-input" id="sizeList"></div>
      <div style="display:flex;gap:8px;margin-top:8px">
        <div class="combo-wrap">
          <input id="newSize" placeholder="Type a size, or pick one →" style="padding:9px 12px;border:1.5px solid var(--line-strong);background:var(--surface);color:var(--ink);width:100%">
          <button type="button" class="combo-arrow" id="sizeArrow" aria-label="Choose from preset sizes"><svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg></button>
          <div class="combo-panel" id="sizePanel"></div>
        </div>
        <button class="mini-btn" id="addSize">Add</button>
      </div>
    </div>

    <div class="field full"><label>Images</label>
      <div class="img-drop" id="imgDrop">Click to upload images (or paste an image URL below)</div>
      <input type="file" id="imgFile" accept="image/*" multiple hidden>
      <div style="display:flex;gap:8px;margin-top:8px"><input id="imgUrl" placeholder="https://image-url.jpg" style="flex:1;padding:9px 12px;border:1.5px solid var(--line-strong);border-radius:8px;background:var(--surface);color:var(--ink)"><button class="mini-btn" id="addUrl">Add URL</button></div>
      <div class="img-previews" id="imgPreviews"></div>
    </div>

    <div class="field full"><label>Tags</label>
      <div style="display:flex;gap:16px;flex-wrap:wrap">
        <label><input type="checkbox" id="e-featured" ${p?.featured ? "checked" : ""}> Featured</label>
        <label><input type="checkbox" id="e-trending" ${p?.trending ? "checked" : ""}> Trending</label>
        <label><input type="checkbox" id="e-best" ${p?.bestseller ? "checked" : ""}> Best seller</label>
        <label><input type="checkbox" id="e-new" ${p?.isNew ? "checked" : ""}> New arrival</label>
      </div>
    </div>

    <div style="display:flex;gap:12px;margin-top:22px">
      <button class="btn btn-line" id="cancelBtn">Cancel</button>
      <button class="btn btn-primary" id="saveBtn" style="flex:1">${p ? "Save changes" : "Create product"}</button>
    </div>`;

  document.getElementById("modalBg").classList.add("open");
  fillSubs(p?.category || "women", p?.sub);
  renderColors(); renderSizes(); renderImages();
  workQuality = Array.isArray(p?.quality) ? [...p.quality] : [];
  loadBrandAndQuality(p?.brand);

  document.getElementById("e-cat").onchange = (e) => fillSubs(e.target.value);
  document.getElementById("closeX").onclick = closeModal;
  document.getElementById("cancelBtn").onclick = closeModal;
  // ---- hex field <-> swatch, kept in sync both ways ----
  const swatch = document.getElementById("newColorHex");
  const hexText = document.getElementById("newColorHexText");

  // Accepts "1b4b5a", "#1b4b5a", "#abc" — the # and 3-digit shorthand are
  // what people actually paste. Returns a full #rrggbb, or "" if it isn't
  // a colour yet (which is normal: it's called on every keystroke).
  const readHex = (raw) => {
    let v = String(raw || "").trim().replace(/^#/, "").toLowerCase();
    if (/^[0-9a-f]{3}$/.test(v)) v = v.split("").map((c) => c + c).join("");
    return /^[0-9a-f]{6}$/.test(v) ? "#" + v : "";
  };

  hexText.oninput = () => {
    const hex = readHex(hexText.value);
    // A half-typed hex isn't an error, so only go red once it's clearly
    // not going anywhere — 6+ characters in and still not valid.
    const typing = hexText.value.replace(/^#/, "").length < 6;
    hexText.style.borderColor = hex || typing ? "var(--line-strong)" : "#c62828";
    if (hex) swatch.value = hex;   // live: circle follows what you type
  };

  // Tidy up when they leave the field: add the #, or put back the colour
  // that's actually in the circle if what they typed was nonsense.
  hexText.onblur = () => {
    const hex = readHex(hexText.value);
    hexText.value = hex || swatch.value;
    hexText.style.borderColor = "var(--line-strong)";
  };

  hexText.onkeydown = (e) => { if (e.key === "Enter") { e.preventDefault(); hexText.blur(); } };

  // Clicking the circle and using the OS picker writes back to the field.
  swatch.oninput = () => { hexText.value = swatch.value; hexText.style.borderColor = "var(--line-strong)"; };

  document.getElementById("addColor").onclick = () => {
    const name = document.getElementById("newColorName").value.trim();
    const hex = readHex(hexText.value) || swatch.value;
    if (!name) { toast("Colour needs a name", "err"); return; }
    workColors.push({ name, hex });
    document.getElementById("newColorName").value = "";
    renderColors();
  };
 document.getElementById("addSize").onclick = () => {
  const s = document.getElementById("newSize").value.trim();

  if (!s) return;

  if (s === "Unstitched") {
    workSizes = ["Unstitched"];
  } else {
    workSizes = workSizes.filter(x => x !== "Unstitched");

    if (!workSizes.includes(s)) {
      workSizes.push(s);
    }
  }

  document.getElementById("newSize").value = "";
  renderSizes();
};
  document.getElementById("imgDrop").onclick = () => document.getElementById("imgFile").click();
  document.getElementById("imgFile").onchange = onFiles;
  document.getElementById("addUrl").onclick = () => {
    const u = document.getElementById("imgUrl").value.trim();
    if (u) { workImages.push(u); document.getElementById("imgUrl").value = ""; renderImages(); }
  };
  wireBrandQuality();
  document.getElementById("saveBtn").onclick = save;

  wireCombo({
    arrowId: "colorArrow", panelId: "colorPanel",
    buildPanel: () => colorPanelHTML(),
    onPick: (el) => {
      const name = el.dataset.name, hex = el.dataset.hex;
      document.getElementById("newColorName").value = name;
      document.getElementById("newColorHex").value = hex;
      document.getElementById("newColorHexText").value = hex;
    }
  });
 wireCombo({
  arrowId: "sizeArrow",
  panelId: "sizePanel",
  buildPanel: () => sizePanelHTML(),
  onPick: (el) => {
    const size = el.dataset.name;

    if (size === "Unstitched") {
      workSizes = ["Unstitched"];
      renderSizes();
      document.getElementById("newSize").value = "";
      return;
    }

    document.getElementById("newSize").value = size;
  }
});
}

/* ---------- preset colour / size picker (dropdown combobox) ---------- */
const PRESET_COLORS = [
  { name: "Black", hex: "#111111" }, { name: "White", hex: "#ffffff" },
  { name: "Ivory", hex: "#efe9dd" }, { name: "Beige", hex: "#d9c7a3" },
  { name: "Charcoal", hex: "#333333" }, { name: "Grey", hex: "#8a8a8a" },
  { name: "Navy", hex: "#1b2a4a" }, { name: "Sky Blue", hex: "#a9c9e0" },
  { name: "Maroon", hex: "#6b1f2a" }, { name: "Wine", hex: "#722f37" },
  { name: "Rust", hex: "#a4501f" }, { name: "Mustard", hex: "#c9a227" },
  { name: "Gold", hex: "#b8985a" }, { name: "Olive", hex: "#6b6b3a" },
  { name: "Emerald", hex: "#12503a" }, { name: "Rose Pink", hex: "#e8b4bc" }
];
const PRESET_SIZES = {
  "Unstitched": ["Unstitched"],
  "Clothing": ["XS","S","M","L","XL","XXL"],
  "Waist / numeric": ["28","30","32","34","36","38","40","42"],
  "Kids (age)": ["0-3m","3-6m","6-12m","1-2y","2-3y","3-4y","4-5y","5-6y","6-7y","7-8y"]
};

function colorPanelHTML() {
  return PRESET_COLORS.map((c) =>
    `<div class="combo-opt" data-name="${esc(c.name)}" data-hex="${esc(c.hex)}">
      <span class="swatch" style="background:${esc(c.hex)}"></span>${esc(c.name)}
    </div>`).join("");
}
function sizePanelHTML() {
  return Object.entries(PRESET_SIZES).map(([group, sizes]) =>
    `<div class="combo-group-label">${esc(group)}</div>` +
    sizes.map((s) => `<div class="combo-opt" data-name="${esc(s)}">${esc(s)}</div>`).join("")
  ).join("");
}

// generic wiring for an input+arrow+panel combobox: click arrow to toggle,
// click an option to fill the field (admin can still type freely, or edit
// the picked value before hitting Add), click outside to close.
function wireCombo({ arrowId, panelId, buildPanel, onPick }) {
  const arrow = document.getElementById(arrowId);
  const panel = document.getElementById(panelId);
  arrow.onclick = (e) => {
    e.stopPropagation();
    const willOpen = !panel.classList.contains("open");
    document.querySelectorAll(".combo-panel.open").forEach((p) => p.classList.remove("open"));
    document.querySelectorAll(".combo-arrow.open").forEach((a) => a.classList.remove("open"));
    if (willOpen) {
      panel.innerHTML = buildPanel();
      panel.classList.add("open");
      arrow.classList.add("open");
      panel.querySelectorAll(".combo-opt").forEach((opt) => {
        opt.onclick = (ev) => {
          ev.stopPropagation();
          onPick(opt);
          panel.classList.remove("open");
          arrow.classList.remove("open");
        };
      });
    }
  };
  document.addEventListener("click", () => {
    panel.classList.remove("open");
    arrow.classList.remove("open");
  });
}

function fillSubs(cat, selected) {
  document.getElementById("e-sub").innerHTML = (CATEGORIES[String(cat || "women").toLowerCase()] || []).map((s) =>
    `<option value="${esc(s)}" ${s === selected ? "selected" : ""}>${esc(s)}</option>`).join("");
}
function renderColors() {
  document.getElementById("colorList").innerHTML = workColors.map((c, i) =>
    `<div class="color-row"><span style="width:28px;height:28px;border-radius:50%;background:${esc(c.hex)};border:1px solid var(--line)"></span> ${esc(c.name)} <button class="mini-btn danger" data-i="${i}">Remove</button></div>`).join("");
  document.getElementById("colorList").querySelectorAll("[data-i]").forEach((b) =>
    b.onclick = () => { workColors.splice(+b.dataset.i, 1); renderColors(); });
}
function renderSizes() {
  document.getElementById("sizeList").innerHTML = workSizes.map((s, i) =>
    `<span class="chip-tag">${esc(s)} <button data-i="${i}">×</button></span>`).join("");
  document.getElementById("sizeList").querySelectorAll("[data-i]").forEach((b) =>
    b.onclick = () => { workSizes.splice(+b.dataset.i, 1); renderSizes(); });
}
function renderImages() {
  document.getElementById("imgPreviews").innerHTML = workImages.map((src, i) =>
    `<div class="img-prev"><img src="${esc(src)}" alt=""><button data-i="${i}">×</button></div>`).join("");
  document.getElementById("imgPreviews").querySelectorAll("[data-i]").forEach((b) =>
    b.onclick = () => { workImages.splice(+b.dataset.i, 1); renderImages(); });
}
async function onFiles(e) {
  const files = [...e.target.files];
  if (!files.length) return;
  const hosted = await cloudinaryReady();
  toast(hosted ? "Uploading image…" : "Adding image…");
  for (const f of files) {
    if (!/^image\//.test(f.type)) { toast(`"${f.name}" isn't an image`, "err"); continue; }
    // Without Cloudinary, photos are embedded in the product itself and must stay small.
    const cap = hosted ? 8 * 1024 * 1024 : 600 * 1024;
    if (f.size > cap) {
      toast(hosted
        ? `"${f.name}" is too large (max 8MB)`
        : `"${f.name}" is too large. Set up Cloudinary to upload big photos, or paste an image URL.`, "err");
      continue;
    }
    try { const url = await uploadImage(f); workImages.push(url); renderImages(); }
    catch (err) { toast("Couldn't add that image", "err"); }
  }
  e.target.value = "";
}

async function save() {
  const name = document.getElementById("e-name").value.trim();
  const price = parseFloat(document.getElementById("e-price").value);
  if (!name) { toast("Please enter a name", "err"); return; }
  if (isNaN(price)) { toast("Please enter a price", "err"); return; }

  const sale = parseFloat(document.getElementById("e-sale").value);
  const product = {
    id: editing?.id,
    name,
    category: document.getElementById("e-cat").value,
    sub: document.getElementById("e-sub").value,
    brand: document.getElementById("e-brand").value || null,
    quality: [...workQuality],
    price,
    salePrice: isNaN(sale) ? null : sale,
    stock: parseInt(document.getElementById("e-stock").value) || 0,
    rating: parseFloat(document.getElementById("e-rating").value) || 4.6,
    desc: document.getElementById("e-desc").value.trim(),
    colors: workColors.length ? workColors : [{ name: "Black", hex: "#111111" }],
    sizes: [...workSizes],
    images: workImages.length ? workImages : undefined,
    image: workImages[0] || editing?.image,
    featured: document.getElementById("e-featured").checked,
    trending: document.getElementById("e-trending").checked,
    bestseller: document.getElementById("e-best").checked,
    isNew: document.getElementById("e-new").checked,
    active: editing?.active !== false,
    // Only set once, on the product's first save — this is what lets New
    // Arrivals show whichever "New"-flagged items were actually added most
    // recently, instead of whatever arbitrary order Firestore returns them
    // in. Editing an existing product later keeps its original date.
    createdAt: editing?.createdAt || new Date().toISOString()
  };

  const btn = document.getElementById("saveBtn");
  const restore = () => { btn.disabled = false; btn.textContent = editing ? "Save changes" : "Create product"; };

  // Firestore caps a document at ~1MB. Without Cloudinary, photos are embedded
  // as base64 inside the product, so a few of them will blow past that limit.
  // Catch it here with a clear message instead of a raw Firestore error.
  const imgBytes = (product.images || []).join("").length;
  if (imgBytes > 900000) {
    toast("Those images are too large to save together. Set up Cloudinary, or paste image URLs instead of uploading files.", "err");
    return;
  }

  btn.disabled = true; btn.textContent = "Saving…";
  try {
    await adminSaveProduct(product);
    toast("Saved — now live on the storefront ✦", "ok");
    closeModal();
    await reload();
  } catch (e) {
    const tooBig = /longer than|exceeds maximum|1048487|invalid-argument/i.test(e.message || "");
    toast(tooBig
      ? "Those images are too large to save. Paste image URLs instead of uploading files, or set up Cloudinary."
      : (e.message || "Save failed"), "err");
    restore();
  }
}

/* ---------- brand + type (admin-editable lists) ---------- */
// Firestore's "permission-denied" is the one people actually hit, and its
// raw message explains nothing. Name the likely cause instead.
function saveErrorText(e, what) {
  const code = e?.code || "";
  if (code.includes("permission-denied")) {
    return `Not allowed to save that ${what} — your admin email may not be verified.`;
  }
  if (code.includes("unavailable") || code.includes("network")) {
    return `Couldn't reach the database — check your connection and try again.`;
  }
  return e?.message || `Couldn't save that ${what}.`;
}

async function loadBrandAndQuality(selectedBrand) {
  [brands, qualities] = await Promise.all([listBrands(), listQualities()]);
  renderBrandSelect(selectedBrand);
  renderQuality();
}
function renderBrandSelect(selected) {
  const el = document.getElementById("e-brand");
  if (!el) return;
  const list = [...brands].sort((a, b) => (a.order || 0) - (b.order || 0));
  el.innerHTML = `<option value="">— none —</option>` + list.map((b) =>
    `<option value="${esc(b.name)}" ${b.name === selected ? "selected" : ""}>${esc(b.name)}</option>`).join("");
}
function renderQuality() {
  renderQualityTags();
  renderQualityPicker();
  renderManageQuality();
}
// Selected values for THIS product, shown as removable tags (tap × to remove).
function renderQualityTags() {
  const el = document.getElementById("qualityTags");
  if (!el) return;
  el.innerHTML = workQuality.length
    ? workQuality.map((name, i) =>
        `<span class="chip-tag">${esc(name)} <button type="button" data-i="${i}">×</button></span>`).join("")
    : `<span class="muted" style="font-size:.85rem">No type selected yet — add one below.</span>`;
  el.querySelectorAll("[data-i]").forEach((b) =>
    b.onclick = () => { workQuality.splice(+b.dataset.i, 1); renderQuality(); });
}
// Dropdown of everything NOT already picked. Deduped by name so duplicate
// saved docs (e.g. several "MASTER COPY" entries) only show up once here.
function renderQualityPicker() {
  const el = document.getElementById("qualityPicker");
  if (!el) return;
  const unique = [...new Map(qualities.map((q) => [q.name.toLowerCase(), q])).values()]
    .sort((a, b) => (a.order || 0) - (b.order || 0));
  const available = unique.filter((q) => !workQuality.includes(q.name));
  el.innerHTML = `<option value="">+ Select a type to add…</option>` +
    available.map((q) => `<option value="${esc(q.name)}">${esc(q.name)}</option>`).join("");
  el.onchange = () => {
    if (el.value && !workQuality.includes(el.value)) workQuality.push(el.value);
    el.value = "";
    renderQuality();
  };
}
// Full, un-deduped list with a Remove button per saved doc — this is what
// lets you clear out duplicate/junk options (like repeated "MASTER COPY")
// from the master list once and for all.
function renderManageQuality() {
  const el = document.getElementById("manageQualityList");
  if (!el) return;
  const list = [...qualities].sort((a, b) => (a.order || 0) - (b.order || 0));
  el.innerHTML = list.length
    ? list.map((q) =>
        `<div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
           <span>${esc(q.name)}</span>
           <button type="button" class="mini-btn danger" data-del="${esc(q.id)}">Remove</button>
         </div>`).join("")
    : `<span class="muted" style="font-size:.85rem">No saved options yet.</span>`;
  el.querySelectorAll("[data-del]").forEach((b) => b.onclick = async () => {
    const id = b.dataset.del;
    const q = qualities.find((x) => x.id === id);
    if (!q) return;
    if (!confirm(`Remove "${q.name}" from the Type list? This won't affect products that already use it.`)) return;
    await deleteQuality(id);
    qualities = qualities.filter((x) => x.id !== id);
    renderQuality();
    toast(`Removed "${q.name}"`);
  });
}
function wireBrandQuality() {
  const toggle = (rowId, show) => { const r = document.getElementById(rowId); if (r) r.style.display = show ? "flex" : "none"; };

  document.getElementById("showAddBrand").onclick = () => { toggle("addBrandRow", true); document.getElementById("newBrand").focus(); };
  document.getElementById("cancelNewBrand").onclick = () => toggle("addBrandRow", false);
  document.getElementById("saveNewBrand").onclick = async () => {
    const name = document.getElementById("newBrand").value.trim();
    if (!name) { toast("Enter a brand name", "err"); return; }
    if (brands.some((b) => b.name.toLowerCase() === name.toLowerCase())) { toast("That brand already exists", "err"); return; }
    // Without this catch a rejected write (usually a Firestore permissions
    // error) just kills the handler: no toast, no console trace, the button
    // does nothing and the brand quietly never saves.
    try {
      await saveBrand({ name, order: brands.length + 1 });
      brands = await listBrands();
    } catch (e) {
      console.error("saveBrand failed:", e);
      toast(saveErrorText(e, "brand"), "err");
      return;
    }
    renderBrandSelect(name);
    document.getElementById("newBrand").value = "";
    toggle("addBrandRow", false);
    toast(`Brand "${name}" added ✦`, "ok");
  };

  document.getElementById("toggleManageQuality").onclick = () => {
    const box = document.getElementById("manageQualityList");
    box.style.display = box.style.display === "flex" ? "none" : "flex";
  };
  document.getElementById("showAddQuality").onclick = () => { toggle("addQualityRow", true); document.getElementById("newQuality").focus(); };
  document.getElementById("cancelNewQuality").onclick = () => toggle("addQualityRow", false);
  document.getElementById("saveNewQuality").onclick = async () => {
    const name = document.getElementById("newQuality").value.trim();
    if (!name) { toast("Enter an option name", "err"); return; }
    if (qualities.some((q) => q.name.toLowerCase() === name.toLowerCase())) { toast("That option already exists", "err"); return; }
    try {
      await saveQuality({ name, order: qualities.length + 1 });
      qualities = await listQualities();
    } catch (e) {
      console.error("saveQuality failed:", e);
      toast(saveErrorText(e, "option"), "err");
      return;
    }
    if (!workQuality.includes(name)) workQuality.push(name);
    renderQuality();
    document.getElementById("newQuality").value = "";
    toggle("addQualityRow", false);
    toast(`Option "${name}" added ✦`, "ok");
  };
}

function closeModal() { document.getElementById("modalBg").classList.remove("open"); }
document.getElementById("modalBg").addEventListener("click", (e) => { if (e.target.id === "modalBg") closeModal(); });
