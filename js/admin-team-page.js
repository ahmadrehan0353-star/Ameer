import { requireAdmin, renderAdminShell } from "./admin-guard.js";
import { listTeam, inviteTeammate, activateTeammate, resendCode, removeTeammate, emailJsConfigured } from "./admin-team.js";
import { esc, toast, isEmail } from "./utils.js";

let me = null;

(async function () {
  me = await requireAdmin(); if (!me) return;
  const body = renderAdminShell("team", me);
  const jsReady = await emailJsConfigured();

  body.innerHTML = `
    <div class="ad-h"><div><h1>Team</h1><p>Manage who can access this admin dashboard</p></div></div>

    ${jsReady ? "" : `
    <div class="ad-panel">
      <p style="font-size:.9rem;color:var(--ink-soft)">
        <span class="ad-demo">● Email delivery isn't set up yet.</span>
        Invite codes will be shown right here on-screen so you can copy them to your teammate.
        To have codes emailed automatically, add your EmailJS keys to <code>EMAILJS</code> in
        <code>firebase/firebase-config.js</code>.
      </p>
    </div>`}

    <div class="ad-panel">
      <h2>Invite a new admin</h2>
      <div class="ad-form-grid">
        <div class="field"><label>Partner's email</label><input id="t-email" type="email" placeholder="partner@email.com"></div>
        <div class="field"><label>Set a password for them</label><input id="t-pass" type="text" placeholder="At least 6 characters"></div>
      </div>
      <button class="btn btn-primary" id="inviteBtn">Send verification code</button>
      <span id="inviteNote" style="margin-left:12px;font-size:.86rem"></span>
    </div>

    <div class="ad-panel" style="padding:0;overflow-x:auto">
      <table class="ad-table"><thead><tr><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody id="rows"></tbody></table>
    </div>`;

  document.getElementById("t-pass").addEventListener("keydown", (e) => { if (e.key === "Enter") document.getElementById("inviteBtn").click(); });

  document.getElementById("inviteBtn").onclick = async () => {
    const email = document.getElementById("t-email").value.trim();
    const password = document.getElementById("t-pass").value;
    const note = document.getElementById("inviteNote");
    const btn = document.getElementById("inviteBtn");
    if (!isEmail(email)) { toast("Enter a valid email", "err"); return; }
    if (password.length < 6) { toast("Password must be at least 6 characters", "err"); return; }
    btn.disabled = true; btn.textContent = "Sending…";
    try {
      const { code, emailed } = await inviteTeammate({ email, password, invitedByEmail: me.email });
      note.innerHTML = emailed
        ? `<span class="ad-live">✓ Code emailed to ${esc(email)}</span>`
        : `<span class="ad-demo">Code (share this with them): <b style="letter-spacing:.1em">${code}</b></span>`;
      toast(emailed ? "Verification code sent ✦" : "Invite created — share the code shown", "ok");
      document.getElementById("t-email").value = ""; document.getElementById("t-pass").value = "";
      await render();
    } catch (e) { toast(e.message, "err"); }
    btn.disabled = false; btn.textContent = "Send verification code";
  };

  await render();
})();

async function render() {
  const team = await listTeam();
  document.getElementById("rows").innerHTML = team.map((t) => {
    const isPrimary = t.role === "Primary admin";
    const pillClass = t.status === "active" ? "on" : "feat";
    const pillLabel = t.status === "active" ? "Active" : "Pending verification";
    let actions = "";
    if (isPrimary) {
      actions = `<span style="font-size:.8rem;color:var(--ink-soft)">Built-in</span>`;
    } else if (t.status === "pending") {
      actions = `
        <div class="t-actions" style="align-items:center">
          <input class="ad-search" data-code-input="${esc(t.email)}" placeholder="Enter code" style="max-width:130px;padding:6px 10px">
          <button class="mini-btn gold" data-activate="${esc(t.email)}">Activate</button>
          <button class="mini-btn" data-resend="${esc(t.email)}">Resend code</button>
          <button class="mini-btn danger" data-remove="${esc(t.email)}">Cancel</button>
        </div>`;
    } else {
      actions = `<div class="t-actions"><button class="mini-btn danger" data-remove="${esc(t.email)}">Remove access</button></div>`;
    }
    return `<tr>
      <td><b>${esc(t.email)}</b></td>
      <td>${esc(t.role)}</td>
      <td><span class="pill ${pillClass}">${pillLabel}</span></td>
      <td>${actions}</td>
    </tr>`;
  }).join("") || `<tr class="empty-row"><td colspan="4">No admins yet.</td></tr>`;

  document.getElementById("rows").querySelectorAll("[data-activate]").forEach((b) => b.onclick = async () => {
    const email = b.dataset.activate;
    const input = document.querySelector(`[data-code-input="${CSS.escape(email)}"]`);
    const code = input ? input.value.trim() : "";
    if (!code) { toast("Enter the code they received", "err"); return; }
    try {
      await activateTeammate({ email, code });
      toast(`${email} is now an admin ✦`, "ok");
      await render();
    } catch (e) { toast(e.message, "err"); }
  });

  document.getElementById("rows").querySelectorAll("[data-resend]").forEach((b) => b.onclick = async () => {
    const email = b.dataset.resend;
    try {
      const { code, emailed } = await resendCode(email);
      toast(emailed ? `New code emailed to ${email}` : `New code: ${code}`, "ok");
    } catch (e) { toast(e.message, "err"); }
  });

  document.getElementById("rows").querySelectorAll("[data-remove]").forEach((b) => b.onclick = async () => {
    const email = b.dataset.remove;
    if (!confirm(`Remove admin access for ${email}?`)) return;
    try {
      await removeTeammate(email);
      toast("Removed", "ok");
      await render();
    } catch (e) { toast(e.message, "err"); }
  });
}
