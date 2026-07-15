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
