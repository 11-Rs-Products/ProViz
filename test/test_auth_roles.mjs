/**
 * Auth layer tests: role resolution from allowlists + custom claims, and the
 * studio / capability gates the UI derives from a role.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
    ROLES, parseEmailList, roleFromClaims, resolveRole, studiosFor, canOpenStudio, can,
    defaultStudio, initialStudio, initials, atLeast,
} from '../src/auth/roles.js';

const config = {
    admins: 'Ops@Example.com, lead@example.com',
    superAdmins: 'root@example.com',
};

test('parseEmailList: trims, lower-cases, splits on commas/whitespace/semicolons, drops junk', () => {
    const s = parseEmailList(' A@x.io,b@x.io ;  c@x.io\nnot-an-email,, ');
    assert.deepEqual([...s].sort(), ['a@x.io', 'b@x.io', 'c@x.io']);
    assert.equal(parseEmailList(undefined).size, 0);
    assert.equal(parseEmailList('').size, 0);
});

test('resolveRole: no identity, guest flag, or missing email is a guest', () => {
    assert.equal(resolveRole(null, config), ROLES.GUEST);
    assert.equal(resolveRole({ guest: true }, config), ROLES.GUEST);
    assert.equal(resolveRole({ email: '' }, config), ROLES.GUEST);
});

test('resolveRole: any signed-in Google account defaults to general access (user)', () => {
    assert.equal(resolveRole({ email: 'someone@gmail.com' }, config), ROLES.USER);
});

test('resolveRole: allowlists are case-insensitive and super admin wins over admin', () => {
    assert.equal(resolveRole({ email: 'ops@example.COM' }, config), ROLES.ADMIN);
    assert.equal(resolveRole({ email: 'root@example.com' }, config), ROLES.SUPERADMIN);
    const both = { admins: 'x@y.z', superAdmins: 'x@y.z' };
    assert.equal(resolveRole({ email: 'x@y.z' }, both), ROLES.SUPERADMIN);
});

test('resolveRole: accepts pre-parsed Sets', () => {
    const cfg = { admins: new Set(['a@b.c']), superAdmins: new Set() };
    assert.equal(resolveRole({ email: 'A@B.C' }, cfg), ROLES.ADMIN);
});

test('roleFromClaims: role string, boolean flags, and garbage', () => {
    assert.equal(roleFromClaims({ role: 'Admin' }), 'admin');
    assert.equal(roleFromClaims({ superadmin: true }), 'superadmin');
    assert.equal(roleFromClaims({ admin: true }), 'admin');
    assert.equal(roleFromClaims({ role: 'owner' }), null);
    assert.equal(roleFromClaims({ role: 'student' }), 'user', 'legacy claim maps to general access');
    assert.equal(roleFromClaims(null), null);
});

test('resolveRole: claims can raise a role but never lower it', () => {
    assert.equal(resolveRole({ email: 'someone@gmail.com', claims: { admin: true } }, config), ROLES.ADMIN);
    assert.equal(resolveRole({ email: 'root@example.com', claims: { role: 'user' } }, config), ROLES.SUPERADMIN);
    assert.equal(resolveRole({ email: 'someone@gmail.com', claims: { role: 'guest' } }, config), ROLES.USER);
});

test('studiosFor: tiered access by role', () => {
    const views = r => studiosFor(r).map(s => s.view);
    assert.deepEqual(views('guest'), ['visualizer-3d']);
    assert.deepEqual(views('user'), ['visualizer-3d']);
    assert.deepEqual(views('admin'), ['os-control', 'visualizer-3d', 'gates-studio', 'continuous-loop', 'project-intel']);
    assert.ok(views('superadmin').includes('team-roles'));
    assert.equal(views('superadmin').length, 6);
});

test('canOpenStudio / can: gates and unknown keys fail closed', () => {
    assert.equal(canOpenStudio('user', 'os-control'), false);
    assert.equal(canOpenStudio('admin', 'os-control'), true);
    assert.equal(canOpenStudio('admin', 'team-roles'), false);
    assert.equal(canOpenStudio('superadmin', 'nope'), false);
    assert.equal(can('admin', 'verification.run'), true);
    assert.equal(can('admin', 'governance.safemode'), false);
    assert.equal(can('superadmin', 'governance.safemode'), true);
    assert.equal(can('superadmin', 'unknown.capability'), false);
    assert.equal(atLeast('bogus', 'guest'), false);
});

test('initialStudio: honours a permitted saved studio, otherwise the role default', () => {
    assert.equal(defaultStudio('user'), 'visualizer-3d');
    assert.equal(defaultStudio('admin'), 'os-control');
    assert.equal(initialStudio('user', 'os-control'), 'visualizer-3d');
    assert.equal(initialStudio('admin', 'gates-studio'), 'gates-studio');
    assert.equal(initialStudio('admin', null), 'os-control');
});

test('initials: name, dotted e-mail, single word, empty', () => {
    assert.equal(initials('Ada Lovelace', 'x@y.z'), 'AL');
    assert.equal(initials('', 'grace.hopper@navy.mil'), 'GH');
    assert.equal(initials('Linus', null), 'LI');
    assert.equal(initials('', ''), '?');
});
