// ============================================================
// AMEER OFFICIAL — admin team management
// Lets an existing admin invite a teammate: set their email + a
// password, a 6-digit code is emailed to them, and once the admin
// enters that code back in (relayed from the teammate) the new
// account is activated as a full admin.
//
// Firebase mode: teammates are stored in the `admins` Firestore
// collection and their sign-in accounts live in Firebase Auth.
// Demo mode (no Firebase yet): everything lives in localStorage so
// the whole flow is testable immediately.
// ============================================================
import { lsGet, lsSet, isEmail } from "./utils.js";
import { createTeamAccountLocal } from "./auth.js";
import { sendAdminInviteCode, emailJsConfigured } from "./email-send.js";

const TKEY = "lx-admin-team"; // demo-mode store: { [emailLower]: {email,status,code,invitedBy,createdAt} }

let _fb = null;
async function fb() {
  if (_fb !== null) return _fb;
  try {
    const cfg = await import("../firebase/firebase-config.js");
    if (!cfg.firebaseConfig || String(cfg.firebaseConfig.apiKey).startsWith("PASTE")) { _fb = false; return false; }
    _fb = await import("./firebase.js");
    return _fb;
  } catch { _fb = false; return false; }
}

async function primaryAdmins() {
  try {
    const cfg = await import("../firebase/firebase-config.js");
    const list = cfg.ADMIN_EMAILS || (cfg.ADMIN_EMAIL ? [cfg.ADMIN_EMAIL] : []);
    return list.map((e) => (e || "").toLowerCase()).filter(Boolean);
  } catch { return []; }
}

// True only for the owner accounts hardcoded in ADMIN_EMAILS — invited
// teammates are NOT primary admins and cannot manage the team.
export async function isPrimaryAdmin(email) {
  const e = (email || "").trim().toLowerCase();
  if (!e) return false;
  return (await primaryAdmins()).includes(e);
}

function genCode() {
  return String(Math.floor(100000 + Math.random() * 900000)); // 6 digits
}

/* ---------------- local demo-mode store ---------------- */
function localTeam() { return lsGet(TKEY, {}); }
function saveLocalTeam(t) { lsSet(TKEY, t); }

/* ---------------- public API ---------------- */

// Every admin: the primary (built-in) list plus invited teammates.
export async function listTeam() {
  const primary = (await primaryAdmins()).map((email) => ({ email, status: "active", role: "Primary admin" }));
  const f = await fb();
  let team = [];
  if (f) {
    const snap = await f.getDocs(f.collection(f.db, "admins"));
    team = snap.docs.map((d) => ({ ...d.data(), role: "Invited admin" }));
  } else {
    team = Object.values(localTeam()).map((t) => ({ ...t, role: "Invited admin" }));
  }
  // don't double-list someone who is also a primary admin
  const primaryEmails = new Set(primary.map((p) => p.email));
  return [...primary, ...team.filter((t) => !primaryEmails.has((t.email || "").toLowerCase()))];
}

// Checks whether an email is allowed into the admin dashboard right now
// (primary admin, or an invited teammate whose status is "active").
//
// This is UI gating only — the real gate is the Firestore rules. Never add
// a "if the config still has the placeholder, let everyone in" shortcut
// here: it used to say `|| primary.includes("your-email@example.com")`,
// which handed the dashboard to any signed-in visitor the moment that
// placeholder found its way back into ADMIN_EMAILS.
export async function isAdminEmail(email) {
  const e = (email || "").toLowerCase();
  if (!e) return false;
  const primary = await primaryAdmins();
  if (primary.includes(e)) return true;

  const f = await fb();
  if (f) {
    try {
      const snap = await f.getDoc(f.doc(f.db, "admins", e));
      return snap.exists() && snap.data().status === "active";
    } catch { return false; }
  }
  const t = localTeam()[e];
  return !!t && t.status === "active";
}

// Step 1: admin enters a teammate's email + sets a password.
// Creates the sign-in account, stores a pending invite with a fresh
// code, and emails that code to the teammate. Returns the code too,
// so the UI can show it directly if email sending isn't set up yet.
export async function inviteTeammate({ email, password, invitedByEmail }) {
  const e = (email || "").trim().toLowerCase();
  if (!isEmail(e)) throw new Error("Enter a valid email address.");
  if ((password || "").length < 6) throw new Error("Password must be at least 6 characters.");
  if (await isAdminEmail(e)) throw new Error("That email is already an admin.");

  const code = genCode();
  const f = await fb();

  if (f) {
    // Create their sign-in account without disturbing the current admin's session.
    try {
      await f.createTeammateAccount(e, password);
    } catch (err) {
      if (err.code !== "auth/email-already-in-use") throw err;
      // They already have an account (e.g. as a customer) — that's fine,
      // they'll sign in to /admin with their existing password. Note we
      // can't send them a verification email here (that needs their
      // session), and the Firestore rules require a verified address —
      // so if they've never verified, they'll be bounced back to the
      // login page and need to verify from their own account first.
    }
    await f.setDoc(f.doc(f.db, "admins", e), {
      email: e, status: "pending", code, invitedBy: invitedByEmail || "", createdAt: f.serverTimestamp()
    });
  } else {
    createTeamAccountLocal({ email: e, password });
    const t = localTeam();
    t[e] = { email: e, status: "pending", code, invitedBy: invitedByEmail || "", createdAt: new Date().toISOString() };
    saveLocalTeam(t);
  }

  let emailed = false;
  try { emailed = await sendAdminInviteCode({ toEmail: e, code, invitedBy: invitedByEmail || "" }); }
  catch (err) { console.warn("invite email failed:", err); }

  return { code, emailed };
}

// Resend a fresh code to a pending teammate.
export async function resendCode(email) {
  const e = (email || "").toLowerCase();
  const code = genCode();
  const f = await fb();
  if (f) {
    await f.updateDoc(f.doc(f.db, "admins", e), { code });
  } else {
    const t = localTeam();
    if (t[e]) { t[e].code = code; saveLocalTeam(t); }
  }
  let emailed = false;
  try { emailed = await sendAdminInviteCode({ toEmail: e, code }); }
  catch (err) { console.warn("resend email failed:", err); }
  return { code, emailed };
}

// Step 2: admin enters the code the teammate received. Activates them.
export async function activateTeammate({ email, code }) {
  const e = (email || "").toLowerCase();
  const enteredCode = (code || "").trim();
  const f = await fb();

  if (f) {
    const ref = f.doc(f.db, "admins", e);
    const snap = await f.getDoc(ref);
    if (!snap.exists()) throw new Error("No invite found for that email.");
    if (snap.data().code !== enteredCode) throw new Error("That code doesn't match.");
    await f.updateDoc(ref, { status: "active", activatedAt: f.serverTimestamp() });
    return;
  }
  const t = localTeam();
  if (!t[e]) throw new Error("No invite found for that email.");
  if (t[e].code !== enteredCode) throw new Error("That code doesn't match.");
  t[e].status = "active";
  saveLocalTeam(t);
}

// Revoke a teammate's admin access.
export async function removeTeammate(email) {
  const e = (email || "").toLowerCase();
  const f = await fb();
  if (f) { await f.deleteDoc(f.doc(f.db, "admins", e)); return; }
  const t = localTeam();
  delete t[e];
  saveLocalTeam(t);
}

export { emailJsConfigured };
