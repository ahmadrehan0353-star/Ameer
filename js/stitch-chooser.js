// ============================================================
// AMEER OFFICIAL — Stitched / Unstitched chooser cards
// Additive module: renders two cards into #stitchChooser (if the
// page has one) that filter the listing below via the existing
// ?cat= deep-link support in catalog.js. Nothing else on the
// page is touched — clicking a card just reloads the same page
// with ?cat=Stitched or ?cat=Unstitched, and clicking the active
// card again clears the filter.
// ============================================================

const OPTIONS = [
  {
    label: "Stitched",
    desc: "Ready to wear — pick your size and go.",
    icon: "🧵",
    grad: "linear-gradient(135deg,#1c1c1c 0%,#3a3a3a 100%)",
  },
  {
    label: "Unstitched",
    desc: "Premium fabric, stitched your way.",
    icon: "🪡",
    grad: "linear-gradient(135deg,#6b5436 0%,#a9843c 100%)",
  },
];

function activeCat() {
  return new URLSearchParams(location.search).get("cat") || "";
}

function pageBase() {
  // current page without query — the cards always point back at the
  // same listing page (women.html or men.html).
  return location.pathname.split("/").pop() || "index.html";
}

function injectStyles() {
  if (document.getElementById("stitchChooserCSS")) return;
  const s = document.createElement("style");
  s.id = "stitchChooserCSS";
  s.textContent = `
    #stitchChooser{max-width:1200px;margin:26px auto 0;padding:0 24px}
    #stitchChooser .sc-head{font-size:.8rem;letter-spacing:.14em;text-transform:uppercase;color:#777;margin:0 0 10px}
    #stitchChooser .sc-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
    @media(max-width:560px){#stitchChooser .sc-grid{grid-template-columns:1fr}}
    #stitchChooser .sc-card{position:relative;display:flex;align-items:center;gap:16px;padding:22px 20px;border-radius:14px;color:#fff;text-decoration:none;overflow:hidden;border:2px solid transparent;transition:transform .18s,box-shadow .18s}
    #stitchChooser .sc-card:hover{transform:translateY(-3px);box-shadow:0 12px 28px rgba(0,0,0,.18)}
    #stitchChooser .sc-card .sc-icon{font-size:1.9rem;line-height:1}
    #stitchChooser .sc-card b{display:block;font-size:1.15rem;letter-spacing:.02em}
    #stitchChooser .sc-card small{display:block;opacity:.85;font-size:.8rem;margin-top:3px}
    #stitchChooser .sc-card.on{border-color:#fff;box-shadow:0 0 0 3px rgba(0,0,0,.25)}
    #stitchChooser .sc-card .sc-badge{position:absolute;top:10px;right:12px;background:#fff;color:#111;font-size:.66rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;border-radius:999px;padding:3px 9px}
  `;
  document.head.appendChild(s);
}

function render() {
  const root = document.getElementById("stitchChooser");
  if (!root) return;
  injectStyles();

  const cur = activeCat();
  root.innerHTML = `
    <p class="sc-head">Shop by</p>
    <div class="sc-grid">
      ${OPTIONS.map((o) => {
        const on = cur === o.label;
        // clicking the active card clears the filter (link back without ?cat=)
        const href = on ? pageBase() : `${pageBase()}?cat=${encodeURIComponent(o.label)}`;
        return `<a class="sc-card ${on ? "on" : ""}" href="${href}" style="background:${o.grad}" aria-pressed="${on}">
          <span class="sc-icon">${o.icon}</span>
          <span><b>${o.label}</b><small>${o.desc}</small></span>
          ${on ? `<span class="sc-badge">Showing · tap to clear</span>` : ""}
        </a>`;
      }).join("")}
    </div>`;
}

render();
