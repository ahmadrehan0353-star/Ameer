// ============================================================
// AMEER OFFICIAL — Firebase initialisation (single source of truth)
// Every module imports auth / db from here.
// ============================================================
import { initializeApp, getApps, deleteApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signOut, sendPasswordResetEmail,
  updateProfile, sendEmailVerification
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore, collection, doc, getDoc, getDocs, setDoc, addDoc,
  updateDoc, deleteDoc, query, where, orderBy, limit, onSnapshot,
  serverTimestamp, increment
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "../firebase/firebase-config.js";

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Re-export the Firestore/Auth helpers so other modules import them from one place.
export {
  onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signOut, sendPasswordResetEmail, updateProfile, sendEmailVerification,
  collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, onSnapshot, serverTimestamp, increment
};

// ------------------------------------------------------------------
// Creating a teammate's account with createUserWithEmailAndPassword()
// on the *main* auth instance would sign the current admin out and
// sign in as the new teammate instead (a well-known Firebase Auth
// client-SDK quirk). To avoid kicking the admin out of their own
// session, we spin up a short-lived *secondary* Firebase app just for
// that one call, then tear it down immediately.
// ------------------------------------------------------------------
export async function createTeammateAccount(email, password) {
  const name = "lx-secondary-" + Date.now();
  const secondaryApp = initializeApp(firebaseConfig, name);
  const secondaryAuth = getAuth(secondaryApp);
  try {
    const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    const uid = cred.user.uid;
    await signOut(secondaryAuth);
    return uid;
  } finally {
    try { await deleteApp(secondaryApp); } catch {}
  }
}
