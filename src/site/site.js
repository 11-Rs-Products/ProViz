/**
 * site.js — behaviour for the public pages (landing, privacy, terms):
 * theme switching, session-aware calls to action, and the sign-in dialog.
 */

import {
    watchSession, signInWithGoogle, continueAsGuest, describeAuthError, authConfigured,
} from '../auth/session.js';
import { initials } from '../auth/roles.js';
import { transitionTheme } from './themeTransition.js';

const APP_URL = '/app/';
const $all = sel => document.querySelectorAll(sel);

// ── Theme ────────────────────────────────────────────────────────────────────

function currentTheme() {
    return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

function syncThemeLabels() {
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    $all('[data-theme-toggle]').forEach(el => { el.title = `Switch to ${next} theme`; });
}

function applyTheme(theme, persist = true) {
    document.documentElement.dataset.theme = theme;
    if (persist) { try { localStorage.setItem('proviz.theme', theme); } catch { /* storage unavailable */ } }
    syncThemeLabels();
}

$all('[data-theme-toggle]').forEach(el => el.addEventListener('click', e => {
    e.preventDefault();
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    transitionTheme(() => applyTheme(next), e);
}));
window.matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', e => {
    let saved = null;
    try { saved = localStorage.getItem('proviz.theme'); } catch { /* storage unavailable */ }
    if (!saved) applyTheme(e.matches ? 'dark' : 'light', false);
});
syncThemeLabels();
$all('[data-year]').forEach(el => { el.textContent = String(new Date().getFullYear()); });

// ── Toasts ───────────────────────────────────────────────────────────────────

function toast(message, kind = 'error', ms = 6000) {
    const region = document.getElementById('toast-region');
    if (!region) return;
    const el = document.createElement('div');
    el.className = `toast toast--${kind}`;
    el.textContent = message;
    region.appendChild(el);
    setTimeout(() => el.remove(), ms);
}

// ── Sign-in dialog ───────────────────────────────────────────────────────────

const dialog = document.getElementById('auth-dialog');
const dialogError = dialog?.querySelector('[data-auth-error]');
let lastFocus = null;

function openDialog() {
    if (!dialog) return;
    lastFocus = document.activeElement;
    if (dialogError) dialogError.hidden = true;
    dialog.hidden = false;
    document.body.classList.add('has-modal');
    dialog.querySelector('[data-action="google"]')?.focus();
}

function closeDialog() {
    if (!dialog || dialog.hidden) return;
    dialog.hidden = true;
    document.body.classList.remove('has-modal');
    lastFocus?.focus?.();
}

dialog?.addEventListener('mousedown', e => { if (e.target === dialog) closeDialog(); });
$all('[data-close-auth]').forEach(el => el.addEventListener('click', closeDialog));
window.addEventListener('keydown', e => { if (e.key === 'Escape') closeDialog(); });

// ── Session-aware UI ─────────────────────────────────────────────────────────

let session = { status: 'loading' };
let goToAppAfterSignIn = false;

function renderSession() {
    const signedIn = session.status === 'signed-in';
    const canOpen = signedIn || session.status === 'guest';
    document.documentElement.dataset.session = session.status;
    $all('[data-signed-out-only]').forEach(el => { el.hidden = signedIn; });
    $all('[data-signed-in-only]').forEach(el => { el.hidden = !signedIn; });
    $all('[data-open-app-label]').forEach(el => { el.textContent = canOpen ? 'Open ProViz' : 'Get started'; });

    const slot = document.querySelector('[data-session-slot]');
    slot?.querySelector('.site-avatar')?.remove();
    if (signedIn && slot) {
        const u = session.user || {};
        const avatar = document.createElement('span');
        avatar.className = 'site-avatar';
        avatar.title = u.email ? `Signed in as ${u.email}` : 'Signed in';
        if (u.photoURL) {
            const img = document.createElement('img');
            img.src = u.photoURL;
            img.alt = '';
            img.referrerPolicy = 'no-referrer';
            img.addEventListener('error', () => { img.remove(); avatar.textContent = initials(u.name, u.email); });
            avatar.appendChild(img);
        } else {
            avatar.textContent = initials(u.name, u.email);
        }
        slot.prepend(avatar);
    }
}

watchSession(s => {
    session = s;
    renderSession();
    if (s.status === 'signed-in' && goToAppAfterSignIn) window.location.assign(APP_URL);
});

async function startGoogle(button) {
    if (!authConfigured()) {
        const msg = 'Sign-in is not configured for this deployment yet. You can still try ProViz as a guest.';
        if (dialog && !dialog.hidden && dialogError) { dialogError.textContent = msg; dialogError.hidden = false; }
        else toast(msg, 'info');
        return;
    }
    goToAppAfterSignIn = true;
    if (session.status === 'signed-in') { window.location.assign(APP_URL); return; }
    button?.setAttribute('aria-busy', 'true');
    try {
        await signInWithGoogle();
    } catch (err) {
        goToAppAfterSignIn = false;
        const msg = describeAuthError(err);
        if (msg) {
            if (dialog && !dialog.hidden && dialogError) { dialogError.textContent = msg; dialogError.hidden = false; }
            else toast(msg);
        }
    } finally {
        button?.removeAttribute('aria-busy');
    }
}

document.addEventListener('click', e => {
    const actionEl = e.target.closest('[data-action]');
    if (actionEl) {
        e.preventDefault();
        if (actionEl.dataset.action === 'google') startGoogle(actionEl);
        else if (actionEl.dataset.action === 'guest') {
            if (session.status !== 'signed-in') continueAsGuest();
            window.location.assign(APP_URL);
        }
        return;
    }
    const openEl = e.target.closest('[data-open-app]');
    if (openEl && session.status !== 'signed-in' && session.status !== 'guest') {
        e.preventDefault();
        openDialog();
    }
});

// Arriving from the app without a session: explain why and offer the choices.
const params = new URLSearchParams(window.location.search);
if (params.get('from') === 'app') {
    const notice = document.getElementById('site-notice');
    if (notice) notice.hidden = false;
    history.replaceState(null, '', window.location.pathname + window.location.hash);
    openDialog();
}

// Header elevation once the page scrolls.
const header = document.getElementById('site-header');
if (header) {
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 4);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
}
