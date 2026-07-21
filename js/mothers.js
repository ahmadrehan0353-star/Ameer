// ============================================================
// AMEER OFFICIAL — Mother Collection '26 page
// ============================================================
import { renderNavbar } from "./navbar.js";
import { renderFooter, initReveal } from "./app.js";
import { loadProducts } from "./products.js";
import { renderGrid } from "./product-card.js";
import { param } from "./utils.js";

(async function () {
  renderNavbar("women");
  renderFooter();

  // show skeleton loaders while fetching
  const grid = document.getElementById("plpGrid");
  const count = document.getElementById("plpCount");
  if (grid) {
    grid.innerHTML = Array(8).fill(0).map(() =>
      `<div class="p-card skel" style="aspect-ratio:3/4;border-radius:4px;background:var(--surface-raised,#f2f0ee);animation:skelly 1.4s ease-in-out infinite alternate"></div>`
    ).join("");
  }

  const all = await loadProducts();
  const products = all.filter(p => p.collection === "mothers26");

  if (count) count.textContent = `${products.length} design${products.length !== 1 ? "s" : ""}`;

  if (!products.length) {
    if (grid) grid.innerHTML = `<p style="grid-column:1/-1;text-align:center;padding:60px 0;color:var(--ink-soft)">No products found — add them from the admin panel.</p>`;
    return;
  }

  renderGrid("plpGrid", products);
  initReveal();
})();
