// ============================================================
// AMEER OFFICIAL — Size chart (additive module)
// Adds a "Size chart" link next to the Size picker on the product
// page and shows the chart in a popup with a Cm / In toggle.
// Survives the page's own re-renders (size/colour clicks) via a
// MutationObserver, so nothing in product.js's rendering changes.
//
// Measurements below are in INCHES (as provided); the Cm view is
// converted automatically (×2.54, shown to 1 decimal).
// To edit the chart, just change the numbers in SECTIONS.
// ============================================================

const SIZES = ["S", "M", "L", "XL"];

const SECTIONS = [
  {
    name: "Kurta",
    rows: [
      ["Chest",    18.5, 20,   22,   23.5],
      ["Hips",     20,   22,   24,   26],
      ["Length",   46,   46,   46,   46],
      ["Shoulder", 14,   15,   16,   17],
      ["Waist",    17.5, 18.5, 20.5, 22],
    ],
  },
  {
    name: "Trouser",
    rows: [
      ["Hip",    21,   22,   23,   24],
      ["Length", 36,   37,   38,   39],
      ["Thigh",  13,   14,   14.5, 16],
      ["Waist",  14.5, 16.5, 18,   20],
    ],
  },
];

// Which categories get the chart. Both women and men use the same
// Kurta/Trouser chart for now — swap either for its own SECTIONS-style
// array if you're given a separate chart later.
const SIZE_CHARTS = {
  women: { title: "Size chart", sections: SECTIONS },
  men:   { title: "Size chart", sections: SECTIONS },
  kids:  null, // no chart yet — the link simply won't appear for kids products
};

let chartFor = null;
let unit = "in"; // "in" | "cm"

export function mountSizeChart(product) {
  chartFor = SIZE_CHARTS[String(product?.category || "").toLowerCase()] || null;
  if (!chartFor) return;

  ensureDialog();
  injectLink();

  // product.js re-renders the whole PDP when a size/colour is clicked,
  // which wipes our link — watch the root and re-inject when needed.
  const root = document.getElementById("pdpRoot");
  if (root && !root.__sizeChartObserved) {
    root.__sizeChartObserved = true;
    new MutationObserver(() => injectLink()).observe(root, { childList: true, subtree: true });
  }
}

function injectLink() {
  if (!chartFor || document.getElementById("sizeChartLink")) return;
  const sizeRow = document.getElementById("sizePicks");
  if (!sizeRow) return; // unstitched products have no size row — no link
  const label = sizeRow.previousElementSibling; // the "Size" opt-label div
  const a = document.createElement("a");
  a.id = "sizeChartLink";
  a.href = "#";
  a.textContent = "📏 Size chart";
  a.style.cssText = "margin-left:auto;font-size:.8rem;text-decoration:underline;cursor:pointer;color:var(--ink,#111)";
  a.addEventListener("click", (e) => { e.preventDefault(); document.getElementById("sizeChartDlg")?.showModal(); });
  if (label && label.classList.contains("opt-label")) {
    label.style.display = "flex";
    label.style.alignItems = "center";
    label.appendChild(a);
  } else {
    sizeRow.parentElement?.appendChild(a);
  }
}

function fmt(v) {
  if (unit === "in") return String(v);
  const cm = v * 2.54;
  return (Math.round(cm * 10) / 10).toString();
}

function tablesHTML() {
  const u = unit === "in" ? "In" : "Cm";
  return chartFor.sections.map((sec) => `
    <h4 style="margin:18px 0 8px;font-size:1.05rem">${sec.name}</h4>
    <div style="overflow-x:auto">
      <table style="border-collapse:collapse;width:100%;font-size:.85rem">
        <thead><tr>
          <th style="text-align:left;padding:8px 10px;border-bottom:2px solid #111">Sizes</th>
          ${SIZES.map((s) => `<th style="text-align:center;padding:8px 10px;border-bottom:2px solid #111;white-space:nowrap">${s} (${u})</th>`).join("")}
        </tr></thead>
        <tbody>${sec.rows.map((r) => `
          <tr>
            <td style="text-align:left;padding:8px 10px;border-bottom:1px solid #eee;font-weight:600">${r[0]}</td>
            ${r.slice(1).map((v) => `<td style="text-align:center;padding:8px 10px;border-bottom:1px solid #eee">${fmt(v)}</td>`).join("")}
          </tr>`).join("")}
        </tbody>
      </table>
    </div>`).join("");
}

function ensureDialog() {
  if (document.getElementById("sizeChartDlg")) return;
  const dlg = document.createElement("dialog");
  dlg.id = "sizeChartDlg";
  dlg.style.cssText = "border:0;border-radius:14px;padding:0;max-width:min(94vw,560px);box-shadow:0 24px 60px rgba(0,0,0,.3)";
  dlg.innerHTML = `
    <div style="padding:20px 22px 18px">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap">
        <h3 style="margin:0;font-size:1.15rem">${chartFor.title}</h3>
        <div style="display:flex;align-items:center;gap:10px">
          <div id="unitToggle" style="display:inline-flex;background:#f2f2f2;border-radius:10px;padding:3px">
            <button data-u="cm" style="border:0;border-radius:8px;padding:6px 16px;cursor:pointer;font-weight:600;background:transparent">Cm</button>
            <button data-u="in" style="border:0;border-radius:8px;padding:6px 16px;cursor:pointer;font-weight:600;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.15)">In</button>
          </div>
          <button id="sizeChartClose" style="border:1px solid #ddd;background:#fff;border-radius:8px;padding:6px 12px;cursor:pointer;font-weight:600">Close</button>
        </div>
      </div>
      <div id="sizeChartTables">${tablesHTML()}</div>
      <p style="margin:12px 0 0;color:#777;font-size:.75rem">Garment measurements, laid flat. For the best fit, compare with a kurta and trouser you already own.</p>
    </div>`;
  document.body.appendChild(dlg);

  dlg.querySelector("#sizeChartClose").addEventListener("click", () => dlg.close());
  dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });

  dlg.querySelector("#unitToggle").addEventListener("click", (e) => {
    const b = e.target.closest("[data-u]");
    if (!b || b.dataset.u === unit) return;
    unit = b.dataset.u;
    dlg.querySelectorAll("#unitToggle [data-u]").forEach((x) => {
      const on = x.dataset.u === unit;
      x.style.background = on ? "#fff" : "transparent";
      x.style.boxShadow = on ? "0 1px 3px rgba(0,0,0,.15)" : "none";
    });
    dlg.querySelector("#sizeChartTables").innerHTML = tablesHTML();
  });
}
