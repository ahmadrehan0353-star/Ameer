import { initCatalog } from "./catalog.js";

// "all" — this page always shows every category together (Women, Men,
// Kids). Which subset (trending / best sellers / new arrivals / everything)
// is decided by catalog.js from the ?flag= query param, which also swaps
// in the matching heading — see FLAG_LABELS in catalog.js. The title/text
// passed here are just the fallback for someone opening collection.html
// directly with no ?flag= at all.
initCatalog(
  "all",
  null,
  "Shop AMEER OFFICIAL",
  "Every collection, in one place — Women, Men and Kids."
);
