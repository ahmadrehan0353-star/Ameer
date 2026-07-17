// ============================================================
// AMEER OFFICIAL — coupon validation (single source of truth)
// Both cart.js and checkout.js used to keep their own hardcoded copy of
// the coupon list, completely disconnected from the "coupons" collection
// the admin panel manages — creating, editing, or disabling a coupon in
// the dashboard had zero effect on the site. This is the one place coupon
// rules are checked now, backed by the real data.
// ============================================================
import { listCoupons } from "./admin-data.js";

// Look up a code and tell the caller exactly why it isn't usable, if it
// isn't — cart.js and checkout.js both just need { ok, coupon, reason }.
export async function validateCoupon(code, subtotal = 0) {
  const clean = String(code || "").trim().toUpperCase();
  if (!clean) return { ok: false, reason: "Enter a coupon code" };

  const all = await listCoupons();
  const c = all.find((x) => String(x.code || x.id || "").toUpperCase() === clean);
  if (!c) return { ok: false, reason: "That code isn't valid" };
  if (c.active === false) return { ok: false, reason: "That code is no longer active" };
  if (c.expiry && new Date(c.expiry) < new Date(new Date().toDateString())) {
    return { ok: false, reason: "That code has expired" };
  }
  if (c.limit && (c.used || 0) >= c.limit) return { ok: false, reason: "That code has been fully redeemed" };

  const discount = c.type === "percent" ? subtotal * (c.value / 100) : Math.min(c.value, subtotal);
  return { ok: true, coupon: c, discount };
}

// Called once an order actually goes through — bumps the usage count on
// the real coupon doc so the admin's "times used" figure means something.
// Best-effort: if it fails (e.g. offline), the order still succeeds —
// a missed usage-count tick isn't worth blocking a sale over.
export async function redeemCoupon(couponId) {
  if (!couponId) return;
  try {
    const { db, doc, updateDoc, increment } = await import("./firebase.js");
    await updateDoc(doc(db, "coupons", couponId), { used: increment(1) });
  } catch { /* non-critical — see comment above */ }
}
