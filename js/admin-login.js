import { logIn } from "./auth.js";
import { setAdminSession } from "./admin-guard.js";
import { usingFirebase } from "./admin-data.js";
import { isAdminEmail } from "./admin-team.js";
import { toast, isEmail } from "./utils.js";

const note = document.getElementById("note");
usingFirebase().then((live) => {
  note.innerHTML = live
    ? "Signs in with your Firebase admin account. The address must be verified."
    : "Demo mode: enter one of the admin emails listed in ADMIN_EMAILS in firebase-config.js and any password to preview the dashboard.";
});

document.getElementById("loginBtn").onclick = async () => {
  const btn = document.getElementById("loginBtn");
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  if (!isEmail(email)) { toast("Enter a valid email", "err"); return; }
  btn.disabled = true; btn.textContent = "Signing in…";

  if (!(await usingFirebase())) {
    // demo mode: accept any active admin email (primary or an activated teammate)
    if (!(await isAdminEmail(email))) {
      toast("That email isn't an admin address", "err"); btn.disabled = false; btn.textContent = "Sign in to dashboard"; return;
    }
    setAdminSession(email);
    location.href = "dashboard.html";
    return;
  }
  try {
    const u = await logIn({ email, password });
    if (!(await isAdminEmail(u.email))) { toast("Not an admin account", "err"); btn.disabled = false; btn.textContent = "Sign in to dashboard"; return; }
    location.href = "dashboard.html";
  } catch (e) { toast(e.message || "Sign in failed", "err"); btn.disabled = false; btn.textContent = "Sign in to dashboard"; }
};

document.getElementById("password").addEventListener("keydown", (e) => { if (e.key === "Enter") document.getElementById("loginBtn").click(); });
