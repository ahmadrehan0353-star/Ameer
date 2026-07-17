// ============================================================
// AMEER OFFICIAL — track an order by its number (no login)
// ============================================================
import { renderNavbar } from "./navbar.js";
import { renderFooter } from "./app.js";
import { trackOrder, formatOrderCode, normalizeOrderCode } from "./auth.js";
import { money, esc, param, toast } from "./utils.js";

// The journey a normal order takes. "cancelled"/"refunded" are handled apart.
const FLOW = ["pending", "confirmed", "processing", "shipped", "delivered"];
const LABEL = {
  pending: "Order placed",
  confirmed: "Confirmed",
  processing: "Being prepared",
  shipped: "On its way",
  delivered: "Delivered"
};
const BLURB = {
  pending: "We've received your order and will confirm it shortly.",
  confirmed: "Your order is confirmed and queued for packing.",
  processing: "We're preparing your order for dispatch.",
  shipped: "Your order is on its way. Please keep the cash amount ready.",
  delivered: "Delivered. Thank you for shopping with us."
};

const root = document.getElementById("trackRoot");
const input = document.getElementById("trackInput");

function when(ts) {
  try {
    const d = ts?.seconds ? new Date(ts.seconds * 1000) : (ts ? new Date(ts) : null);
    return d ? d.toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" }) : "";
  } catch { return ""; }
}

function renderNotFound(code) {
  root.innerHTML = `
    <div class="track-empty">
      <b>No order found for "${esc(formatOrderCode(code))}"</b>
      <p>Please check the number and try again. It's 12 characters, looks like <b>K7X4-M2PQ-9RTV</b>, and is on your confirmation screen and in your confirmation email.</p>
      <p class="muted" style="margin-top:14px">Still stuck? Message us and we'll look it up.</p>
      <a class="btn btn-line" href="contact.html" style="margin-top:16px">Contact us</a>
    </div>`;
}

function renderOrder(o) {
  const status = (o.status || "pending").toLowerCase();
  const dead = status === "cancelled" || status === "refunded";
  const idx = FLOW.indexOf(status);
  const items = Array.isArray(o.items) ? o.items : [];
  const total = o.totals?.total;

  root.innerHTML = `
    <div class="track-card">
      <div class="track-head">
        <div>
          <span class="track-label">Order</span>
          <span class="track-id">${esc(formatOrderCode(o.id))}</span>
        </div>
        <span class="track-pill ${dead ? "bad" : ""}">${esc(LABEL[status] || status[0].toUpperCase() + status.slice(1))}</span>
      </div>
      ${when(o.createdAt) ? `<p class="muted" style="font-size:.85rem">Placed ${when(o.createdAt)}</p>` : ""}

      ${dead
        ? `<p class="track-dead">This order was ${esc(status)}. If that's unexpected, please contact us.</p>`
        : `<ol class="track-steps">
            ${FLOW.map((s, i) => `
              <li class="${i < idx ? "done" : i === idx ? "now" : ""}">
                <span class="dot"></span>
                <span class="t">${esc(LABEL[s])}</span>
              </li>`).join("")}
          </ol>
          <p class="track-blurb">${esc(BLURB[status] || "")}</p>`}

      ${items.length ? `
        <div class="track-items">
          <h3>Items</h3>
          ${items.map((l) => `
            <div class="track-line">
              <span>${esc(l.name || "Item")}${l.size ? ` · ${esc(l.size)}` : ""}${l.color ? ` · ${esc(l.color)}` : ""} × ${Number(l.qty) || 1}</span>
              <span>${l.price != null ? money(l.price * (Number(l.qty) || 1)) : ""}</span>
            </div>`).join("")}
        </div>` : ""}

      ${total != null ? `<div class="track-total"><span>Total (cash on delivery)</span><b>${money(total)}</b></div>` : ""}

      ${o.address ? `
        <div class="track-addr">
          <h3>Delivering to</h3>
          <p>${esc(o.address.name || "")}<br>${esc(o.address.line1 || o.address.address || "")}${o.address.city ? `<br>${esc(o.address.city)}` : ""}${o.address.phone ? `<br>${esc(o.address.phone)}` : ""}</p>
        </div>` : ""}
    </div>`;
}

async function lookup(codeRaw) {
  // Dashes, spaces and lowercase are all fine — normalise before looking up.
  const code = normalizeOrderCode(codeRaw);
  if (!code) { toast("Enter your order number", "err"); return; }
  root.innerHTML = `<div class="track-loading">Looking up ${esc(formatOrderCode(code))}…</div>`;
  try {
    const o = await trackOrder(code);
    if (!o) return renderNotFound(code);
    renderOrder(o);
  } catch (e) {
    console.error(e);
    renderNotFound(code);
  }
}

(function boot() {
  renderNavbar(""); renderFooter();

  document.getElementById("trackBtn").onclick = () => lookup(input.value);
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") lookup(input.value); });

  // Arriving straight from checkout: ?id=K7X4M2PQ9RTV
  const pre = param("id");
  if (pre) { input.value = formatOrderCode(normalizeOrderCode(pre)); lookup(pre); }
})();
