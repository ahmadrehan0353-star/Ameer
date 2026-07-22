// ============================================================
// AMEER OFFICIAL — cart page
// ============================================================
import { renderNavbar, refreshCounts } from "./navbar.js";
import { renderFooter } from "./app.js";
import { loadProducts, getProduct } from "./products.js";
import { money, esc, lsGet, lsSet, toast, optimizeImg } from "./utils.js";
import { validateCoupon } from "./coupons.js";

const SHIP_FREE_OVER = 10000;
const SHIP_FLAT = 200;
const TAX_RATE = 0.00;

let products = [];

async function boot() {
  renderNavbar(""); renderFooter();
  products = await loadProducts();
  render();
}

function getCart() { return lsGet("lx-cart", []); }
function setCart(c) { lsSet("lx-cart", c); refreshCounts(); }

function lineProduct(l) { return products.find((p) => p.id === l.pid); }

async function totals(cart) {
  let subtotal = 0;
  cart.forEach((l) => { const p = lineProduct(l); if (p) subtotal += (p.salePrice || p.price) * l.qty; });
  // Coupon-eligible portion: same sum, minus products the admin flagged
  // as "coupons can't be used on this product" (noCoupon).
  let couponable = 0;
  cart.forEach((l) => { const p = lineProduct(l); if (p && !p.noCoupon) couponable += (p.salePrice || p.price) * l.qty; });
  const code = lsGet("lx-coupon", null);
  let discount = 0, couponLabel = "";
  if (code) {
    const v = await validateCoupon(code, subtotal, couponable);
    if (v.ok) {
      discount = v.discount;
      couponLabel = v.coupon.type === "percent" ? `${v.coupon.value}% off` : `${money(v.coupon.value)} off`;
    } else {
      // the code was applied earlier but no longer validates (expired,
      // deactivated, or hit its limit since then) — drop it quietly.
      lsSet("lx-coupon", null);
    }
  }
  const afterDiscount = Math.max(0, subtotal - discount);
  const shipping = afterDiscount === 0 ? 0 : (afterDiscount >= SHIP_FREE_OVER ? 0 : SHIP_FLAT);
  const tax = afterDiscount * TAX_RATE;
  const total = afterDiscount + shipping + tax;
  return { subtotal, couponable, discount, shipping, tax, total, coupon: discount ? code : null, couponLabel };
}

async function render() {
  const cart = getCart();
  const root = document.getElementById("cartRoot");

  if (!cart.length) {
    root.innerHTML = `
      <div class="cart-empty-state">
        <b>Your bag is empty</b>
        <p class="muted">Discover something you'll love.</p>
        <a class="btn btn-primary" href="women.html">Start shopping</a>
      </div>`;
    return;
  }

  const t = await totals(cart);
  root.innerHTML = `
    <div class="cart-layout">
      <div>
        ${cart.map((l, i) => {
          const p = lineProduct(l);
          if (!p) return "";
          const unit = p.salePrice || p.price;
          const was = p.salePrice ? `<span class="was">${money(p.price * l.qty)}</span>` : "";
          return `<div class="cart-line">
            <a class="cimg" href="product.html?id=${esc(p.id)}"><img src="${esc(optimizeImg(p.image, 200))}" data-raw="${esc(p.image)}" alt="${esc(p.name)}" onerror="if(this.src!==this.dataset.raw){this.src=this.dataset.raw}"></a>
            <div>
              <a class="cname" href="product.html?id=${esc(p.id)}">${esc(p.name)}</a>
              <div class="cmeta">${esc(l.color)} · Size ${esc(l.size)}</div>
              ${p.noCoupon ? `<div class="cmeta" style="color:#b0453a;font-size:.78rem;font-weight:600">Discount codes can't be used on this item</div>` : ""}
              <div class="line-qty">
                <button data-act="dec" data-i="${i}" aria-label="Decrease">−</button>
                <span>${l.qty}</span>
                <button data-act="inc" data-i="${i}" aria-label="Increase">+</button>
              </div>
            </div>
            <div class="cline-price">${money(unit * l.qty)}${was}
              <button class="line-remove" data-act="rm" data-i="${i}">Remove</button>
            </div>
          </div>`;
        }).join("")}
      </div>

      <aside class="summary">
        <h3>Order summary</h3>
        <div class="coupon">
          <input id="couponInput" placeholder="Discount code" value="${t.coupon || ""}" aria-label="Discount code">
          <button id="couponBtn">Apply</button>
        </div>
        ${t.coupon ? `<div class="coupon-ok">✓ ${esc(t.couponLabel)} applied · <a href="#" id="couponRemove" style="text-decoration:underline">remove</a></div>` : ""}
        <div class="sum-row"><span>Subtotal</span><span>${money(t.subtotal)}</span></div>
        ${t.discount ? `<div class="sum-row" style="color:var(--ok)"><span>Discount</span><span>−${money(t.discount)}</span></div>` : ""}
        <div class="sum-row muted"><span>Shipping</span><span>${t.shipping === 0 ? "Free" : money(t.shipping)}</span></div>
        <div class="sum-row muted"><span>Tax (est.)</span><span>${money(t.tax)}</span></div>
        <div class="sum-total"><span>Total</span><span>${money(t.total)}</span></div>
        ${t.subtotal < SHIP_FREE_OVER && t.subtotal > 0 ? `<p class="muted" style="font-size:.8rem;margin-top:8px">Add ${money(SHIP_FREE_OVER - t.subtotal)} more for free shipping.</p>` : ""}
        ${(() => {
          // Heading shown before checkout when a code is applied but some
          // items in the bag are coupon-excluded, so the partial discount
          // isn't a surprise on the next page.
          const excluded = cart.filter((l) => { const p = lineProduct(l); return p && p.noCoupon; }).length;
          return t.coupon && excluded
            ? `<h4 style="margin:12px 0 4px;color:#b0453a;font-size:.9rem">Discount not applied to ${excluded} item${excluded > 1 ? "s" : ""}</h4>
               <p class="muted" style="font-size:.78rem;margin:0 0 6px">Coupons aren't available on the item${excluded > 1 ? "s" : ""} marked above — your code only discounts the rest.</p>`
            : "";
        })()}
        <a class="btn btn-primary btn-block" href="checkout.html">Checkout</a>
        <a class="btn btn-line btn-block" href="women.html" style="margin-top:10px">Continue shopping</a>
        <div class="trust-line"><span>🔒 Secure</span><span>💵 Cash on delivery</span></div>
      </aside>
    </div>`;

  wire();
}

function wire() {
  document.getElementById("cartRoot").addEventListener("click", (e) => {
    const b = e.target.closest("[data-act]"); if (!b) return;
    const cart = getCart();
    const i = +b.dataset.i;
    if (b.dataset.act === "inc") {
      const p = lineProduct(cart[i]);
      const cap = p?.stock ?? 99;
      if (cart[i].qty >= cap) { toast(`Only ${cap} in stock`, "err"); return; }
      cart[i].qty++;
    }
    if (b.dataset.act === "dec") cart[i].qty = Math.max(1, cart[i].qty - 1);
    if (b.dataset.act === "rm") { cart.splice(i, 1); toast("Removed from bag"); }
    setCart(cart); render();
  }, { once: true });

  const cbtn = document.getElementById("couponBtn");
  if (cbtn) cbtn.onclick = async () => {
    const code = document.getElementById("couponInput").value.trim().toUpperCase();
    // Pass the coupon-eligible amount too — otherwise a bag made up only of
    // coupon-excluded items would still say "applied" with Rs 0 off.
    const t = await totals(getCart());
    const v = await validateCoupon(code, t.subtotal, t.couponable);
    if (v.ok) { lsSet("lx-coupon", code); toast("Discount applied ✦", "ok"); }
    else { lsSet("lx-coupon", null); toast(v.reason, "err"); }
    render();
  };
  const crm = document.getElementById("couponRemove");
  if (crm) crm.onclick = (e) => { e.preventDefault(); lsSet("lx-coupon", null); render(); };
}

boot();
