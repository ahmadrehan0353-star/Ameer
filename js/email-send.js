// ============================================================
// AMEER OFFICIAL — outgoing email (EmailJS)
// Sends the 6-digit admin-invite code straight from the browser —
// no backend server needed, same "no build step" philosophy as the
// rest of this app. Configure EMAILJS in firebase/firebase-config.js
// to enable real delivery. Until then, callers fall back to showing
// the code on-screen so the admin can share it manually.
// ============================================================

let _emailjsLib = null;
async function loadEmailJs() {
  if (_emailjsLib) return _emailjsLib;
  _emailjsLib = await import("https://cdn.jsdelivr.net/npm/@emailjs/browser@4/+esm");
  return _emailjsLib;
}

export async function emailJsConfigured() {
  try {
    const cfg = await import("../firebase/firebase-config.js");
    const e = cfg.EMAILJS || {};
    return !!(e.publicKey && e.serviceId && e.templateId && !String(e.publicKey).startsWith("PASTE"));
  } catch { return false; }
}

// Sends the invite code to `toEmail`. Returns true on success.
// Throws if EmailJS is configured but the send fails (so the caller
// can decide how to handle it); returns false if EmailJS isn't set up.
export async function sendAdminInviteCode({ toEmail, code, storeName = "Ameer Official", invitedBy = "" }) {
  if (!(await emailJsConfigured())) return false;
  const cfg = await import("../firebase/firebase-config.js");
  const { publicKey, serviceId, templateId } = cfg.EMAILJS;
  const emailjs = await loadEmailJs();
  emailjs.init({ publicKey });
  await emailjs.send(serviceId, templateId, {
    to_email: toEmail,
    code,
    store_name: storeName,
    invited_by: invitedBy
  });
  return true;
}

// Sends a checkout email-verification code to `toEmail`. Returns true on
// success, false if EmailJS isn't configured (caller must decide what to do
// — unlike the admin invite flow, there's no safe on-screen fallback here,
// since the whole point is proving the customer can read that inbox).
//
// Uses EMAILJS.checkoutTemplateId if you've set one up, otherwise falls
// back to the same template as the admin invite email. That works, but the
// invite template's wording ("you've been invited...") won't make sense to
// a customer at checkout — worth creating a second, dedicated EmailJS
// template (just needs {{to_email}} and {{code}}) and pointing
// checkoutTemplateId at it.
export async function sendCheckoutVerificationCode({ toEmail, code, storeName = "Ameer Official" }) {
  if (!(await emailJsConfigured())) return false;
  const cfg = await import("../firebase/firebase-config.js");
  const { publicKey, serviceId, templateId, checkoutTemplateId } = cfg.EMAILJS;
  const emailjs = await loadEmailJs();
  emailjs.init({ publicKey });
  await emailjs.send(serviceId, checkoutTemplateId || templateId, {
    to_email: toEmail,
    code,
    store_name: storeName,
    purpose: "checkout verification"
  });
  return true;
}
