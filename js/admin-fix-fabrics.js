// ============================================================
// AMEER OFFICIAL — fabric catalogue fixer
//
// The first import (admin-import-fabrics.js) matched photos to colours
// by best guess, and several came out wrong — the photos are folded /
// plastic-wrapped fabric bolts where the actual colour often isn't
// reliably readable from the picture, only the brand tag is.
//
// This page is the honest fix: it lists all 36 imported products with
// their actual photo, and lets you correct the brand + colour by eye
// (you can see the real fabric, we can't). Saving a row also:
//   - sets stock to 10
//   - rewrites the product name WITHOUT the brand in it (brand stays
//     only in the Brand field/category, not duplicated in the title)
//
// Throwaway page — delete admin/fix-fabrics.html and this file once
// you're done correcting the 36 products.
// ============================================================
import { requireAdmin, renderAdminShell } from "./admin-guard.js";
import { adminListProducts, adminSaveProduct } from "./admin-data.js";
import { esc, toast } from "./utils.js";

const FABRIC_BY_BRAND = {
  "Markhor": "Premium Egyptian Cotton",
  "Glorious (Brilliant)": "Egyptian Cotton",
  "Glorious (Lord)": "Egyptian Cotton",
};
const BRANDS = Object.keys(FABRIC_BY_BRAND);

function buildName(color, brand) {
  const fabric = FABRIC_BY_BRAND[brand] || "Egyptian Cotton";
  return `${color} — ${fabric} Unstitched`;
}

function buildDesc(color, brand, hex) {
  const fabric = FABRIC_BY_BRAND[brand] || "Egyptian Cotton";
  const swatch = hex ? ` (swatch ${hex})` : "";
  return `${fabric} unstitched shalwar kameez fabric in ${color}.\n\n`
    + `- 4.5 metre: Rs. 6500\n- 5.5 metre: Rs. 8000\n\n`
    + `Colour shown: ${color}${swatch}.`;
}

(async function () {
  const user = await requireAdmin(); if (!user) return;
  const body = renderAdminShell("products", user);

  body.innerHTML = `
    <style>
      .fx-wrap{max-width:1000px}
      .fx-note{background:var(--surface);border-left:3px solid var(--gold);
               padding:12px 16px;border-radius:8px;margin:14px 0;line-height:1.6;font-size:.9rem}
      .fx-grid{display:flex;flex-direction:column;gap:10px;margin-top:16px}
      .fx-row{display:flex;gap:14px;align-items:center;background:var(--surface);
              border:1px solid var(--line);border-radius:10px;padding:10px}
      .fx-row img{width:64px;height:64px;object-fit:cover;border-radius:8px;flex-shrink:0}
      .fx-fields{display:flex;gap:10px;flex:1;flex-wrap:wrap;align-items:center}
      .fx-fields select, .fx-fields input{padding:8px 10px;border:1.5px solid var(--line-strong);
              border-radius:8px;background:var(--bg);color:var(--ink);font-size:.85rem}
      .fx-fields input[type=text]{flex:1;min-width:140px}
      .fx-old{font-size:.72rem;color:var(--muted);flex-basis:100%}
      .fx-status{width:70px;text-align:center;font-size:.78rem}
      .fx-status.ok{color:#2e7d32}.fx-status.err{color:#c62828}
      .fx-top-actions{display:flex;gap:10px;margin-top:14px}
    </style>
    <div class="fx-wrap">
      <h1>Fix fabric catalogue</h1>
      <div class="fx-note">
        For each row: check the photo, pick the correct brand, and type the correct
        colour name. Saving a row sets stock to <b>10</b> and rewrites the title as
        "Colour — Fabric Unstitched" (no brand in the title — brand stays in its own
        field). Nothing here touches "active" — flip that in
        <a href="/admin/products.html">/admin/products.html</a> once you're happy.
      </div>
      <div class="fx-top-actions">
        <button class="btn btn-secondary" id="fxReload">Reload from database</button>
        <button class="btn btn-primary" id="fxSaveAll">Save all rows</button>
      </div>
      <p id="fxLoading" class="muted" style="margin-top:10px">Loading products…</p>
      <div class="fx-grid" id="fxGrid"></div>
    </div>`;

  const grid = document.getElementById("fxGrid");
  const loading = document.getElementById("fxLoading");

  function optionsFor(selected) {
    return BRANDS.map((b) => `<option value="${esc(b)}" ${b === selected ? "selected" : ""}>${esc(b)}</option>`).join("");
  }

  async function load() {
    grid.innerHTML = "";
    loading.textContent = "Loading products…";
    const all = await adminListProducts();
    const fabrics = all.filter((p) => String(p.id || "").startsWith("fab-"));
    loading.textContent = fabrics.length
      ? `${fabrics.length} fabric product(s) loaded.`
      : `No products with id starting "fab-" found — did the import run?`;

    for (const p of fabrics) {
      const currentColor = (p.colors && p.colors[0] && p.colors[0].name) || "";
      const currentHex = (p.colors && p.colors[0] && p.colors[0].hex) || "";
      const row = document.createElement("div");
      row.className = "fx-row";
      row.dataset.id = p.id;
      row.dataset.hex = currentHex;
      row.innerHTML = `
        <img src="${esc(p.image || "")}" alt="">
        <div class="fx-fields">
          <select class="fx-brand">${optionsFor(p.brand)}</select>
          <input type="text" class="fx-color" value="${esc(currentColor)}" placeholder="Colour name">
          <span class="fx-old">was: ${esc(p.name || "")} (${esc(p.brand || "")})</span>
        </div>
        <button class="btn btn-secondary fx-save" style="flex-shrink:0">Save</button>
        <span class="fx-status"></span>
      `;
      grid.appendChild(row);

      row.querySelector(".fx-save").onclick = () => saveRow(row, p);
    }
  }

  async function saveRow(row, original) {
    const status = row.querySelector(".fx-status");
    status.textContent = "…"; status.className = "fx-status";
    const brand = row.querySelector(".fx-brand").value;
    const color = row.querySelector(".fx-color").value.trim();
    if (!color) {
      status.textContent = "need colour"; status.className = "fx-status err";
      return;
    }
    const hex = row.dataset.hex || "";
    try {
      await adminSaveProduct({
        ...original,
        id: row.dataset.id,
        brand,
        name: buildName(color, brand),
        desc: buildDesc(color, brand, hex),
        colors: [{ name: color, hex: hex || "#c9b18b" }],
        stock: 10,
      });
      status.textContent = "saved"; status.className = "fx-status ok";
      row.querySelector(".fx-old").textContent = `now: ${buildName(color, brand)} (${brand})`;
    } catch (e) {
      console.error(e);
      status.textContent = "failed"; status.className = "fx-status err";
    }
  }

  document.getElementById("fxReload").onclick = load;
  document.getElementById("fxSaveAll").onclick = async () => {
    const rows = [...grid.querySelectorAll(".fx-row")];
    const all = await adminListProducts();
    const byId = Object.fromEntries(all.map((p) => [p.id, p]));
    for (const row of rows) {
      const original = byId[row.dataset.id];
      if (original) await saveRow(row, original);
    }
    toast("All rows saved");
  };

  await load();
})();
