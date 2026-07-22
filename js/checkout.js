// ============================================================
// AMEER OFFICIAL — checkout flow: address → shipping → payment → review
// ============================================================
import { renderNavbar, refreshCounts } from "./navbar.js";
import { renderFooter } from "./app.js";
import { loadProducts } from "./products.js";
import { currentUser, getProfile, placeOrder, formatOrderCode } from "./auth.js";
import { money, esc, lsGet, lsSet, toast, isEmail, isNonEmpty } from "./utils.js";
import { validateCoupon, redeemCoupon } from "./coupons.js";

const SHIP_FREE_OVER = 10000, TAX_RATE = 0.0;
const SHIPPING = {
  standard: { label: "Standard", desc: "3–5 business days", price: 200 },
  express:  { label: "Express",  desc: "1–2 business days", price: 400 }
};
const PAYMENT_LABEL = { bank_transfer: "Bank transfer (Easypaisa)" };

let products = [], user = null, step = 1;
const order = { address: {}, shipping: "standard", payment: "bank_transfer" };

async function boot() {
  renderNavbar(""); renderFooter();
  products = await loadProducts();

  const cart = lsGet("lx-cart", []);
  if (!cart.length) { location.href = "cart.html"; return; }

  user = await currentUser();
  if (user) {
    const prof = await getProfile(user);
    if (prof?.addresses?.length) order.address = { ...prof.addresses[0] };
    order.address.email = order.address.email || user.email;
    order.address.name = order.address.name || user.displayName || prof?.name || "";
  }
  render();
}

function cartLines() {
  const cart = lsGet("lx-cart", []);
  return cart.map((l) => ({ ...l, p: products.find((x) => x.id === l.pid) })).filter((l) => l.p);
}
async function totals() {
  const lines = cartLines();
  let subtotal = 0;
  lines.forEach((l) => subtotal += (l.p.salePrice || l.p.price) * l.qty);
  // Coupon-eligible portion: excludes products flagged noCoupon in the admin.
  let couponable = 0;
  lines.forEach((l) => { if (!l.p.noCoupon) couponable += (l.p.salePrice || l.p.price) * l.qty; });
  const code = lsGet("lx-coupon", null);
  let discount = 0, couponId = null;
  if (code) {
    const v = await validateCoupon(code, subtotal, couponable);
    if (v.ok) { discount = v.discount; couponId = v.coupon.id; }
    else lsSet("lx-coupon", null);
  }
  const afterDiscount = Math.max(0, subtotal - discount);
  const ship = SHIPPING[order.shipping].price;
  const shipping = afterDiscount >= SHIP_FREE_OVER && order.shipping === "standard" ? 0 : ship;
  const tax = afterDiscount * TAX_RATE;
  return { subtotal, discount, shipping, tax, total: afterDiscount + shipping + tax, couponId };
}

function stepBar() {
  const names = ["Address", "Shipping", "Payment", "Review"];
  return `<div class="steps">${names.map((n, i) => {
    const s = i + 1;
    return `<div class="step ${s === step ? "on" : ""} ${s < step ? "done" : ""}">${s < step ? "✓ " : ""}${n}</div>`;
  }).join("")}</div>`;
}

async function summaryAside() {
  const t = await totals();
  const lines = cartLines();
  return `<aside class="summary">
    <h3>Your order</h3>
    ${lines.map((l) => `<div class="co-review-item"><span>${esc(l.p.name)} <span class="muted">×${l.qty}</span></span><span>${money((l.p.salePrice||l.p.price)*l.qty)}</span></div>`).join("")}
    <div class="sum-row" style="margin-top:12px"><span>Subtotal</span><span>${money(t.subtotal)}</span></div>
    ${t.discount ? `<div class="sum-row" style="color:var(--ok)"><span>Discount</span><span>−${money(t.discount)}</span></div>` : ""}
    <div class="sum-row muted"><span>Shipping</span><span>${t.shipping === 0 ? "Free" : money(t.shipping)}</span></div>
    <div class="sum-row muted"><span>Tax</span><span>${money(t.tax)}</span></div>
    <div class="sum-total"><span>Total</span><span>${money(t.total)}</span></div>
  </aside>`;
}

async function render() {
  const root = document.getElementById("checkoutRoot");
  root.innerHTML = `<div class="checkout"><div>${stepBar()}<div id="stepBody"></div></div>${await summaryAside()}</div>`;
  const body = document.getElementById("stepBody");
  if (step === 1) body.innerHTML = addressStep();
  if (step === 2) body.innerHTML = shippingStep();
  if (step === 3) body.innerHTML = paymentStep();
  if (step === 4) body.innerHTML = await reviewStep();
  wireStep();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ---- step 1: address ---- */
function addressStep() {
  const a = order.address;
  return `<div class="co-section">
    <h3>Shipping address</h3>
    <div class="form-2">
      <div class="field"><label>Full name</label><input id="f-name" value="${esc(a.name||"")}" autocomplete="name"></div>
      <div class="field"><label>Email</label><input id="f-email" type="email" value="${esc(a.email||"")}" autocomplete="email"></div>
    </div>
    <div class="field"><label>Address</label><input id="f-street" value="${esc(a.street||"")}" autocomplete="street-address" placeholder="Street address"></div>
    <div class="form-2">
      <div class="field"><label>City</label><input id="f-city" value="${esc(a.city||"")}" autocomplete="address-level2"></div>
      <div class="field"><label>Postal code</label><input id="f-zip" value="${esc(a.zip||"")}" autocomplete="postal-code"></div>
    </div>
    <div class="form-2">
      <div class="field"><label>Country</label><input id="f-country" value="${esc(a.country||"")}" autocomplete="country-name"></div>
      <div class="field"><label>Phone</label><input id="f-phone" value="${esc(a.phone||"")}" autocomplete="tel"></div>
    </div>
    <button class="btn btn-primary" id="toShipping">Continue to shipping</button>
  </div>`;
}

/* ---- step 2: shipping ---- */
function shippingStep() {
  return `<div class="co-section">
    <h3>Shipping method</h3>
    <div class="pay-methods">
      ${Object.entries(SHIPPING).map(([k, s]) => `
        <label class="pay-opt ${order.shipping === k ? "on" : ""}">
          <input type="radio" name="ship" value="${k}" ${order.shipping === k ? "checked" : ""}>
          <div style="flex:1"><div class="pay-name">${s.label}</div><div class="pay-desc">${s.desc}</div></div>
          <div style="font-weight:600">${s.price === 0 ? "Free" : money(s.price)}</div>
        </label>`).join("")}
    </div>
    <div style="display:flex;gap:12px;margin-top:24px">
      <button class="btn btn-line" id="backTo1">Back</button>
      <button class="btn btn-primary" id="toPayment" style="flex:1">Continue to payment</button>
    </div>
  </div>`;
}

/* ---- step 3: payment ---- */
function paymentStep() {
  const methods = [
    { k: "bank_transfer", name: "BANK TRANSFER", desc: "Pay on our Easypaisa account# 03335665882 and Share receipt on Whatsapp 03335665882: As soon as we get the payment your order will be dispatched" }
  ];
  return `<div class="co-section">
    <h3>Payment</h3>
    <div class="pay-methods">
      ${methods.map((m) => `
        <label class="pay-opt on">
          <input type="radio" name="pay" value="${m.k}" checked>
          <div style="flex:1"><div class="pay-name">${m.name}</div><div class="pay-desc">${m.desc}</div></div>
        </label>`).join("")}
    </div>
    <p class="muted" style="font-size:.82rem;margin-top:14px">This step is very critical.</p>
    <div style="display:flex;gap:12px;margin-top:24px">
      <button class="btn btn-line" id="backTo2">Back</button>
      <button class="btn btn-primary" id="toReview" style="flex:1">Review order</button>
    </div>
  </div>`;
}

/* ---- step 4: review ---- */
async function reviewStep() {
  const a = order.address;
  const t = await totals();
  return `<div class="co-section">
    <h3>Review &amp; place order</h3>
    <div class="acct-card">
      <b>Ship to</b>
      <p class="muted" style="margin-top:6px">${esc(a.name)}<br>${esc(a.street)}, ${esc(a.city)} ${esc(a.zip)}<br>${esc(a.country)} · ${esc(a.phone)}</p>
    </div>
    <div class="acct-card">
      <b>Method</b>
      <p class="muted" style="margin-top:6px">${SHIPPING[order.shipping].label} shipping · ${PAYMENT_LABEL[order.payment] || "Bank transfer"}</p>
    </div>
    <div style="display:flex;gap:12px;margin-top:8px">
      <button class="btn btn-line" id="backTo3">Back</button>
      <button class="btn btn-gold" id="placeBtn" style="flex:1">Place order · ${money(t.total)}</button>
    </div>
  </div>`;
}

function wireStep() {
  const $ = (id) => document.getElementById(id);

  if (step === 1) {
    $("toShipping").onclick = () => {
      const a = {
        name: $("f-name").value.trim(), email: $("f-email").value.trim(),
        street: $("f-street").value.trim(), city: $("f-city").value.trim(),
        zip: $("f-zip").value.trim(), country: $("f-country").value.trim(),
        phone: $("f-phone").value.trim()
      };
      if (!isNonEmpty(a.name) || !isNonEmpty(a.street) || !isNonEmpty(a.city) || !isNonEmpty(a.country)) {
        toast("Please fill in your name and address", "err"); return;
      }
      if (!isEmail(a.email)) { toast("Please enter a valid email", "err"); return; }
      order.address = a; step = 2; render();
    };
  }

  if (step === 2) {
    $("backTo1").onclick = () => { step = 1; render(); };
    document.querySelectorAll('input[name="ship"]').forEach((r) =>
      r.addEventListener("change", (e) => { order.shipping = e.target.value; render(); }));
    $("toPayment").onclick = () => { step = 3; render(); };
  }

  if (step === 3) {
    $("backTo2").onclick = () => { step = 2; render(); };
    order.payment = "bank_transfer";
    $("toReview").onclick = () => { step = 4; render(); };
  }

  if (step === 4) {
    $("backTo3").onclick = () => { step = 3; render(); };
    $("placeBtn").onclick = async () => {
      const btn = $("placeBtn"); btn.disabled = true; btn.textContent = "Checking stock…";
      const lines = cartLines();

      try {
        const { db, doc, getDoc, updateDoc, increment } = await import("./firebase.js");
        for (const l of lines) {
          const snap = await getDoc(doc(db, "products", l.p.id));
          const live = snap.exists() ? (snap.data().stock ?? 0) : 0;
          if (live < l.qty) {
            toast(`Sorry — only ${live} of "${l.p.name}" left in stock`, "err");
            btn.disabled = false; btn.textContent = "Place order";
            return;
          }
        }

        btn.textContent = "Placing order…";
        const t = await totals();
        const items = lines.map((l) => ({
          pid: l.p.id, name: l.p.name, price: l.p.salePrice || l.p.price,
          qty: l.qty, color: l.color, size: l.size, image: l.p.image
        }));
        const rec = await placeOrder(user, {
          items, address: order.address, shipping: order.shipping,
          payment: order.payment, totals: t
        });

        await Promise.all(lines.map((l) =>
          updateDoc(doc(db, "products", l.p.id), { stock: increment(-l.qty) }).catch(() => {})
        ));
        if (t.couponId) redeemCoupon(t.couponId);

        lsSet("lx-cart", []); lsSet("lx-coupon", null); refreshCounts();
        sessionStorage.setItem("lx-last-order", JSON.stringify({ id: rec.id, email: order.address.email, total: t.total, guest: !user }));
        location.href = "checkout.html?done=1";
      } catch (e) {
        toast(e.message || "Could not place order", "err");
        btn.disabled = false; btn.textContent = "Place order";
      }
    };
  }
}

/* ---- confirmation screen ---- */
function showConfirmation() {
  renderNavbar(""); renderFooter();
  let info = {};
  try { info = JSON.parse(sessionStorage.getItem("lx-last-order")) || {}; } catch {}
  document.getElementById("checkoutRoot").innerHTML = `
    <div class="confirm">
      <div class="tick"><svg viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg></div>
      <h1>Thank you for your order</h1>
      <p>Your order is confirmed. Pay in cash when it arrives.</p>

      <div class="ord-code-box">
        <span class="ord-code-label">Your order number</span>
        <span class="ord-code" id="ordCode">${esc(info.id ? formatOrderCode(info.id) : "——")}</span>
        <button class="mini-btn" id="copyCode" type="button">Copy</button>
      </div>
      ${info.guest
        ? `<p class="ord-note"><b>Save this number.</b> You ordered as a guest, so it's the only way to track your order.</p>`
        : `<p class="ord-note">You can also see this order in your profile.</p>`}

      ${info.total != null ? `<p>Total to pay on delivery: <b>${money(info.total)}</b></p>` : ""}
      <a class="btn btn-primary" href="track.html?id=${encodeURIComponent(info.id || "")}">Track my order</a>
      <a class="btn btn-line" href="women.html" style="margin-top:10px">Continue shopping</a>
    </div>`;

  const copyBtn = document.getElementById("copyCode");
  if (copyBtn) copyBtn.onclick = async () => {
    try { await navigator.clipboard.writeText(info.id ? formatOrderCode(info.id) : ""); toast("Order number copied ✦", "ok"); }
    catch { toast("Copy failed — please write it down", "err"); }
  };
}

if (new URLSearchParams(location.search).get("done")) showConfirmation();
else boot();
