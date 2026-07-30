import { requireAdmin, renderAdminShell } from "./admin-guard.js";
import { adminListOrders, adminUpdateOrderStatus, adminListProducts } from "./admin-data.js";
import { money, esc, toast, optimizeImg } from "./utils.js";
import { formatOrderCode } from "./auth.js";

const STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"];
const SHIPPING_LABEL = { standard: "Standard (3–5 business days)", express: "Express (1–2 business days)" };
let orders = [];

(async function () {
  const user = await requireAdmin(); if (!user) return;
  const body = renderAdminShell("orders", user);
  body.innerHTML = `
    <div class="ad-h"><div><h1>Orders</h1><p>Track and update every order</p></div></div>
    <div class="ad-toolbar">
      <input class="ad-search" id="search" placeholder="Search by order id, name or email…">
      <select class="ad-select" id="statusFilter"><option value="">All statuses</option>
        ${STATUSES.map((s) => `<option value="${s}">${s[0].toUpperCase()+s.slice(1)}</option>`).join("")}</select>
    </div>
    <div class="ad-panel" style="padding:0;overflow-x:auto">
      <table class="ad-table"><thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Date</th><th>Status</th><th></th></tr></thead>
      <tbody id="rows"></tbody></table>
    </div>`;
  document.getElementById("search").oninput = render;
  document.getElementById("statusFilter").onchange = render;
  orders = await adminListOrders();
  render();
})();

function render() {
  const q = (document.getElementById("search").value || "").toLowerCase();
  const st = document.getElementById("statusFilter").value;
  const list = orders.filter((o) =>
    (!q || (o.id + (o.address?.name || "") + (o.email || "")).toLowerCase().includes(q)) &&
    (!st || (o.status || "pending") === st));

  document.getElementById("rows").innerHTML = list.map((o) => {
    const date = o.createdAt?.seconds ? new Date(o.createdAt.seconds * 1000).toLocaleDateString()
      : (o.createdAt ? new Date(o.createdAt).toLocaleDateString() : "—");
    const items = (o.items || []).reduce((s, i) => s + i.qty, 0);
    return `<tr>
      <td><b>${esc(formatOrderCode(o.id))}</b></td>
      <td>${esc(o.address?.name || "Guest")}<br><span class="muted" style="font-size:.78rem">${esc(o.email || "")}</span></td>
      <td>${items} item${items === 1 ? "" : "s"}</td>
      <td>${money(o.totals?.total || 0)}</td>
      <td>${date}</td>
      <td><select class="status-sel" data-id="${esc(o.id)}">
        ${STATUSES.map((s) => `<option value="${s}" ${(o.status || "pending") === s ? "selected" : ""}>${s[0].toUpperCase()+s.slice(1)}</option>`).join("")}
      </select></td>
      <td><button type="button" class="mini-btn" data-view="${esc(o.id)}">View</button></td>
    </tr>`;
  }).join("") || `<tr class="empty-row"><td colspan="7">No orders match.</td></tr>`;

  document.getElementById("rows").querySelectorAll("[data-view]").forEach((b) => {
    b.onclick = () => openOrderModal(orders.find((x) => x.id === b.dataset.view));
  });

  document.getElementById("rows").querySelectorAll(".status-sel").forEach((sel) => {
    sel.onchange = async () => {
      await adminUpdateOrderStatus(sel.dataset.id, sel.value);
      const o = orders.find((x) => x.id === sel.dataset.id); if (o) o.status = sel.value;
      toast("Order updated ✦", "ok");
    };
  });
}

// Full order detail — name, email, phone, address, items, and the totals
// breakdown — none of which showed anywhere in the admin before (the table
// row only ever had the customer's name and email).
function openOrderModal(o) {
  if (!o) return;
  const a = o.address || {};
  const t = o.totals || {};
  const date = o.createdAt?.seconds ? new Date(o.createdAt.seconds * 1000).toLocaleString()
    : (o.createdAt ? new Date(o.createdAt).toLocaleString() : "—");

  document.getElementById("modalBox").innerHTML = `
    <span class="close-x" id="orderModalClose">&times;</span>
    <h2>Order ${esc(formatOrderCode(o.id))}</h2>

    <div style="display:flex;gap:10px;align-items:center;margin-bottom:18px">
      <span class="badge ${esc(o.status || "pending")}">${esc(o.status || "pending")}</span>
      <span class="muted" style="font-size:.85rem">Placed ${esc(date)}</span>
    </div>

    <h3 style="margin-bottom:8px">Shipping to</h3>
    <p style="margin-bottom:18px">
      <b>${esc(a.name || "Guest")}</b><br>
      ${esc(a.street || a.address || "—")}${a.city ? `, ${esc(a.city)}` : ""}<br>
      ${a.phone ? `${esc(a.phone)}<br>` : ""}
      ${esc(a.email || o.email || "")}
    </p>

    <h3 style="margin-bottom:8px">Items (${(o.items || []).reduce((s, i) => s + (i.qty || 0), 0)})</h3>
    <div style="margin-bottom:18px">
      ${(o.items || []).map((i) => `
        <div style="padding:8px 0;border-bottom:1px solid var(--line)">
          <div style="display:flex;justify-content:space-between;gap:10px;align-items:center">
            <span>${esc(i.name)}${i.color ? ` — ${esc(i.color)}` : ""}${i.size ? ` / ${esc(i.size)}` : ""} × ${i.qty}</span>
            <span style="display:flex;align-items:center;gap:10px;white-space:nowrap">
              ${money((i.price || 0) * (i.qty || 0))}
              ${i.pid ? `<button type="button" class="mini-btn" data-view-product="${esc(i.pid)}">View product</button>` : ""}
            </span>
          </div>
          ${i.pid ? `<div class="product-preview" id="preview-${esc(i.pid)}" style="display:none;margin-top:10px"></div>` : ""}
        </div>`).join("") || `<p class="muted">No items on this order.</p>`}
    </div>

    <h3 style="margin-bottom:8px">Payment &amp; shipping</h3>
    <p style="margin-bottom:18px">
      ${(o.payment === "bank_transfer" || o.payment === "cod") ? "Bank transfer (Easypaisa)" : esc(o.payment || "—")}<br>
      ${esc(SHIPPING_LABEL[o.shipping] || o.shipping || "—")}
    </p>

    <div style="border-top:1px solid var(--line);padding-top:12px">
      <div style="display:flex;justify-content:space-between"><span class="muted">Subtotal</span><span>${money(t.subtotal || 0)}</span></div>
      ${t.discount ? `<div style="display:flex;justify-content:space-between"><span class="muted">Discount</span><span>-${money(t.discount)}</span></div>` : ""}
      <div style="display:flex;justify-content:space-between"><span class="muted">Shipping</span><span>${t.shipping ? money(t.shipping) : "Free"}</span></div>
      ${t.tax ? `<div style="display:flex;justify-content:space-between"><span class="muted">Tax</span><span>${money(t.tax)}</span></div>` : ""}
      <div style="display:flex;justify-content:space-between;font-weight:700;margin-top:8px"><span>Total</span><span>${money(t.total || 0)}</span></div>
    </div>`;

  document.getElementById("modalBg").classList.add("open");
  document.getElementById("orderModalClose").onclick = closeOrderModal;

  document.getElementById("modalBox").querySelectorAll("[data-view-product]").forEach((btn) => {
    btn.onclick = () => toggleProductPreview(btn.dataset.viewProduct, btn);
  });
}
function closeOrderModal() { document.getElementById("modalBg").classList.remove("open"); }
document.getElementById("modalBg").addEventListener("click", (e) => { if (e.target.id === "modalBg") closeOrderModal(); });

// Product lookup for the "View product" buttons inside the order modal —
// fetched once and cached so re-opening previews on the same order (or a
// different one) doesn't re-hit the products collection every click.
let _productsCache = null;
async function getProductsCache() {
  if (!_productsCache) _productsCache = await adminListProducts();
  return _productsCache;
}

async function toggleProductPreview(pid, btn) {
  const box = document.getElementById(`preview-${pid}`);
  if (!box) return;

  const isOpen = box.style.display !== "none";
  if (isOpen) { box.style.display = "none"; btn.textContent = "View product"; return; }

  box.style.display = "block";
  btn.textContent = "Hide product";
  box.innerHTML = `<p class="muted" style="font-size:.85rem">Loading…</p>`;

  const list = await getProductsCache();
  const p = list.find((x) => x.id === pid);
  if (!p) { box.innerHTML = `<p class="muted" style="font-size:.85rem">Product not found — it may have been removed.</p>`; return; }

  box.innerHTML = `
    <div style="display:flex;gap:14px;padding:12px;background:var(--bg2,#f7f6f4);border-radius:8px">
      <img src="${esc(optimizeImg(p.image, 200))}" alt="${esc(p.name)}"
        style="width:90px;height:110px;object-fit:cover;border-radius:6px;flex-shrink:0"
        onerror="this.src='https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=600&q=80'">
      <div style="min-width:0">
        <b>${esc(p.name)}</b><br>
        <span class="muted" style="font-size:.82rem">${esc(p.category || "")}${p.sub ? " / " + esc(p.sub) : ""}</span><br>
        <span style="font-weight:600">${money(p.salePrice || p.price)}</span>
        ${p.salePrice ? ` <span class="muted" style="text-decoration:line-through;font-size:.82rem">${money(p.price)}</span>` : ""}<br>
        <span class="muted" style="font-size:.82rem">Stock: ${p.stock ?? "—"}</span>
      </div>
    </div>`;
}
