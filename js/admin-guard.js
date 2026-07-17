// ============================================================
// AMEER OFFICIAL — admin shell: guards the route + renders sidebar
// Only emails listed in ADMIN_EMAILS may enter. When Firebase isn't set up,
// a local admin session (set on the admin login page) is used.
// ============================================================
import { currentUser, logOut } from "./auth.js";
import { esc, lsGet } from "./utils.js";
import { initTheme, toggleTheme } from "./utils.js";
import { usingFirebase } from "./admin-data.js";
import { isAdminEmail } from "./admin-team.js";

// Returns the signed-in admin, or redirects to admin login.
export async function requireAdmin() {
  initTheme();

  // local demo admin session
  if (!(await usingFirebase())) {
    const local = lsGet("lx-admin-session", null);
    if (local && (await isAdminEmail(local))) {
      return { email: local, displayName: "Admin" };
    }
    location.href = "login.html";
    return null;
  }

  // Firebase mode
  const u = await currentUser();
  if (!u || !(await isAdminEmail(u.email))) {
    location.href = "login.html";
    return null;
  }

  // The Firestore rules only count a VERIFIED email as an admin. Without
  // this check the dashboard would open normally — every read is public —
  // and then silently reject every save with a permissions error. Better to
  // say so here than to let someone wonder why nothing sticks.
  if (u.emailVerified !== true) {
    showUnverifiedNotice(u);
    return null;
  }

  return u;
}

function showUnverifiedNotice(user) {
  const shell = document.getElementById("adminShell") || document.body;
  shell.innerHTML = `
    <div style="max-width:520px;margin:12vh auto;padding:32px;text-align:center;font-family:inherit;color:var(--ink)">
      <h1 style="margin:0 0 12px">Verify your email first</h1>
      <p style="color:var(--ink-soft);line-height:1.6">
        <b>${esc(user.email || "")}</b> is on the admin list, but the address
        hasn't been verified yet. The database rejects admin changes from
        unverified accounts, so the dashboard would load but nothing you saved
        would stick.
      </p>
      <p style="color:var(--ink-soft);line-height:1.6">
        Click the link in the verification email, then reload this page.
      </p>
      <div style="display:flex;gap:10px;justify-content:center;margin-top:22px;flex-wrap:wrap">
        <button class="btn btn-primary" id="vfResend" type="button">Resend verification email</button>
        <button class="btn btn-line" id="vfReload" type="button">I've verified — reload</button>
      </div>
      <p style="margin-top:18px"><a href="login.html" id="vfOut" style="color:var(--ink-soft);font-size:.9rem">Sign out</a></p>
      <p id="vfMsg" style="margin-top:14px;font-size:.9rem;color:var(--ink-soft)"></p>
    </div>`;

  const msg = document.getElementById("vfMsg");
  document.getElementById("vfResend").onclick = async () => {
    try {
      const { resendVerification } = await import("./auth.js");
      await resendVerification();
      msg.textContent = "Sent. Check your inbox (and spam).";
    } catch (e) {
      msg.textContent = e?.message || "Couldn't send it — try signing out and back in.";
    }
  };
  // emailVerified is baked into the cached token; force a refresh so we
  // don't tell someone who just verified that they still haven't.
  document.getElementById("vfReload").onclick = async () => {
    try {
      const { auth } = await import("./firebase.js");
      await auth.currentUser?.reload();
      await auth.currentUser?.getIdToken(true);
    } catch {}
    location.reload();
  };
  document.getElementById("vfOut").onclick = async (e) => {
    e.preventDefault();
    clearAdminSession(); await logOut(); location.href = "login.html";
  };
}

const NAV = [
  ["dashboard", "Dashboard", "M4 13h6V4H4zM14 20h6v-9h-6zM4 20h6v-5H4zM14 8h6V4h-6z"],
  ["products", "Products", "M20 7L12 3 4 7v10l8 4 8-4z M4 7l8 4 8-4 M12 11v10"],
  ["orders", "Orders", "M6 2h9l3 3v17H6z M9 9h6 M9 13h6 M9 17h4"],
  ["customers", "Customers", "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M2 21c0-4 3.5-6 7-6s7 2 7 6 M17 11a3 3 0 1 0 0-6"],
  ["categories", "Categories", "M4 4h7v7H4z M13 4h7v7h-7z M4 13h7v7H4z M13 13h7v7h-7z"],
  ["inventory", "Inventory", "M3 7l9-4 9 4v10l-9 4-9-4z M3 7l9 4 9-4 M12 11v10"],
  ["coupons", "Coupons", "M3 9a2 2 0 0 0 0 6v3h18v-3a2 2 0 0 1 0-6V6H3z M12 6v12"],
  ["reviews", "Reviews", "M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.3 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z"],
  ["banners", "Banners", "M3 5h18v10H3z M3 15l5-4 4 3 3-2 6 5"],
  ["analytics", "Analytics", "M4 20V10 M10 20V4 M16 20v-7 M22 20H2"],
  ["team", "Team", "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M2 21c0-4 3.5-6 7-6s7 2 7 6 M17 11a3 3 0 1 0 0-6 M22 21c0-3-2-5-4.5-5.7 M16 4.2a4 4 0 0 1 0 7.6"],
  ["settings", "Settings", "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19 12l2-1-1-3-2 .5-1.5-1.3.3-2.2L14 4l-2 1.5L10 4 7 5l.3 2.2L5.8 8.5 4 8 3 11l2 1-2 1 1 3 2-.5 1.5 1.3-.3 2.2L10 20l2-1.5L14 20l3-1-.3-2.2 1.5-1.3 2 .5 1-3z"]
];

export function renderAdminShell(active, user) {
  initTheme();
  const shell = document.getElementById("adminShell");
  shell.innerHTML = `
    <aside class="ad-side" id="adSide">
      <div class="ad-brand">
        <a href="dashboard.html">
          <span class="brandmark on-dark">
            <span class="brandmark-top">AMEER</span>
            <span class="brandmark-line"></span>
            <span class="brandmark-bottom">OFFICIAL</span>
          </span>
        </a>
        <small>Admin</small>
      </div>
      <nav class="ad-nav">
        ${NAV.map(([slug, label, path]) => `
          <a href="${slug}.html" class="${active === slug ? "on" : ""}">
            <svg viewBox="0 0 24 24">${path.split(" M").map((d, i) => `<path d="${i ? "M" + d : d}"/>`).join("")}</svg>
            <span>${label}</span>
          </a>`).join("")}
      </nav>
      <div class="ad-side-foot">
        <a href="../index.html" target="_blank">↗ View store</a>
        <button id="adLogout">Sign out</button>
      </div>
    </aside>
    <div class="ad-main">
      <header class="ad-top">
        <button class="ad-burger" id="adBurger" aria-label="Menu"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>
        <div class="ad-mode" id="adMode"></div>
        <div class="ad-top-right">
          <button class="ad-icon" id="adTheme" aria-label="Theme"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/></svg></button>
          <div class="ad-user">${esc((user?.displayName || user?.email || "Admin"))}</div>
        </div>
      </header>
      <main class="ad-body" id="adBody"></main>
    </div>`;

  document.getElementById("adLogout").onclick = async () => {
    const { clearAdminSession } = await import("./admin-guard.js");
    clearAdminSession(); await logOut(); location.href = "login.html";
  };
  document.getElementById("adTheme").onclick = toggleTheme;
  document.getElementById("adBurger").onclick = () => document.getElementById("adSide").classList.toggle("open");

  usingFirebase().then((live) => {
    document.getElementById("adMode").innerHTML = live
      ? `<span class="ad-live">● Live · Firebase connected</span>`
      : `<span class="ad-demo">● Demo mode · changes saved in this browser</span>`;
  });

  return document.getElementById("adBody");
}

export function setAdminSession(email) { localStorage.setItem("lx-admin-session", JSON.stringify(email)); }
export function clearAdminSession() { localStorage.removeItem("lx-admin-session"); }
