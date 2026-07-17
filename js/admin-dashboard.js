import { requireAdmin, renderAdminShell } from "./admin-guard.js";
import { adminListProducts, adminListOrders, adminListCustomers } from "./admin-data.js";
import { money, esc, optimizeImg } from "./utils.js";

(async function () {
  const user = await requireAdmin(); if (!user) return;
  const body = renderAdminShell("dashboard", user);

  const [products, orders, customers] = await Promise.all([
    adminListProducts(), adminListOrders(), adminListCustomers()
  ]);

  // Revenue only counts orders that have actually been delivered — a
  // "pending" or "cancelled" order isn't money in the bank yet, so it
  // shouldn't inflate this number. Change an order's status to Delivered
  // on the Orders page and it'll show up here.
  const deliveredOrders = orders.filter((o) => (o.status || "pending") === "delivered");
  const revenue = deliveredOrders.reduce((s, o) => s + (o.totals?.total || 0), 0);
  const lowStock = products.filter((p) => (p.stock ?? 0) > 0 && (p.stock ?? 0) <= 8);
  const outStock = products.filter((p) => (p.stock ?? 0) === 0);

  // Real trend lines instead of hardcoded placeholder percentages: how many
  // orders/new customers landed in the last 30 days vs the 30 days before
  // that. toMs() handles both Firestore Timestamps ({seconds}) and the
  // plain ISO strings used by seed/local data.
  const toMs = (ts) => ts?.seconds ? ts.seconds * 1000 : (ts ? new Date(ts).getTime() || 0 : 0);
  const pct = (now, prev) => prev === 0 ? (now > 0 ? 100 : 0) : Math.round(((now - prev) / prev) * 100);
  const DAY = 86400000, since30 = Date.now() - 30 * DAY, since60 = Date.now() - 60 * DAY;
  const inWindow = (ms, from, to) => ms >= from && ms < to;

  const ordersNow = orders.filter((o) => toMs(o.createdAt) >= since30).length;
  const ordersPrev = orders.filter((o) => inWindow(toMs(o.createdAt), since60, since30)).length;
  const ordersDelta = pct(ordersNow, ordersPrev);

  const customersNow = customers.filter((c) => toMs(c.createdAt) >= since30).length;
  const customersPrev = customers.filter((c) => inWindow(toMs(c.createdAt), since60, since30)).length;
  const customersDelta = pct(customersNow, customersPrev);

  // top sellers by units in orders
  const unitMap = {};
  orders.forEach((o) => (o.items || []).forEach((i) => { unitMap[i.name] = (unitMap[i.name] || 0) + i.qty; }));
  const topSellers = Object.entries(unitMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

  body.innerHTML = `
    <div class="ad-h"><div><h1>Dashboard</h1><p>Store overview at a glance</p></div></div>

    <div class="ad-stats">
      <div class="stat"><div class="ic"><svg viewBox="0 0 24 24"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></div>
        <div class="label">Revenue</div><div class="num">${money(revenue)}</div><div class="delta up">${deliveredOrders.length} delivered order${deliveredOrders.length === 1 ? "" : "s"}</div></div>
      <div class="stat"><div class="ic"><svg viewBox="0 0 24 24"><path d="M6 2h9l3 3v17H6z M9 9h6 M9 13h6"/></svg></div>
        <div class="label">Orders</div><div class="num">${orders.length}</div><div class="delta ${ordersDelta >= 0 ? "up" : "down"}">${ordersDelta >= 0 ? "▲" : "▼"} ${Math.abs(ordersDelta)}% vs prior 30 days</div></div>
      <div class="stat"><div class="ic"><svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6"/></svg></div>
        <div class="label">Customers</div><div class="num">${customers.length}</div><div class="delta ${customersDelta >= 0 ? "up" : "down"}">${customersDelta >= 0 ? "▲" : "▼"} ${Math.abs(customersDelta)}% vs prior 30 days</div></div>
      <div class="stat"><div class="ic"><svg viewBox="0 0 24 24"><path d="M20 7L12 3 4 7v10l8 4 8-4z"/></svg></div>
        <div class="label">Products</div><div class="num">${products.length}</div><div class="delta ${outStock.length ? "down" : "up"}">${outStock.length} out of stock</div></div>
    </div>

    <div class="ad-grid-2">
      <div class="ad-panel">
        <h2>Recent orders</h2>
        <table class="ad-table"><thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Status</th></tr></thead>
        <tbody>${orders.slice(0, 6).map((o) => `
          <tr><td><b>${esc(o.id)}</b></td>
          <td>${esc(o.address?.name || o.email || "Guest")}</td>
          <td>${money(o.totals?.total || 0)}</td>
          <td><span class="badge ${esc(o.status || "pending")}">${esc(o.status || "pending")}</span></td></tr>`).join("") || `<tr class="empty-row"><td colspan="4">No orders yet</td></tr>`}
        </tbody></table>
        <a href="orders.html" class="mini-btn" style="margin-top:14px;display:inline-block">View all orders →</a>
      </div>

      <div class="ad-panel">
        <h2>Top selling</h2>
        <table class="ad-table"><thead><tr><th>Product</th><th>Units</th></tr></thead>
        <tbody>${topSellers.map(([name, units]) => `<tr><td>${esc(name)}</td><td><b>${units}</b></td></tr>`).join("") || `<tr class="empty-row"><td colspan="2">No sales yet</td></tr>`}
        </tbody></table>
      </div>
    </div>

    <div class="ad-panel">
      <h2>Low stock alerts</h2>
      <table class="ad-table"><thead><tr><th>Product</th><th>Category</th><th>Stock</th><th></th></tr></thead>
      <tbody>${[...outStock, ...lowStock].slice(0, 8).map((p) => `
        <tr><td class="prod-cell"><img class="thumb" src="${esc(optimizeImg(p.image, 150))}" alt=""><b>${esc(p.name)}</b></td>
        <td>${esc(p.category)}</td>
        <td><span class="badge ${(p.stock ?? 0) === 0 ? "cancelled" : "pending"}">${(p.stock ?? 0) === 0 ? "Out of stock" : p.stock + " left"}</span></td>
        <td><a href="products.html" class="mini-btn">Manage</a></td></tr>`).join("") || `<tr class="empty-row"><td colspan="4">All products well stocked ✓</td></tr>`}
      </tbody></table>
    </div>`;
})();
