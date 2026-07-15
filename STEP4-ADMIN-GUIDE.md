# AMEER OFFICIAL — Admin Dashboard (Step 4)

Your store now has a full admin dashboard at **/admin**.

## How to open it

Go to `your-site.com/admin/login.html`

**In demo mode (no Firebase yet):** enter one of the admin emails from
`firebase/firebase-config.js` — the default is `your-email@example.com` —
and *any* password. You're in. Everything you do is saved in your browser so
you can test the whole thing immediately.

**Once Firebase is connected:** you sign in with your real Firebase admin
account (the email must be one of the entries listed in `ADMIN_EMAILS` in
the config). You can list as many admin accounts as you like — just add
each teammate's email to that array.

## What each page does

- **Dashboard** — revenue, orders, customers, product counts, recent orders, top sellers, low-stock alerts
- **Products** — add / edit / duplicate / enable-disable / delete, upload multiple images, set price & sale price, stock, sizes, colours, and Featured/Trending/Best/New tags. **Anything you save here shows on the public storefront.**
- **Orders** — every order with a status dropdown (pending → confirmed → processing → shipped → delivered → cancelled → refunded)
- **Customers** — everyone who's ordered or registered, with totals
- **Categories** — add/edit/delete and reorder the nav categories
- **Inventory** — stock levels, low/out-of-stock filters, quick stock edits
- **Coupons** — create %-off or fixed-amount codes with expiry and usage limits (these are the codes customers type at checkout)
- **Banners** — the homepage hero slides. Upload a banner here and it appears on the home page.
- **Analytics** — revenue, orders, average order value, a monthly-sales chart, best sellers
- **Team** — invite a partner as another admin: enter their email, set a password, and a 6-digit code gets sent to their inbox. Enter that code back in on this page to activate their access. Requires EmailJS to be configured to actually send the email (see `CONNECT-GUIDE.md`) — otherwise the code is just shown on-screen for you to share manually.
- **Settings** — store name, currency, shipping/tax, and a "reset demo data" button

## The key promise: admin controls the public site

- Add or edit a product in **Products** → refresh the storefront → it's there.
- Add a **Banner** → it becomes a homepage hero slide.
- Create a **Coupon** → customers can use it at checkout.

In demo mode this works within your browser. Once Firebase is connected it
works for real, for everyone, across all devices.

## Going live (when you're ready)

1. **Firebase** — paste your keys into `firebase/firebase-config.js`, list every admin's email in `ADMIN_EMAILS`, enable Email/Password auth, create Firestore, and publish the rules in `firebase/firestore.rules` (update the email list in the `isAdmin()` function there to match `ADMIN_EMAILS`).
2. **Images** — create a free Cloudinary account, make an *unsigned upload preset*, and put your `cloudName` + `uploadPreset` into the `CLOUDINARY` block in `firebase-config.js`. Until then, uploaded images work as local previews.

That's it — no code changes needed. The app detects your config and switches from demo mode to live automatically.
