# AMEER OFFICIAL — Going Live: Firebase + Cloudinary Walkthrough

Your store works fully in demo mode right now. When you're ready for real
accounts, orders, and images that sync for every visitor, follow these steps.
Nothing in the code needs changing — you only fill in keys.

---

## Part 1 — Firebase (accounts, database, admin)

### 1. Create the project
1. Go to https://console.firebase.google.com and click **Add project**.
2. Name it (e.g. `luxora-store`), continue, and create it.

### 2. Add a Web app
1. On the project overview, click the **`</>`** (Web) icon.
2. Give it a nickname, click **Register app**.
3. You'll see a `firebaseConfig` object with apiKey, authDomain, etc. Keep it open.

### 3. Paste the keys
Open `firebase/firebase-config.js` and replace the placeholders with your values:
```js
export const firebaseConfig = {
  apiKey: "AIza…",
  authDomain: "luxora-store.firebaseapp.com",
  projectId: "luxora-store",
  storageBucket: "luxora-store.appspot.com",
  messagingSenderId: "…",
  appId: "…"
};
export const ADMIN_EMAILS = [
  "you@yourdomain.com",       // <-- your admin email
  "teammate@yourdomain.com",  // <-- add one line per extra admin
];
```

### 4. Turn on Email/Password sign-in
1. In Firebase: **Build → Authentication → Get started**.
2. Enable **Email/Password**.
3. Create an account under the **Users** tab for every email listed in `ADMIN_EMAILS`.

### 5. Create the database
1. **Build → Firestore Database → Create database**.
2. Choose **production mode**, pick a region close to your customers.
3. Go to the **Rules** tab, paste the contents of `firebase/firestore.rules`,
   and — important — update the email list inside the `isAdmin()` function so
   it matches every address in `ADMIN_EMAILS`. Publish.

### 6. Authorise your live domain
1. **Authentication → Settings → Authorized domains → Add domain**.
2. Add your Vercel domain (e.g. `luxora.vercel.app`).

### 7. Publish your catalog
1. Deploy, open `/admin/login.html`, sign in with your admin account.
2. Go to **Settings → Publish catalog to Firebase**. Done — the 26 starter
   products are now in Firestore and identical for every visitor. Manage
   everything from **Products** from now on.

---

## Part 2 — Cloudinary (admin image uploads)

Firebase Storage now needs a billing card even on the free tier, so AMEER OFFICIAL uses
Cloudinary's free plan instead — no card required.

1. Sign up free at https://cloudinary.com.
2. On your dashboard, note your **Cloud name**.
3. Go to **Settings (gear) → Upload → Upload presets → Add upload preset**.
   - Set **Signing Mode: Unsigned**.
   - Save, and copy the **preset name**.
4. Put both into `firebase/firebase-config.js`:
```js
export const CLOUDINARY = {
  cloudName: "your-cloud-name",
  uploadPreset: "your-unsigned-preset"
};
```
Now when you upload product or banner images in the admin, they're hosted on
Cloudinary and appear on the live storefront for everyone. (Until you set this,
uploads still work as local previews so you can build your catalogue.)

---

## Part 3 — EmailJS (emailing admin invite codes)

The **Team** page in `/admin` lets you invite a partner as a second admin: you
enter their email and set a password, and a 6-digit code gets sent to their
inbox for you to enter back in and activate their account. That code-sending
uses EmailJS — it works straight from the browser, no backend server needed,
free for low volume.

1. Sign up free at https://www.emailjs.com.
2. **Email Services → Add New Service** — connect your Gmail/Outlook/SMTP,
   note the **Service ID**.
3. **Email Templates → Create New Template** — build a short email using the
   variables `{{to_email}}`, `{{code}}`, and `{{invited_by}}`, e.g.:
   > Subject: Your Ameer Official admin invite code
   > Body: You've been invited to manage Ameer Official by {{invited_by}}. Your verification code is **{{code}}**.
   Note the **Template ID**.
4. **Account → General** — copy your **Public Key**.
5. Put all three into `firebase/firebase-config.js`:
```js
export const EMAILJS = {
  publicKey: "your-public-key",
  serviceId: "your-service-id",
  templateId: "your-template-id"
};
```
Until this is filled in, the Team page still works — it just shows the code
on-screen for you to share with your partner yourself instead of emailing it.

---

## Part 4 — Deploy to Vercel

1. Push your project to a GitHub repo (contents of the `luxora` folder at the
   repo root — `index.html` must be at the top level).
2. On https://vercel.com, **Add New → Project**, import the repo, click **Deploy**.
3. Every future GitHub push redeploys automatically.

---

## Quick checklist

- [ ] `firebaseConfig` filled in
- [ ] `ADMIN_EMAILS` set to every admin's email
- [ ] Email/Password auth enabled + each admin user created
- [ ] Firestore created, rules pasted (with every admin email) and published
- [ ] Vercel domain added to Authorised domains
- [ ] Catalog published from Settings
- [ ] Cloudinary `cloudName` + `uploadPreset` filled in
- [ ] EmailJS `publicKey` + `serviceId` + `templateId` filled in (for Team invite emails)
- [ ] Deployed to Vercel

When all boxes are ticked, the admin dashboard shows **● Live · Firebase connected**
instead of Demo mode, and your store is fully operational.
