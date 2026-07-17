// ============================================================
// AMEER OFFICIAL — authentication layer
// Wraps Firebase Auth + a Firestore user profile.
// Falls back to a local "demo account" mode when Firebase
// isn't configured yet, so login/signup/checkout are testable
// immediately (the same philosophy as the seed catalog).
// ============================================================
import { lsGet, lsSet, isEmail } from "./utils.js";

let _firebase = null;      // cached firebase module (or false if unavailable)
let _profileCache = null;

async function fb() {
  if (_firebase !== null) return _firebase;
  try {
    const cfg = await import("../firebase/firebase-config.js");
    if (!cfg.firebaseConfig || String(cfg.firebaseConfig.apiKey).startsWith("PASTE")) {
      _firebase = false;            // not configured yet
      return false;
    }
    _firebase = await import("./firebase.js");
    return _firebase;
  } catch {
    _firebase = false;
    return false;
  }
}

/* ---------------- local demo-account fallback ---------------- */
const LKEY = "lx-accounts";          // { email: {name,email,pass} }
const SKEY = "lx-session";           // current email

function localSignup({ name, email, password }) {
  const accts = lsGet(LKEY, {});
  if (accts[email]) throw new Error("An account with this email already exists.");
  accts[email] = { name, email, pass: password };
  lsSet(LKEY, accts);
  lsSet(SKEY, email);
  return { uid: "local:" + email, email, displayName: name };
}
function localLogin({ email, password }) {
  const accts = lsGet(LKEY, {});
  const a = accts[email];
  if (!a || a.pass !== password) throw new Error("Email or password is incorrect.");
  lsSet(SKEY, email);
  return { uid: "local:" + email, email, displayName: a.name };
}
function localUser() {
  const email = lsGet(SKEY, null);
  if (!email) return null;
  const a = lsGet(LKEY, {})[email];
  return a ? { uid: "local:" + email, email, displayName: a.name } : null;
}

// Creates a demo-mode account for someone else (e.g. an invited admin
// teammate) WITHOUT touching the current browser's signed-in session.
export function createTeamAccountLocal({ email, password, name = "" }) {
  const accts = lsGet(LKEY, {});
  accts[email] = { name: name || email, email, pass: password };
  lsSet(LKEY, accts);
}

/* ---------------- public API ---------------- */
export async function signUp({ name, email, password }) {
  if (!name?.trim()) throw new Error("Please enter your name.");
  if (!isEmail(email)) throw new Error("Please enter a valid email.");
  if ((password || "").length < 6) throw new Error("Password must be at least 6 characters.");

  const f = await fb();
  if (!f) return localSignup({ name, email, password });

  const cred = await f.createUserWithEmailAndPassword(f.auth, email, password);
  await f.updateProfile(cred.user, { displayName: name });
  // send a real verification email (link-based) via Firebase
  try { await f.sendEmailVerification(cred.user); } catch (e) { console.warn("verification email:", e); }
  // create a Firestore profile document
  await f.setDoc(f.doc(f.db, "users", cred.user.uid), {
    name, email, createdAt: f.serverTimestamp(), addresses: [], role: "customer", banned: false
  });
  return cred.user;
}

// Resend the verification email to the currently signed-in user.
export async function resendVerification() {
  const f = await fb();
  if (!f || !f.auth.currentUser) throw new Error("Please sign in first.");
  await f.sendEmailVerification(f.auth.currentUser);
}

export async function logIn({ email, password }) {
  if (!isEmail(email)) throw new Error("Please enter a valid email.");
  const f = await fb();
  if (!f) return localLogin({ email, password });
  const cred = await f.signInWithEmailAndPassword(f.auth, email, password);
  // check the banned flag on the user's profile
  try {
    const snap = await f.getDoc(f.doc(f.db, "users", cred.user.uid));
    if (snap.exists() && snap.data().banned === true) {
      await f.signOut(f.auth);
      throw new Error("This account has been suspended. Please contact support.");
    }
  } catch (e) {
    if (e.message.includes("suspended")) throw e;
  }
  return cred.user;
}

export async function logOut() {
  const f = await fb();
  if (!f) { lsSet(SKEY, null); return; }
  await f.signOut(f.auth);
}

export async function resetPassword(email) {
  if (!isEmail(email)) throw new Error("Please enter a valid email.");
  const f = await fb();
  if (!f) throw new Error("Password reset requires Firebase to be connected. For now, sign up again with a new password.");
  await f.sendPasswordResetEmail(f.auth, email);
}

// Calls back with the current user (or null) and keeps listening.
export async function onUser(cb) {
  const f = await fb();
  if (!f) { cb(localUser()); return; }
  f.onAuthStateChanged(f.auth, cb);
}

// One-shot: resolve the current user once.
export async function currentUser() {
  const f = await fb();
  if (!f) return localUser();
  return new Promise((res) => {
    const unsub = f.onAuthStateChanged(f.auth, (u) => { unsub(); res(u); });
  });
}

/* ---------------- user profile (addresses etc.) ---------------- */
export async function getProfile(user) {
  if (!user) return null;
  const f = await fb();
  if (!f) {
    return lsGet("lx-profile:" + user.email, { name: user.displayName, email: user.email, addresses: [] });
  }
  const snap = await f.getDoc(f.doc(f.db, "users", user.uid));
  return snap.exists() ? snap.data() : { name: user.displayName, email: user.email, addresses: [] };
}

export async function saveAddresses(user, addresses) {
  const f = await fb();
  if (!f) { lsSet("lx-profile:" + user.email, { name: user.displayName, email: user.email, addresses }); return; }
  await f.updateDoc(f.doc(f.db, "users", user.uid), { addresses });
}

/* ---------------- orders ---------------- */
// The order number IS the Firestore document id, and anyone who knows it can
// read the order (that's how guest tracking works without a login — see the
// `allow get` rule on /orders). So it has to be long enough that guessing is
// hopeless: the old 1-letter + 4-digit format had only 260,000 possibilities
// and could be brute-forced in minutes, exposing every customer's name,
// address and phone number. 12 characters from this 23-char alphabet is
// ~2.2e16 combinations.
//
// Ambiguous characters (0/O, 1/I/L, 2/Z, 5/S, 6/G, 8/B) are left out so people
// can still read the number off a screen or say it back over the phone.
const CODE_CHARS = "ACDEFHJKMNPQRTUVWXY3479";
const CODE_LEN = 12;

// Uniform pick from `set`. Plain `% set.length` skews toward the first few
// characters, so throw away the values that would land in the short tail.
function randChar(set) {
  const buf = new Uint32Array(1);
  const crypto = globalThis.crypto || globalThis.msCrypto;
  const ceiling = Math.floor(4294967296 / set.length) * set.length;
  do { crypto.getRandomValues(buf); } while (buf[0] >= ceiling);
  return set[buf[0] % set.length];
}

function makeOrderCode() {
  return Array.from({ length: CODE_LEN }, () => randChar(CODE_CHARS)).join("");
}

// Stored bare ("K7X4M2PQ9RTV"), shown in groups of four ("K7X4-M2PQ-9RTV").
// Only ever display the formatted one; only ever store/look up the bare one.
export function formatOrderCode(id) {
  const bare = String(id || "").toUpperCase();
  if (bare.length !== CODE_LEN) return bare;  // legacy short codes, shown as-is
  return bare.match(/.{1,4}/g).join("-");
}

// Whatever the customer types — with dashes, spaces, lowercase — back into
// the bare id. Anything that isn't a code character is simply dropped.
export function normalizeOrderCode(input) {
  return String(input || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export async function placeOrder(user, order) {
  const email = user?.email || order?.address?.email || null;
  const rec = {
    ...order,
    uid: user?.uid || "guest",
    email,
    guest: !user,
    status: "pending"
  };

  const f = await fb();
  if (!f) {
    const code = makeOrderCode();
    const key = "lx-orders:" + (email || "guest");
    const list = lsGet(key, []);
    const local = { ...rec, id: code, createdAt: new Date().toISOString() };
    list.unshift(local);
    lsSet(key, list);
    lsSet("lx-order:" + code, local);   // so guest tracking works offline too
    return local;
  }

  // The order number IS the document id, so tracking is a single direct
  // lookup. At 12 characters a collision is vanishingly unlikely, but a
  // collision would silently overwrite someone else's order, so it's worth
  // one cheap read to be sure the number is free before using it.
  let code, taken = true, attempts = 0;
  do {
    code = makeOrderCode();
    taken = (await f.getDoc(f.doc(f.db, "orders", code))).exists();
    attempts++;
  } while (taken && attempts < 6);

  await f.setDoc(f.doc(f.db, "orders", code), { ...rec, createdAt: f.serverTimestamp() });
  return { id: code, ...rec };
}

// Look up one order by its number — no login required.
export async function trackOrder(code) {
  const id = normalizeOrderCode(code);
  if (!id) return null;
  const f = await fb();
  if (!f) return lsGet("lx-order:" + id, null);
  try {
    const snap = await f.getDoc(f.doc(f.db, "orders", id));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  } catch {
    return null;
  }
}

export async function getOrders(user) {
  if (!user) return [];
  const f = await fb();
  if (!f) return lsGet("lx-orders:" + user.email, []);
  const q = f.query(f.collection(f.db, "orders"), f.where("uid", "==", user.uid));
  const snap = await f.getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
}
