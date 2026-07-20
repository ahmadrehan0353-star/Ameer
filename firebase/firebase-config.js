// ============================================================
// AMEER OFFICIAL — Firebase configuration
// ============================================================

export const firebaseConfig = {
  apiKey: "AIzaSyDC-7lbGC4JR5B58AKzQB15iQ3vSsEtLjE",
  authDomain: "luxora-ac413.firebaseapp.com",
  projectId: "luxora-ac413",
  storageBucket: "luxora-ac413.firebasestorage.app",
  messagingSenderId: "23264579888",
  appId: "1:23264579888:web:71d15bf590544fc5a138f5"
};

// The email addresses allowed into the admin dashboard.
// Add as many admin accounts as you need — one per line.
export const ADMIN_EMAILS = [
  "ahmadrehan0353@gmail.com",
];

// Kept for backwards compatibility with any code that still reads a single
// ADMIN_EMAIL — always the first entry in ADMIN_EMAILS.
export const ADMIN_EMAIL = ADMIN_EMAILS[0];

// Cloudinary (free image hosting for admin uploads — set up later).
export const CLOUDINARY = {
  cloudName: "aoqipkgm",
  uploadPreset: "gnlhqwmp"
};

// EmailJS (free, sends email straight from the browser — no backend
// needed). Used to email the 6-digit code when you invite a new admin
// from the Team page. Until this is filled in, invite codes are shown
// on-screen instead so you can share them manually.
// Set up: create a free account at emailjs.com, add an Email Service,
// make a template with {{to_email}}, {{code}}, {{invited_by}} variables,
// then paste your keys below.
export const EMAILJS = {
  publicKey: "PASTE_YOUR_EMAILJS_PUBLIC_KEY",
  serviceId: "PASTE_YOUR_EMAILJS_SERVICE_ID",
  templateId: "PASTE_YOUR_EMAILJS_TEMPLATE_ID",
  // Optional. Checkout email verification (the 6-digit code a customer
  // must enter before they can continue) reuses templateId above if this
  // is left blank — but that template's copy is written for admin invites
  // ("you've been invited..."), which won't make sense to a shopper. Set
  // up a second, simple EmailJS template — just needs {{to_email}} and
  // {{code}} — and paste its ID here so the wording actually fits.
  checkoutTemplateId: ""
};
