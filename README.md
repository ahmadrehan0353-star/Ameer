# AMEER OFFICIAL — Luxury Fashion E-Commerce

A complete, production-grade fashion storefront with a full admin dashboard,
built on vanilla JS (ES modules), Firebase (Auth + Firestore), Cloudinary image
hosting, and deployed on Vercel. No build step, no framework — fast and portable.

## Status — all 5 layers complete ✅

1. ✅ **Foundation** — structure, design system, navbar/footer, homepage, data layer
2. ✅ **Catalog** — women/men/kids pages, filters, price slider, sort, product detail + zoom
3. ✅ **Accounts & commerce** — auth, cart, coupons, wishlist, multi-step checkout, profile
4. ✅ **Admin dashboard** — products (with image upload), orders, customers, categories, inventory, coupons, banners, analytics, settings
5. ✅ **Finish** — review moderation, SEO/structured data, hardened security rules, accessibility, responsive polish, go-live tooling

**Works immediately in demo mode** (no Firebase needed) so you can click through
everything. Add your keys to go live — see `CONNECT-GUIDE.md`.

## Run locally

ES modules need a server (not `file://`):
```bash
cd luxora
python3 -m http.server 8000
# open http://localhost:8000
```

## Storefront
`index.html` · `women.html` · `men.html` · `kids.html` · `product.html`
`cart.html` · `wishlist.html` · `checkout.html` · `login.html` · `signup.html` · `profile.html`

## Admin (`/admin`)
`login` · `dashboard` · `products` · `orders` · `customers` · `categories`
`inventory` · `coupons` · `reviews` · `banners` · `analytics` · `team` · `settings`

Open `/admin/login.html`. In demo mode, use one of the admin emails from
`firebase/firebase-config.js` (`ADMIN_EMAILS`, default `your-email@example.com`)
and any password. You can list multiple admin emails to give more than one
person access.

## Going live
See **CONNECT-GUIDE.md** for the full Firebase + Cloudinary + Vercel walkthrough,
and **STEP4-ADMIN-GUIDE.md** for what each admin page does.

## Design
"Bright boutique" — white canvas, deep-teal accent (#0b5d5b), soft peach and
mint panels, Plus Jakarta Sans (self-hosted in `assets/fonts`), pill buttons,
rounded cards, a large search bar and category chips, dark mode, fully
responsive and accessible (skip links, focus rings, reduced-motion).

Storefront pages load `css/site.css` plus one page stylesheet. The admin panel
still uses `css/style.css` + `css/admin.css` and has not been restyled yet.

## Product photos
Photos in `assets/images` have small WebP copies next to them
(`photo.jpg.w500.webp`, `photo.jpg.w1000.webp`) that the storefront uses
automatically, falling back to the original. After adding photos to that
folder run `python3 tools/make-image-variants.py`. Photos uploaded through
the admin panel go to Cloudinary and need nothing extra.
