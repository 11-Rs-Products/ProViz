/**
 * session.js — the one place the UI learns who is using ProViz.
 *
 * Emits a Session object: { status, user, role, preview }
 *   status: 'loading' | 'signed-in' | 'guest' | 'signed-out'
 *   user:   { name, email, photoURL } | null
 *   role:   'guest' | 'user' | 'admin' | 'superadmin'
 *
 * Any Google account may sign in. Visitors may also continue as a guest (Visualizer only).
 * In development builds `?preview=<role>` simulates a signed-in user so every role can be
 * checked without real credentials; it is stripped from production bundles.
 */

import { resolveRole, parseEmailList, isRole, ROLES } from './roles.js';

const GUEST_KEY = 'proviz.guest';
const PREVIEW_KEY = 'proviz.previewRole';
// Statically false in production builds, so the whole preview path is tree-shaken away.
const PREVIEW_ENABLED = Boolean(import.meta.env?.DEV);

const roleConfig = {
    admins: parseEmailList(import.meta.env?.VITE_ADMIN_EMAILS),
    superAdmins: parseEmailList(import.meta.env?.VITE_SUPERADMIN_EMAILS),
};

export function getRoleConfig() {
    return { admins: [...roleConfig.admins], superAdmins: [...roleConfig.superAdmins] };
}

export function authConfigured() {
    return Boolean(import.meta.env?.VITE_FIREBASE_API_KEY);
}

function store(kind) {
    try { return kind === 'session' ? window.sessionStorage : window.localStorage; } catch { return null; }
}

function readFlag(key, kind = 'local') {
    try { return store(kind)?.getItem(key) ?? null; } catch { return null; }
}

function writeFlag(key, value, kind = 'local') {
    try {
        if (value == null) store(kind)?.removeItem(key);
        else store(kind)?.setItem(key, value);
    } catch { /* storage unavailable */ }
}

/** Dev-only role preview, driven by ?preview=<role> (sticky per tab) or ?preview=off. */
function previewRole() {
    const param = new URLSearchParams(window.location.search).get('preview');
    if (param === 'off') writeFlag(PREVIEW_KEY, null, 'session');
    else if (param && isRole(param)) writeFlag(PREVIEW_KEY, param, 'session');
    const role = readFlag(PREVIEW_KEY, 'session');
    return role && isRole(role) ? role : null;
}

let firebase = null;
async function loadFirebase() {
    if (!authConfigured()) return null;
    firebase ??= await import('../firebase.js');
    return firebase;
}

export function isGuest() {
    return readFlag(GUEST_KEY) === '1';
}

export function continueAsGuest() {
    writeFlag(GUEST_KEY, '1');
}

/** Turn a Firebase user into a Session (reads custom claims for role escalation). */
async function sessionForUser(user) {
    let claims = null;
    try { claims = (await user.getIdTokenResult())?.claims || null; } catch { /* offline: allowlist only */ }
    const role = resolveRole({ email: user.email, claims }, roleConfig);
    return {
        status: 'signed-in',
        user: { name: user.displayName || '', email: user.email || '', photoURL: user.photoURL || '' },
        role,
        preview: false,
    };
}

function guestOrSignedOut() {
    return isGuest()
        ? { status: 'guest', user: null, role: ROLES.GUEST, preview: false }
        : { status: 'signed-out', user: null, role: ROLES.GUEST, preview: false };
}

/**
 * Subscribe to the session. The callback fires once with status 'loading', then with every
 * resolved state. Returns an unsubscribe function.
 */
export function watchSession(callback) {
    let cancelled = false;
    let unsubscribe = () => {};
    callback({ status: 'loading', user: null, role: ROLES.GUEST, preview: false });

    const preview = PREVIEW_ENABLED ? previewRole() : null;
    if (PREVIEW_ENABLED && preview) {
        const fake = preview === ROLES.GUEST
            ? { status: 'guest', user: null, role: ROLES.GUEST, preview: true }
            : { status: 'signed-in', user: { name: 'Preview User', email: `${preview}@preview.local`, photoURL: '' }, role: preview, preview: true };
        queueMicrotask(() => { if (!cancelled) callback(fake); });
        return () => { cancelled = true; };
    }

    loadFirebase().then(fb => {
        if (cancelled) return;
        if (!fb) { callback(guestOrSignedOut()); return; }
        unsubscribe = fb.onAuthChange(async user => {
            if (cancelled) return;
            if (!user) { callback(guestOrSignedOut()); return; }
            writeFlag(GUEST_KEY, null); // a real account supersedes guest mode
            callback(await sessionForUser(user));
        });
    }).catch(err => {
        console.error('[ProViz] auth unavailable', err);
        if (!cancelled) callback(guestOrSignedOut());
    });

    return () => { cancelled = true; unsubscribe(); };
}

/** Friendly message for a Firebase auth error, or null when it should be silent. */
export function describeAuthError(err) {
    const code = err?.code || '';
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return null;
    if (code === 'auth/unauthorized-domain') return 'This domain is not authorised for sign-in yet. Add it under Firebase → Authentication → Settings → Authorised domains.';
    if (code === 'auth/network-request-failed') return 'Network error while signing in. Check your connection and try again.';
    if (code === 'auth/operation-not-allowed') return 'Google sign-in is not enabled for this project yet.';
    return err?.message || 'Sign-in failed. Please try again.';
}

export async function signInWithGoogle() {
    const fb = await loadFirebase();
    if (!fb || !fb.isConfigured()) throw new Error('Sign-in is not configured for this deployment.');
    await fb.loginWithGoogle();
}

export async function signOutEverywhere() {
    writeFlag(GUEST_KEY, null);
    writeFlag(PREVIEW_KEY, null, 'session');
    const fb = firebase || (authConfigured() ? await loadFirebase() : null);
    await fb?.logoutUser();
}
