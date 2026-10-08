/**
 * firebase.js — Firebase Auth (Google) bootstrap. Imported lazily by src/auth/session.js
 * so pages that never touch auth don't pay for the SDK.
 */

import { initializeApp } from 'firebase/app';
import {
    getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, signOut,
    onAuthStateChanged, setPersistence, browserLocalPersistence,
} from 'firebase/auth';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
};

let auth = null;
let googleProvider = null;

try {
    if (firebaseConfig.apiKey) {
        const app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        // localStorage instead of IndexedDB avoids "Database is closing" lock errors across tabs.
        setPersistence(auth, browserLocalPersistence).catch(err => console.error('[ProViz] auth persistence', err));
        googleProvider = new GoogleAuthProvider();
        googleProvider.setCustomParameters({ prompt: 'select_account' });
    }
} catch (e) {
    console.error('[ProViz] Firebase initialisation failed', e);
}

export function isConfigured() {
    return Boolean(auth);
}

export async function loginWithGoogle() {
    if (!auth) throw new Error('Sign-in is not configured for this deployment.');
    try {
        await signInWithPopup(auth, googleProvider);
    } catch (error) {
        // Popups are blocked in some browsers / embedded webviews: fall back to a full redirect.
        if (error?.code === 'auth/popup-blocked' || error?.code === 'auth/operation-not-supported-in-this-environment') {
            await signInWithRedirect(auth, googleProvider);
            return;
        }
        throw error;
    }
}

/** Subscribe to auth changes. The callback receives the Firebase user (or null). */
export function onAuthChange(callback) {
    if (!auth) {
        callback(null);
        return () => {};
    }
    return onAuthStateChanged(auth, callback);
}

export async function logoutUser() {
    if (auth) await signOut(auth);
}
