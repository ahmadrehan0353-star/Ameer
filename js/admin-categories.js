import { requireAdmin, renderAdminShell } from "./admin-guard.js";
import { listCategories, saveCategory, deleteCategory, uploadImage } from "./admin-data.js";
import { esc, toast } from "./utils.js";

let cats = [];
(async function () {
  const user = await requireAdmin(); if (!user) return;
  const body = renderAdminShell("categories", user);
  body.innerHTML = `
    <div class="ad-h"><div><h1>Categories</h1><p>Organise the top-level navigation</p></div>
      <button class="btn btn-primary" id="newBtn">+ New category</button></div>
    <div class="ad-panel" style="padding:0;overflow-x:auto">
      <table class="ad-table"><thead><tr><th>Order</th><th>Image</th><th>Name</th><th>Slug</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody id="rows"></tbody></table>
    </div>`;
  document.getElementById("newBtn").onclick = () => openEditor(null);
  await reload();
})();

async function reload() { cats = (await listCategories()).sort((a, b) => (a.order || 0) - (b.order || 0)); render(); }

function render() {
  document.getElementById("rows").innerHTML = cats.map((c, idx) => `
    <tr>
      <td><div class="t-actions">
        <button class="mini-btn" data-move="up" data-id="${esc(c.id)}" ${idx === 0 ? "disabled" : ""}>↑</button>
        <button class="mini-btn" data-move="down" data-id="${esc(c.id)}" ${idx === cats.length - 1 ? "disabled" : ""}>↓</button>
      </div></td>
      <td><img class="thumb" src="${esc(c.image || "")}" alt="" onerror="this.style.visibility='hidden'"></td>
      <td><b>${esc(c.name)}</b></td>
      <td>${esc(c.slug)}</td>
      <td><span class="pill ${c.active === false ? "off" : "on"}">${c.active === false ? "Hidden" : "Visible"}</span></td>
      <td><div class="t-actions">
        <button class="mini-btn" data-act="edit" data-id="${esc(c.id)}">Edit</button>
        <button class="mini-btn danger" data-act="del" data-id="${esc(c.id)}">Delete</button>
      </div></td>
    </tr>`).join("") || `<tr class="empty-row"><td colspan="6">No categories.</td></tr>`;

  document.getElementById("rows").querySelectorAll("[data-act]").forEach((b) =>
    b.onclick = () => { const c = cats.find((x) => x.id === b.dataset.id); b.dataset.act === "edit" ? openEditor(c) : del(c); });
  document.getElementById("rows").querySelectorAll("[data-move]").forEach((b) =>
    b.onclick = () => move(b.dataset.id, b.dataset.move));
}

async function move(id, dir) {
  const i = cats.findIndex((c) => c.id === id);
  const j = dir === "up" ? i - 1 : i + 1;
  if (j < 0 || j >= cats.length) return;
  [cats[i].order, cats[j].order] = [cats[j].order ?? j, cats[i].order ?? i];
  await saveCategory(cats[i]); await saveCategory(cats[j]);
  toast("Reordered"); reload();
}
async function del(c) {
  if (!confirm(`Delete category "${c.name}"?`)) return;
  await deleteCategory(c.id); toast("Deleted"); reload();
}
let workImage = "";
function openEditor(c) {
  workImage = c?.image || "";
  const box = document.getElementById("modalBox");
  box.innerHTML = `
    <span class="close-x" id="closeX">×</span>
    <h2>${c ? "Edit category" : "New category"}</h2>
    <div class="field"><label>Name</label><input id="c-name" value="${esc(c?.name || "")}"></div>
    <div class="field"><label>Slug</label><input id="c-slug" value="${esc(c?.slug || "")}" placeholder="women"></div>
    <div class="field"><label>Subtitle (small text on the card)</label><input id="c-subtitle" value="${esc(c?.subtitle || "")}" placeholder="13 collections"></div>
    <div class="field"><label>Link (where the card goes)</label><input id="c-link" value="${esc(c?.link || "")}" placeholder="women.html"></div>

    <div class="field full"><label>Card image</label>
      <div class="img-drop" id="imgDrop">Click to upload an image (or paste an image URL below)</div>
      <input type="file" id="imgFile" accept="image/*" hidden>
      <div style="display:flex;gap:8px;margin-top:8px"><input id="imgUrl" placeholder="https://image-url.jpg" style="flex:1;padding:9px 12px;border:1.5px solid var(--line-strong);border-radius:8px;background:var(--surface);color:var(--ink)"><button class="mini-btn" id="addUrl">Add URL</button></div>
      <div class="img-previews" id="imgPreviews"></div>
    </div>

    <div class="field"><label><input type="checkbox" id="c-active" ${c?.active === false ? "" : "checked"}> Visible in navigation</label></div>
    <div style="display:flex;gap:12px;margin-top:20px">
      <button class="btn btn-line" id="cancelBtn">Cancel</button>
      <button class="btn btn-primary" id="saveBtn" style="flex:1">${c ? "Save" : "Create"}</button>
    </div>`;
  document.getElementById("modalBg").classList.add("open");
  renderImage();
  document.getElementById("closeX").onclick = close;
  document.getElementById("cancelBtn").onclick = close;
  document.getElementById("imgDrop").onclick = () => document.getElementById("imgFile").click();
  document.getElementById("imgFile").onchange = onFile;
  document.getElementById("addUrl").onclick = () => {
    const u = document.getElementById("imgUrl").value.trim();
    if (u) { workImage = u; document.getElementById("imgUrl").value = ""; renderImage(); }
  };
  document.getElementById("saveBtn").onclick = async () => {
    const name = document.getElementById("c-name").value.trim();
    if (!name) { toast("Name required", "err"); return; }
    await saveCategory({
      id: c?.id, name,
      slug: document.getElementById("c-slug").value.trim() || name.toLowerCase(),
      subtitle: document.getElementById("c-subtitle").value.trim(),
      link: document.getElementById("c-link").value.trim() || (document.getElementById("c-slug").value.trim() + ".html"),
      image: workImage,
      active: document.getElementById("c-active").checked,
      order: c?.order ?? cats.length + 1
    });
    toast("Saved ✦", "ok"); close(); reload();
  };
}
function renderImage() {
  document.getElementById("imgPreviews").innerHTML = workImage
    ? `<div class="img-prev"><img src="${esc(workImage)}" alt=""><button id="rmImg">×</button></div>` : "";
  const rm = document.getElementById("rmImg");
  if (rm) rm.onclick = () => { workImage = ""; renderImage(); };
}
async function onFile(e) {
  const f = e.target.files[0];
  if (!f) return;
  toast("Uploading image…");
  try { workImage = await uploadImage(f); renderImage(); toast("Image added ✦", "ok"); }
  catch (err) { toast("Upload failed: " + err.message, "err"); }
  e.target.value = "";
}
function close() { document.getElementById("modalBg").classList.remove("open"); }
document.getElementById("modalBg").addEventListener("click", (e) => { if (e.target.id === "modalBg") close(); });
