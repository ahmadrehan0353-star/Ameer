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
    icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3l4 3 4-3 5 4-3 4-2-1v10H8V10l-2 1-3-4 5-4Z"/></svg>',
    tint: "var(--peach)",
  },
  {
    label: "Unstitched",
    desc: "Premium fabric, stitched your way.",
    icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="6" cy="7" r="3"/><circle cx="6" cy="17" r="3"/><path d="M8.5 8.5L21 18M8.5 15.5L21 6"/></svg>',
    tint: "var(--brand-soft)",
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
    #stitchChooser{max-width:var(--wrap);margin:24px auto 0;padding:0 24px}
    #stitchChooser .sc-head{font-size:.9rem;font-weight:800;color:var(--ink);margin:0 0 10px}
    #stitchChooser .sc-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
    @media(max-width:600px){#stitchChooser{padding:0 16px}#stitchChooser .sc-grid{grid-template-columns:1fr;gap:10px}}
    #stitchChooser .sc-card{position:relative;display:flex;align-items:center;gap:16px;padding:20px 22px;border-radius:var(--radius);color:var(--ink);text-decoration:none;border:2px solid transparent;transition:transform .15s,box-shadow .15s}
    #stitchChooser .sc-card:hover{transform:translateY(-2px);box-shadow:var(--shadow)}
    #stitchChooser .sc-card .sc-icon{flex:none;width:48px;height:48px;border-radius:50%;background:var(--surface);display:grid;place-items:center}
    #stitchChooser .sc-card .sc-icon svg{width:22px;height:22px;stroke:var(--accent);fill:none;stroke-width:1.7;stroke-linejoin:round;stroke-linecap:round}
    #stitchChooser .sc-card b{display:block;font-size:1.1rem;font-weight:800}
    #stitchChooser .sc-card small{display:block;color:var(--ink-soft);font-size:.86rem;margin-top:2px}
    #stitchChooser .sc-card.on{border-color:var(--ink)}
    #stitchChooser .sc-card .sc-badge{margin-left:auto;background:var(--ink);color:var(--bg);font-size:.72rem;font-weight:700;border-radius:999px;padding:5px 11px;white-space:nowrap}
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
        return `<a class="sc-card ${on ? "on" : ""}" href="${href}" style="background:${o.tint}" aria-pressed="${on}">
          <span class="sc-icon">${o.icon}</span>
          <span><b>${o.label}</b><small>${o.desc}</small></span>
          ${on ? `<span class="sc-badge">Showing · tap to clear</span>` : ""}
        </a>`;
      }).join("")}
    </div>`;
}

render();
