/**
 * roles.js — pure role resolution and capability model.
 *
 * Roles are resolved client-side from (a) Firebase custom claims, when present, and
 * (b) e-mail allowlists shipped in the deployment config (VITE_ADMIN_EMAILS,
 * VITE_SUPERADMIN_EMAILS). This gates the *interface* only; anything that must be
 * protected for real belongs behind server-side rules.
 */

export const ROLES = Object.freeze({
    GUEST: 'guest',
    USER: 'user',
    ADMIN: 'admin',
    SUPERADMIN: 'superadmin',
});

const RANK = { guest: 0, user: 1, admin: 2, superadmin: 3 };

export const ROLE_INFO = Object.freeze({
    guest: {
        label: 'Guest',
        access: 'General access',
        summary: 'Exploring without an account. Visualizer only; nothing is tied to a profile.',
    },
    user: {
        label: 'General',
        access: 'General access',
        summary: 'Write, run and step through code in the 3D Visualizer.',
    },
    admin: {
        label: 'Admin',
        access: 'Developer access',
        summary: 'Visualizer plus the verification studios: Control Center, Release Gates, Continuous and Insights.',
    },
    superadmin: {
        label: 'Super admin',
        access: 'Developer access',
        summary: 'Full developer access, including governance controls and team & role management.',
    },
});

/** Studios in navigation order, with the minimum role that may open each. */
export const STUDIOS = Object.freeze([
    { view: 'os-control', label: 'Control Center', icon: 'overview', minRole: 'admin' },
    { view: 'visualizer-3d', label: 'Visualizer', icon: 'cube', minRole: 'guest' },
    { view: 'gates-studio', label: 'Release Gates', icon: 'shield', minRole: 'admin' },
    { view: 'continuous-loop', label: 'Continuous', icon: 'loop', minRole: 'admin' },
    { view: 'project-intel', label: 'Insights', icon: 'chart', minRole: 'admin' },
    { view: 'team-roles', label: 'Team', icon: 'users', minRole: 'superadmin' },
]);

/** Fine-grained actions inside studios. */
export const CAPABILITIES = Object.freeze({
    'verification.run': 'admin',
    'verification.export': 'admin',
    'governance.autonomy': 'superadmin',
    'governance.safemode': 'superadmin',
    'governance.certify': 'superadmin',
    'team.view': 'superadmin',
});

export function isRole(value) {
    return Object.prototype.hasOwnProperty.call(RANK, value);
}

export function atLeast(role, minRole) {
    return (RANK[role] ?? -1) >= (RANK[minRole] ?? Infinity);
}

export function normalizeEmail(email) {
    return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

/** Parse a comma / whitespace / semicolon separated allowlist into a Set of e-mails. */
export function parseEmailList(raw) {
    if (!raw || typeof raw !== 'string') return new Set();
    return new Set(raw.split(/[\s,;]+/).map(normalizeEmail).filter(e => e.includes('@')));
}

/** Map Firebase custom claims to a role, or null when the claims don't grant one. */
export function roleFromClaims(claims) {
    if (!claims || typeof claims !== 'object') return null;
    if (typeof claims.role === 'string') {
        const r = claims.role.toLowerCase();
        if (isRole(r)) return r;
        if (r === 'student' || r === 'member') return ROLES.USER; // legacy / synonym claims
    }
    if (claims.superadmin === true) return ROLES.SUPERADMIN;
    if (claims.admin === true) return ROLES.ADMIN;
    return null;
}

/**
 * Resolve the effective role for a session.
 *
 * @param {{ email?: string|null, claims?: object|null, guest?: boolean }|null} identity
 * @param {{ admins?: Set<string>|string, superAdmins?: Set<string>|string }} config
 * @returns {'guest'|'user'|'admin'|'superadmin'}
 */
export function resolveRole(identity, config = {}) {
    if (!identity || identity.guest || !identity.email) return ROLES.GUEST;
    const admins = config.admins instanceof Set ? config.admins : parseEmailList(config.admins);
    const supers = config.superAdmins instanceof Set ? config.superAdmins : parseEmailList(config.superAdmins);
    const email = normalizeEmail(identity.email);

    let role = ROLES.USER;
    if (admins.has(email)) role = ROLES.ADMIN;
    if (supers.has(email)) role = ROLES.SUPERADMIN;

    // Claims can only raise a signed-in user's role (never demote below the allowlist,
    // never grant 'guest' to someone who is signed in).
    const claimed = roleFromClaims(identity.claims);
    if (claimed && claimed !== ROLES.GUEST && RANK[claimed] > RANK[role]) role = claimed;
    return role;
}

export function studiosFor(role) {
    return STUDIOS.filter(s => atLeast(role, s.minRole));
}

export function canOpenStudio(role, view) {
    const s = STUDIOS.find(x => x.view === view);
    return Boolean(s) && atLeast(role, s.minRole);
}

export function can(role, capability) {
    const min = CAPABILITIES[capability];
    return Boolean(min) && atLeast(role, min);
}

/** Studio a role lands on when it has no (valid) saved preference. */
export function defaultStudio(role) {
    return atLeast(role, ROLES.ADMIN) ? 'os-control' : 'visualizer-3d';
}

/** Pick the studio to open: the saved one if this role may open it, else the role default. */
export function initialStudio(role, saved) {
    return saved && canOpenStudio(role, saved) ? saved : defaultStudio(role);
}

/** Two-letter initials for an avatar fallback. */
export function initials(name, email) {
    const source = (name || '').trim() || normalizeEmail(email).split('@')[0] || '';
    const parts = source.split(/[\s._-]+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
