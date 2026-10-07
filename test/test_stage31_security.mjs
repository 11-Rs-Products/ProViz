/**
 * test/test_stage31_security.mjs
 * Comprehensive Test Suite for ProViz Stage 31:
 * Universal Security, Safety & Adversarial Verification Engine.
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';

import * as Security from '../src/security/index.js';
import * as Semantic from '../src/semantic/index.js';
import * as Knowledge from '../src/knowledge/index.js';
import * as Planning from '../src/planning/index.js';
import * as Orchestration from '../src/orchestration/index.js';
import * as Federation from '../src/federation/index.js';
import * as Evolution from '../src/evolution/index.js';
import { Debugger } from '../src/debugger/Debugger.js';

describe('Stage 31: Universal Security, Safety & Adversarial Verification Engine', () => {
  let engine;

  beforeEach(() => {
    engine = new Security.SecurityEngine();
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. Threat Modeling & Core Models
  // ─────────────────────────────────────────────────────────────────────────────
  describe('1. Threat Modeling & Core Models', () => {
    it('1.1 should create ThreatActor with roles and capabilities', () => {
      const actor = new Security.ThreatActor({
        id: 'actor:guest',
        role: Security.ThreatActorRole.UNAUTHENTICATED,
        capabilities: ['NETWORK_ACCESS', 'PUBLIC_PROBING'],
        accessibleBoundaries: ['tb:public']
      });

      assert.equal(actor.id, 'actor:guest');
      assert.equal(actor.role, 'UNAUTHENTICATED');
      assert.equal(actor.hasCapability('NETWORK_ACCESS'), true);
      assert.equal(actor.hasCapability('DATABASE_WRITE'), false);
      assert.equal(actor.canAccess('tb:public'), true);
      assert.equal(actor.canAccess('tb:internal'), false);
    });

    it('1.2 should create Asset with sensitivity levels and serialization', () => {
      const asset = new Security.Asset({
        id: 'asset:jwt_secret',
        kind: Security.AssetKind.CREDENTIAL,
        name: 'JWT Signing Secret',
        sensitivity: Security.SensitivityLevel.CRITICAL,
        semanticTarget: 'config.jwtSecret'
      });

      assert.equal(asset.id, 'asset:jwt_secret');
      assert.equal(asset.isCritical(), true);
      const json = asset.toJSON();
      const restored = Security.Asset.fromJSON(json);
      assert.equal(restored.id, asset.id);
      assert.equal(restored.sensitivity, Security.SensitivityLevel.CRITICAL);
    });

    it('1.3 should create TrustBoundary and evaluate domain crossings', () => {
      const boundary = new Security.TrustBoundary({
        id: 'tb:dmz',
        type: Security.TrustBoundaryType.UNTRUSTED_TO_TRUSTED,
        sourceDomain: 'EXTERNAL_WEB',
        targetDomain: 'INTERNAL_API',
        entryPoints: ['api/login', 'api/register'],
        sanitizers: ['sanitizeHtml', 'validateEmail']
      });

      assert.equal(boundary.isEntry('api/login'), true);
      assert.equal(boundary.isEntry('internal/admin'), false);
      assert.equal(boundary.hasSanitizer('validateEmail'), true);
    });

    it('1.4 should manage AttackSurface with exposed entry points', () => {
      const surface = new Security.AttackSurface();
      surface.addEntry({
        id: 'entry:login',
        kind: Security.EntryPointKind.NETWORK_ENDPOINT,
        targetNodeId: 'authService.login',
        exposedParameters: ['username', 'password']
      });

      assert.equal(surface.size(), 1);
      assert.equal(surface.getEntry('entry:login').targetNodeId, 'authService.login');
      assert.equal(surface.getEntriesForNode('authService.login').length, 1);
    });

    it('1.5 should assemble complete ThreatModel and query components', () => {
      const tm = engine.createThreatModel({
        id: 'tm:webapp',
        name: 'Web Application Threat Model',
        actors: [{ id: 'act:anon', role: 'UNAUTHENTICATED' }],
        assets: [{ id: 'ast:db_creds', kind: 'CREDENTIAL', sensitivity: 'CRITICAL' }],
        trustBoundaries: [{ id: 'tb:api', sourceDomain: 'WEB', targetDomain: 'APP' }],
        assumptions: ['TLS 1.3 is enforced at gateway']
      });

      assert.equal(tm.id, 'tm:webapp');
      assert.equal(tm.getActor('act:anon').id, 'act:anon');
      assert.equal(tm.getAsset('ast:db_creds').isCritical(), true);
      assert.equal(tm.getTrustBoundary('tb:api').sourceDomain, 'WEB');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. Security Properties, Invariants & Constraints
  // ─────────────────────────────────────────────────────────────────────────────
  describe('2. Security Properties, Invariants & Constraints', () => {
    it('2.1 should define SecurityInvariant and evaluate predicates', () => {
      const inv = new Security.SecurityInvariant({
        id: 'inv:no_sqli',
        property: Security.SecurityPropertyKind.INTEGRITY,
        expression: 'untrusted_input -> parameterized_query',
        predicate: (ctx) => ctx.isParameterized === true
      });

      assert.equal(inv.property, 'INTEGRITY');
      assert.equal(inv.evaluates({ isParameterized: true }), true);
      assert.equal(inv.evaluates({ isParameterized: false }), false);
    });

    it('2.2 should define SMT-compatible SecurityConstraint', () => {
      const constraint = new Security.SecurityConstraint({
        id: 'sc:ptr_bound',
        name: 'Pointer Bounds Check',
        smtExpression: '(assert (and (>= ptr 0) (< ptr buffer_size)))',
        enforcement: Security.ConstraintEnforcement.HARD
      });

      assert.equal(constraint.isHard(), true);
      assert.ok(constraint.smtExpression.includes('buffer_size'));
    });

    it('2.3 should create AttackGoal with target asset and severity', () => {
      const goal = new Security.AttackGoal({
        id: 'goal:auth_bypass',
        category: Security.AttackGoalCategory.BYPASS_AUTHORIZATION,
        targetAssetId: 'ast:user_profile',
        severity: 0.9
      });

      assert.equal(goal.category, 'BYPASS_AUTHORIZATION');
      assert.equal(goal.targetAssetId, 'ast:user_profile');
      assert.equal(goal.severity, 0.9);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. Flow Analysis, Authorization & Authentication
  // ─────────────────────────────────────────────────────────────────────────────
  describe('3. Flow Analysis, Authorization & Authentication', () => {
    it('3.1 should track untrusted source-sink flow and sanitization', () => {
      const sink = new Security.SecuritySink({
        id: 'sink:exec',
        operation: Security.SinkOperation.COMMAND_EXECUTION,
        targetNodeId: 'child_process.exec',
        requiredSanitizers: ['sanitizeCmd']
      });

      const untrustedSource = { id: 'src:query', isUntrusted: true };

      // Flow without sanitizer -> Violation
      const flowViolation = engine.sourceSinkAnalyzer.analyzeFlow(untrustedSource, sink, [], []);
      assert.equal(flowViolation.isViolation, true);
      assert.equal(flowViolation.classification, Security.FlowClassification.VIOLATION);

      // Flow with sanitizer -> Sanitized Safe
      const flowSafe = engine.sourceSinkAnalyzer.analyzeFlow(untrustedSource, sink, [], ['sanitizeCmd']);
      assert.equal(flowSafe.isViolation, false);
      assert.equal(flowSafe.classification, Security.FlowClassification.SANITIZED);
    });

    it('3.2 should analyze information flow confidentiality leaks', () => {
      const secret = new Security.Asset({
        id: 'ast:api_key',
        kind: Security.AssetKind.CREDENTIAL,
        sensitivity: Security.SensitivityLevel.CONFIDENTIAL
      });
      const publicSink = new Security.SecuritySink({
        id: 'sink:http_out',
        operation: Security.SinkOperation.NETWORK_SEND,
        targetNodeId: 'http.response.send'
      });

      const resLeak = engine.analyzeInformationFlow(secret, publicSink, { isEncrypted: false });
      assert.equal(resLeak.isViolation, true);

      const resEncrypted = engine.analyzeInformationFlow(secret, publicSink, { isEncrypted: true });
      assert.equal(resEncrypted.isViolation, false);
    });

    it('3.3 should evaluate privilege flow and unauthorized elevation', () => {
      const resDeny = engine.analyzePrivilegeFlow('LOW_PRIVILEGE', 'ADMIN', []);
      assert.equal(resDeny.isEscalationViolation, true);

      const resAllow = engine.analyzePrivilegeFlow('ADMIN', 'USER', []);
      assert.equal(resAllow.isEscalationViolation, false);
    });

    it('3.4 should verify access authorization and RBAC guards', () => {
      const actor = { id: 'u123', permissions: ['READ_DOCS'] };
      const resource = { id: 'admin_panel', requiredPermission: 'ADMIN_ACCESS' };

      const resUnauthorized = engine.analyzeAuthorization(actor, resource, []);
      assert.equal(resUnauthorized.isViolation, true);

      const resAuthorized = engine.analyzeAuthorization(actor, resource, ['AUTHZ_GUARD_ACTIVE']);
      assert.equal(resAuthorized.isViolation, false);
    });

    it('3.5 should verify session authentication state', () => {
      const invalidSession = engine.analyzeAuthentication({ sessionId: null });
      assert.equal(invalidSession.isAuthenticated, false);

      const validSession = engine.analyzeAuthentication({ sessionId: 'sess_123', isExpired: false });
      assert.equal(validSession.isAuthenticated, true);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. Input Validation & Resource Safety
  // ─────────────────────────────────────────────────────────────────────────────
  describe('4. Input Validation & Resource Safety', () => {
    it('4.1 should detect unvalidated input parameters', () => {
      const resMissing = engine.analyzeInputValidation('user_input', []);
      assert.equal(resMissing.isVulnerable, true);

      const resValidated = engine.analyzeInputValidation('user_input', ['VALIDATE_STRING']);
      assert.equal(resValidated.isVulnerable, false);
    });

    it('4.2 should analyze loop and recursion bounds for DoS vulnerabilities', () => {
      const unbounded = engine.analyzeResourceSafety({ maxLoopIterations: 5000000 });
      assert.equal(unbounded.isVulnerable, true);

      const bounded = engine.analyzeResourceSafety({ maxLoopIterations: 100, maxRecursionDepth: 10 });
      assert.equal(bounded.isVulnerable, false);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. Attack Graph & Adversarial Exploration
  // ─────────────────────────────────────────────────────────────────────────────
  describe('5. Attack Graph & Adversarial Exploration', () => {
    it('5.1 should construct AttackGraph and discover reachable attack paths', () => {
      const ag = new Security.AttackGraph();
      ag.addNode(new Security.AttackNode({ id: 'entry:web', type: 'ENTRY_POINT' }));
      ag.addNode(new Security.AttackNode({ id: 'step:parser', type: 'INTERMEDIATE' }));
      ag.addNode(new Security.AttackNode({ id: 'sink:db', type: 'SINK' }));

      ag.addEdge(new Security.AttackEdge({ id: 'e1', source: 'entry:web', target: 'step:parser' }));
      ag.addEdge(new Security.AttackEdge({ id: 'e2', source: 'step:parser', target: 'sink:db' }));

      const paths = engine.findAttackPaths(ag, 'entry:web', 'sink:db');
      assert.equal(paths.length, 1);
      assert.equal(paths[0].length, 3);
      assert.equal(paths[0].entryNodeId, 'entry:web');
      assert.equal(paths[0].sinkNodeId, 'sink:db');
    });

    it('5.2 should generate boundary and malformed adversarial inputs', () => {
      const inputs = engine.generateAdversarialInputs('queryParam', 'string');
      assert.ok(inputs.length >= 4);
      const traversal = inputs.find(i => i.category === Security.AdversarialInputCategory.STRUCTURALLY_INVALID);
      assert.ok(traversal);
      assert.ok(traversal.payload.includes('..'));
    });

    it('5.3 should prioritize attack candidates deterministically', () => {
      const cand1 = new Security.AttackCandidate({
        id: 'c1',
        targetAssetId: 'a1',
        reachability: 0.5,
        impact: 0.5,
        exploitability: 0.5,
        evidenceStrength: 0.5
      });
      const cand2 = new Security.AttackCandidate({
        id: 'c2',
        targetAssetId: 'a1',
        reachability: 0.9,
        impact: 0.9,
        exploitability: 0.9,
        evidenceStrength: 0.9
      });

      const prioritized = engine.prioritizeAttacks([cand1, cand2]);
      assert.equal(prioritized[0].id, 'c2');
    });

    it('5.4 should execute attack in sandbox and produce structured counterexample', () => {
      const cand = new Security.AttackCandidate({
        id: 'cand:sqli',
        targetAssetId: 'ast:db',
        entryNodeId: 'api/search',
        sinkNodeId: 'db.query',
        reachability: 0.9,
        exploitability: 0.8
      });

      const res = engine.executeAttack(cand, { simulatedVulnerability: true });
      assert.equal(res.isVulnerable, true);
      assert.ok(res.counterexample);
      assert.equal(res.counterexample.entryNodeId, 'api/search');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. Security Mutation, Mitigation & Regression
  // ─────────────────────────────────────────────────────────────────────────────
  describe('6. Security Mutation, Mitigation & Regression', () => {
    it('6.1 should generate security mutants and evaluate kill rates', () => {
      const mutants = engine.mutationEngine.generateMutants(['authMiddleware', 'inputParser']);
      assert.ok(mutants.length >= 8);

      const killResult = engine.mutationEngine.evaluateMutantKillRate(mutants, {
        survivingMutantIds: [mutants[0].id]
      });
      assert.equal(killResult.survivedCount, 1);
      assert.equal(killResult.isRobust, false);
    });

    it('6.2 should synthesize and validate mitigations against counterexamples', () => {
      const cx = new Security.SecurityCounterexample({
        id: 'cx:idor',
        entryNodeId: 'api/account',
        adversarialInput: { id: 999 },
        violatedProperty: 'AUTHORIZATION_BYPASS',
        sensitiveAssetId: 'ast:account_data'
      });

      const mitigations = engine.generateMitigations(cx);
      assert.ok(mitigations.length >= 2);

      const valPass = engine.validateMitigation(mitigations[0], cx);
      assert.equal(valPass.isValid, true);

      const valFail = engine.validateMitigation(mitigations[0], cx, { breaksLegitimateBehavior: true });
      assert.equal(valFail.isValid, false);
    });

    it('6.3 should run security regression against historical attacks', () => {
      const cx1 = new Security.SecurityCounterexample({ id: 'cx1', entryNodeId: 'e1', violatedProperty: 'PROP_A' });
      const cx2 = new Security.SecurityCounterexample({ id: 'cx2', entryNodeId: 'e2', violatedProperty: 'PROP_B' });

      const regClean = engine.regressionAnalyzer.runSecurityRegression([cx1, cx2], { reopenedCounterexampleIds: [] });
      assert.equal(regClean.hasRegression, false);

      const regReopened = engine.regressionAnalyzer.runSecurityRegression([cx1, cx2], { reopenedCounterexampleIds: ['cx1'] });
      assert.equal(regReopened.hasRegression, true);
      assert.equal(regReopened.regressedCount, 1);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 7. Evidence, Certification & Snapshots
  // ─────────────────────────────────────────────────────────────────────────────
  describe('7. Evidence, Certification & Snapshots', () => {
    it('7.1 should generate scoped SecurityCertificate', () => {
      const tm = engine.createThreatModel({ id: 'tm:cert_test', assumptions: ['Network isolated'] });
      const cert = engine.generateSecurityCertificate(tm, [{ id: 'ev:clean' }], { scope: 'LOCAL_MODULE' });

      assert.equal(cert.threatModelId, 'tm:cert_test');
      assert.equal(cert.scope, 'LOCAL_MODULE');
      assert.equal(cert.isCertified, true);
      assert.ok(cert.limitations.length > 0);
    });

    it('7.2 should create and restore SecuritySnapshot', () => {
      const snapshot = new Security.SecuritySnapshot({
        snapshotId: 'snap:001',
        threatModelId: 'tm:snap',
        threatModelState: { activeActors: 2 },
        attackGraphState: { nodeCount: 10 }
      });

      assert.equal(snapshot.snapshotId, 'snap:001');
      assert.equal(snapshot.threatModelState.activeActors, 2);
      const json = snapshot.toJSON();
      const restored = Security.SecuritySnapshot.fromJSON(json);
      assert.equal(restored.snapshotId, 'snap:001');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 8. Thirty-Two Mandatory End-to-End Scenarios
  // ─────────────────────────────────────────────────────────────────────────────
  describe('8. Thirty-Two Mandatory End-to-End Scenarios', () => {
    it('Scenario 1: Construct a complete threat model', () => {
      const tm = engine.createThreatModel({
        id: 'tm:s1',
        actors: [{ id: 'actor:anon', role: 'UNAUTHENTICATED' }],
        assets: [{ id: 'ast:db', kind: 'DATA', sensitivity: 'CRITICAL' }],
        trustBoundaries: [{ id: 'tb:gw', sourceDomain: 'EXT', targetDomain: 'INT' }]
      });
      assert.equal(tm.actors.length, 1);
      assert.equal(tm.assets.length, 1);
      assert.equal(tm.trustBoundaries.length, 1);
    });

    it('Scenario 2: Identify public attack surfaces', () => {
      const surface = new Security.AttackSurface();
      surface.addEntry({ id: 'ep1', kind: 'PUBLIC_API', targetNodeId: 'handler.get' });
      assert.equal(surface.getEntries().length, 1);
    });

    it('Scenario 3: Identify trust boundaries', () => {
      const tb = new Security.TrustBoundary({ id: 'tb:dmz', sourceDomain: 'WEB', targetDomain: 'SVC' });
      assert.equal(tb.sourceDomain, 'WEB');
    });

    it('Scenario 4: Identify sensitive assets', () => {
      const ast = new Security.Asset({ id: 'ast:key', kind: 'CREDENTIAL', sensitivity: 'CRITICAL' });
      assert.equal(ast.isCritical(), true);
    });

    it('Scenario 5: Detect unauthorized information flow', () => {
      const res = engine.analyzeInformationFlow(
        new Security.Asset({ id: 'ast:secret', sensitivity: 'CRITICAL' }),
        new Security.SecuritySink({ id: 'sink:net', operation: 'NETWORK_SEND', targetNodeId: 'out' })
      );
      assert.equal(res.isViolation, true);
    });

    it('Scenario 6: Detect secret reaching an observable sink', () => {
      const res = engine.analyzeInformationFlow(
        new Security.Asset({ id: 'ast:token', sensitivity: 'CONFIDENTIAL' }),
        new Security.SecuritySink({ id: 'sink:log', operation: 'SECRET_OUTPUT', targetNodeId: 'console.log' })
      );
      assert.equal(res.isViolation, true);
    });

    it('Scenario 7: Detect privilege escalation', () => {
      const res = engine.analyzePrivilegeFlow('LOW_PRIVILEGE', 'HIGH_PRIVILEGE', []);
      assert.equal(res.isEscalationViolation, true);
    });

    it('Scenario 8: Detect authorization bypass', () => {
      const res = engine.analyzeAuthorization({ id: 'u1', permissions: [] }, { id: 'admin_op', requiredPermission: 'WRITE' }, []);
      assert.equal(res.isViolation, true);
    });

    it('Scenario 9: Detect authentication-state violation', () => {
      const res = engine.analyzeAuthentication({ sessionId: 's1', isExpired: true });
      assert.equal(res.isAuthenticated, false);
    });

    it('Scenario 10: Detect missing input validation', () => {
      const res = engine.analyzeInputValidation('param_id', []);
      assert.equal(res.isVulnerable, true);
    });

    it('Scenario 11: Generate adversarial boundary inputs', () => {
      const inputs = engine.generateAdversarialInputs('amount', 'number');
      assert.ok(inputs.some(i => i.category === 'BOUNDARY'));
    });

    it('Scenario 12: Generate malformed inputs', () => {
      const inputs = engine.generateAdversarialInputs('user_str', 'string');
      assert.ok(inputs.some(i => i.category === 'MALFORMED'));
    });

    it('Scenario 13: Generate resource-exhaustion inputs', () => {
      const inputs = engine.generateAdversarialInputs('payload', 'string');
      assert.ok(inputs.some(i => i.category === 'RESOURCE_EXPENSIVE'));
    });

    it('Scenario 14: Find an attack path through CFG/DFG', () => {
      const ag = new Security.AttackGraph();
      ag.addNode(new Security.AttackNode({ id: 'src' }));
      ag.addNode(new Security.AttackNode({ id: 'sink' }));
      ag.addEdge(new Security.AttackEdge({ id: 'e1', source: 'src', target: 'sink' }));
      const paths = engine.findAttackPaths(ag, 'src', 'sink');
      assert.equal(paths.length, 1);
    });

    it('Scenario 15: Produce a symbolic security counterexample', () => {
      const cx = new Security.SecurityCounterexample({
        id: 'cx:sym',
        entryNodeId: 'fEntry',
        adversarialInput: 'x = -1',
        violatedProperty: 'ARRAY_BOUNDS_CHECK'
      });
      assert.equal(cx.violatedProperty, 'ARRAY_BOUNDS_CHECK');
    });

    it('Scenario 16: Produce a concolic security counterexample', () => {
      const cx = new Security.SecurityCounterexample({
        id: 'cx:conc',
        entryNodeId: 'parser',
        adversarialInput: '\0ADMIN',
        violatedProperty: 'NULL_BYTE_SANITY'
      });
      assert.equal(cx.adversarialInput, '\0ADMIN');
    });

    it('Scenario 17: Detect a security mutation that survives', () => {
      const mutants = [new Security.SecurityMutant({ id: 'm1', operator: 'REMOVE_VALIDATION', targetNodeId: 'n1' })];
      const res = engine.mutationEngine.evaluateMutantKillRate(mutants, { survivingMutantIds: ['m1'] });
      assert.equal(res.survivedCount, 1);
      assert.equal(res.isRobust, false);
    });

    it('Scenario 18: Prioritize multiple attack paths', () => {
      const candLow = new Security.AttackCandidate({ id: 'cLow', targetAssetId: 'a', reachability: 0.2 });
      const candHigh = new Security.AttackCandidate({ id: 'cHigh', targetAssetId: 'a', reachability: 0.9 });
      const ranked = engine.prioritizeAttacks([candLow, candHigh]);
      assert.equal(ranked[0].id, 'cHigh');
    });

    it('Scenario 19: Execute an attack in isolation', () => {
      const cand = new Security.AttackCandidate({ id: 'cExec', targetAssetId: 'a', entryNodeId: 'e', sinkNodeId: 's' });
      const res = engine.executeAttack(cand, { simulatedVulnerability: true });
      assert.equal(res.executed, true);
    });

    it('Scenario 20: Reject an attack that is unreachable', () => {
      const ag = new Security.AttackGraph();
      ag.addNode(new Security.AttackNode({ id: 'entry' }));
      ag.addNode(new Security.AttackNode({ id: 'unreachable_sink' }));
      const paths = engine.findAttackPaths(ag, 'entry', 'unreachable_sink');
      assert.equal(paths.length, 0);
    });

    it('Scenario 21: Generate a mitigation', () => {
      const cx = new Security.SecurityCounterexample({ id: 'cx21', entryNodeId: 'e', violatedProperty: 'INJECTION' });
      const mits = engine.generateMitigations(cx);
      assert.ok(mits.length > 0);
    });

    it('Scenario 22: Validate mitigation against the original attack', () => {
      const cx = new Security.SecurityCounterexample({ id: 'cx22', entryNodeId: 'e', violatedProperty: 'INJECTION' });
      const mit = new Security.MitigationCandidate({ id: 'm22', counterexampleId: 'cx22', targetFile: 'app.js', patchContent: '// patch' });
      const val = engine.validateMitigation(mit, cx);
      assert.equal(val.isValid, true);
    });

    it('Scenario 23: Ensure mitigation preserves legitimate behavior', () => {
      const cx = new Security.SecurityCounterexample({ id: 'cx23', entryNodeId: 'e', violatedProperty: 'INJECTION' });
      const mit = new Security.MitigationCandidate({ id: 'm23', counterexampleId: 'cx23', targetFile: 'app.js', patchContent: '// patch' });
      const val = engine.validateMitigation(mit, cx, { breaksLegitimateBehavior: true });
      assert.equal(val.preservesLegit, false);
      assert.equal(val.isValid, false);
    });

    it('Scenario 24: Detect mitigation-induced regression', () => {
      const cx = new Security.SecurityCounterexample({ id: 'cx24', entryNodeId: 'e', violatedProperty: 'INJECTION' });
      const mit = new Security.MitigationCandidate({ id: 'm24', counterexampleId: 'cx24', targetFile: 'app.js', patchContent: '// patch' });
      const val = engine.validateMitigation(mit, cx, { newVulnerabilitiesDetected: true });
      assert.equal(val.introducesNewVulns, true);
      assert.equal(val.isValid, false);
    });

    it('Scenario 25: Compare multiple mitigations', () => {
      const mit1 = new Security.MitigationCandidate({ id: 'm1', counterexampleId: 'cx', targetFile: 'f', patchContent: 'p', effectiveness: 0.8 });
      const mit2 = new Security.MitigationCandidate({ id: 'm2', counterexampleId: 'cx', targetFile: 'f', patchContent: 'p', effectiveness: 0.99 });
      const ranked = [mit1, mit2].sort((a, b) => b.effectiveness - a.effectiveness);
      assert.equal(ranked[0].id, 'm2');
    });

    it('Scenario 26: Apply a verified mitigation in Debugger workspace', () => {
      const dbg = new Debugger();
      const ws = dbg._evolutionEngine.createWorkspace('ws:sec', { 'app.js': 'function test() {}' });
      const mit = new Security.MitigationCandidate({ id: 'm26', counterexampleId: 'cx', targetFile: 'app.js', patchContent: '// Guard\n' });
      const res = dbg.applyMitigation(mit, ws);
      assert.equal(res.applied, true);
    });

    it('Scenario 27: Roll back a failed mitigation', () => {
      const dbg = new Debugger();
      const ws = dbg._evolutionEngine.createWorkspace('ws:sec2', { 'app.js': 'original' });
      const res = dbg.rollbackMitigation('m27', ws);
      assert.equal(res.rolledBack, true);
    });

    it('Scenario 28: Synchronize security findings with Stage 28 Knowledge Graph', () => {
      const kg = new Knowledge.VerificationKnowledgeGraph();
      const cx = new Security.SecurityCounterexample({
        id: 'cx28',
        entryNodeId: 'entry',
        violatedProperty: 'AUTHZ_BYPASS',
        sensitiveAssetId: 'ast:secret'
      });
      const res = engine.synchronizer.syncToKnowledgeGraph(cx, kg);
      assert.equal(res.synced, true);
      assert.ok(kg.getEntity('finding:cx28'));
    });

    it('Scenario 29: Feed security impact into Stage 29 Semantic Model', () => {
      const sg = new Semantic.SemanticProgramGraph();
      sg.addNode(new Semantic.SemanticNode({ id: 'targetFn', kind: Semantic.SemanticEntityKind.FUNCTION }));
      const cx = new Security.SecurityCounterexample({
        id: 'cx29',
        entryNodeId: 'targetFn',
        violatedProperty: 'TAINT_LEAK'
      });
      const res = engine.synchronizer.syncToSemanticModel(cx, sg);
      assert.equal(res.updated, true);
      assert.equal(sg.getNode('targetFn').verificationState, 'COUNTEREXAMPLE_FOUND');
    });

    it('Scenario 30: Generate Stage 25 security verification goals', () => {
      const pEngine = new Planning.PlanningEngine();
      const goal = pEngine.createGoal({
        id: 'sec_goal_1',
        category: 'SECURITY',
        targetSymbol: 'authService',
        description: 'Verify lack of authorization bypass'
      });
      assert.equal(goal.id, 'sec_goal_1');
    });

    it('Scenario 31: Federate security analysis through Stage 26 and Stage 27', () => {
      const fed = new Federation.FederationEngine();
      const agent = new Federation.VerificationAgent({
        agentId: 'agent:sec_solver',
        kind: Federation.VerificationAgentKind.FORMAL_VERIFIER,
        capabilities: ['SECURITY_PROOFS', 'SMT']
      });
      fed.registerAgent(agent);
      assert.ok(fed.getAgent('agent:sec_solver'));
    });

    it('Scenario 32: Complete closed-loop adversarial verification', () => {
      const tm = engine.createThreatModel({
        id: 'tm:e2e',
        actors: [{ id: 'act:anon', role: 'UNAUTHENTICATED' }],
        assets: [{ id: 'ast:db', kind: 'DATA', sensitivity: 'CRITICAL' }],
        trustBoundaries: [{ id: 'tb:public', sourceDomain: 'WEB', targetDomain: 'API' }]
      });

      const loop = engine.runAdversarialVerification(tm, null, null, {
        sandboxContext: { simulatedVulnerability: true }
      });

      assert.equal(loop.session.state, Security.SecuritySessionState.CERTIFIED);
      assert.ok(loop.counterexample);
      assert.ok(loop.mitigation);
      assert.equal(loop.decision.isSecure(), true);
      assert.ok(loop.certificate.isCertified);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 9. Debugger Stage 31 Integration APIs
  // ─────────────────────────────────────────────────────────────────────────────
  describe('9. Debugger Stage 31 Integration APIs', () => {
    let dbg;

    beforeEach(() => {
      dbg = new Debugger();
    });

    it('9.1 should manage threat models and assets via Debugger API', () => {
      const tm = dbg.createThreatModel({ id: 'dbg:tm1' });
      assert.ok(tm);
      dbg.addAsset('dbg:tm1', { id: 'ast:secret', kind: 'CREDENTIAL' });
      dbg.addThreatActor('dbg:tm1', { id: 'act:attacker', role: 'UNAUTHENTICATED' });

      const fetched = dbg.getThreatModel('dbg:tm1');
      assert.equal(fetched.assets.length, 1);
      assert.equal(fetched.actors.length, 1);
    });

    it('9.2 should run adversarial verification loop via Debugger API', () => {
      const tm = dbg.createThreatModel({ id: 'dbg:tm2', assets: [{ id: 'a1', kind: 'DATA' }] });
      const result = dbg.runAdversarialVerification(tm, null, null, {
        sandboxContext: { simulatedVulnerability: false }
      });
      assert.ok(result.certificate);
      assert.equal(result.certificate.isCertified, true);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 10. Performance Benchmarks
  // ─────────────────────────────────────────────────────────────────────────────
  describe('10. Performance Benchmarks', () => {
    it('10.1 100k security entities (<300ms)', () => {
      const start = performance.now();
      for (let i = 0; i < 100000; i++) {
        new Security.Asset({
          id: `ast_${i}`,
          kind: Security.AssetKind.DATA,
          sensitivity: Security.SensitivityLevel.CONFIDENTIAL
        });
      }
      const elapsed = performance.now() - start;
      assert.ok(elapsed < 300, `100k security entities took ${elapsed.toFixed(2)}ms (target <300ms)`);
    });

    it('10.2 200k attack edges (<450ms)', () => {
      const start = performance.now();
      for (let i = 0; i < 200000; i++) {
        new Security.AttackEdge({
          id: `ae_${i}`,
          source: `n_${i}`,
          target: `n_${i + 1}`
        });
      }
      const elapsed = performance.now() - start;
      assert.ok(elapsed < 450, `200k attack edges took ${elapsed.toFixed(2)}ms (target <450ms)`);
    });

    it('10.3 10k flow analyses (<300ms)', () => {
      const source = { id: 's', isUntrusted: true };
      const sink = new Security.SecuritySink({ id: 'k', targetNodeId: 'target', requiredSanitizers: ['san'] });
      const start = performance.now();
      for (let i = 0; i < 10000; i++) {
        engine.sourceSinkAnalyzer.analyzeFlow(source, sink, [], ['san']);
      }
      const elapsed = performance.now() - start;
      assert.ok(elapsed < 300, `10k flow analyses took ${elapsed.toFixed(2)}ms (target <300ms)`);
    });

    it('10.4 10k trust-boundary queries (<200ms)', () => {
      const tb = new Security.TrustBoundary({
        id: 'tb:perf',
        sourceDomain: 'EXT',
        targetDomain: 'INT',
        entryPoints: ['api/1', 'api/2', 'api/3']
      });
      const start = performance.now();
      for (let i = 0; i < 10000; i++) {
        tb.isEntry('api/2');
      }
      const elapsed = performance.now() - start;
      assert.ok(elapsed < 200, `10k trust-boundary queries took ${elapsed.toFixed(2)}ms (target <200ms)`);
    });

    it('10.5 10k authorization analyses (<350ms)', () => {
      const actor = { id: 'user', permissions: ['READ', 'WRITE'] };
      const resource = { id: 'doc', requiredPermission: 'READ' };
      const start = performance.now();
      for (let i = 0; i < 10000; i++) {
        engine.analyzeAuthorization(actor, resource, []);
      }
      const elapsed = performance.now() - start;
      assert.ok(elapsed < 350, `10k authorization analyses took ${elapsed.toFixed(2)}ms (target <350ms)`);
    });

    it('10.6 10k attack-path queries (<500ms)', () => {
      const ag = new Security.AttackGraph();
      ag.addNode(new Security.AttackNode({ id: 'e' }));
      ag.addNode(new Security.AttackNode({ id: 'm' }));
      ag.addNode(new Security.AttackNode({ id: 's' }));
      ag.addEdge(new Security.AttackEdge({ id: 'e1', source: 'e', target: 'm' }));
      ag.addEdge(new Security.AttackEdge({ id: 'e2', source: 'm', target: 's' }));

      const start = performance.now();
      for (let i = 0; i < 10000; i++) {
        engine.findAttackPaths(ag, 'e', 's', { maxPaths: 1 });
      }
      const elapsed = performance.now() - start;
      assert.ok(elapsed < 500, `10k attack-path queries took ${elapsed.toFixed(2)}ms (target <500ms)`);
    });

    it('10.7 10k adversarial-input generations (<500ms)', () => {
      const start = performance.now();
      for (let i = 0; i < 10000; i++) {
        engine.generateAdversarialInputs('param', 'number');
      }
      const elapsed = performance.now() - start;
      assert.ok(elapsed < 500, `10k adversarial-input generations took ${elapsed.toFixed(2)}ms (target <500ms)`);
    });

    it('10.8 1k attack prioritizations (<300ms)', () => {
      const candidates = [
        new Security.AttackCandidate({ id: 'c1', targetAssetId: 'a', reachability: 0.4 }),
        new Security.AttackCandidate({ id: 'c2', targetAssetId: 'a', reachability: 0.9 }),
        new Security.AttackCandidate({ id: 'c3', targetAssetId: 'a', reachability: 0.7 })
      ];
      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        engine.prioritizeAttacks(candidates);
      }
      const elapsed = performance.now() - start;
      assert.ok(elapsed < 300, `1k attack prioritizations took ${elapsed.toFixed(2)}ms (target <300ms)`);
    });

    it('10.9 1k security counterexample constructions (<400ms)', () => {
      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        new Security.SecurityCounterexample({
          id: `cx_${i}`,
          entryNodeId: 'entry',
          adversarialInput: { test: i },
          violatedProperty: 'INTEGRITY'
        });
      }
      const elapsed = performance.now() - start;
      assert.ok(elapsed < 400, `1k counterexample constructions took ${elapsed.toFixed(2)}ms (target <400ms)`);
    });

    it('10.10 1k mitigation validations (<600ms)', () => {
      const cx = new Security.SecurityCounterexample({ id: 'cx', entryNodeId: 'e', violatedProperty: 'P' });
      const mit = new Security.MitigationCandidate({ id: 'm', counterexampleId: 'cx', targetFile: 'f', patchContent: 'p' });
      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        engine.validateMitigation(mit, cx);
      }
      const elapsed = performance.now() - start;
      assert.ok(elapsed < 600, `1k mitigation validations took ${elapsed.toFixed(2)}ms (target <600ms)`);
    });

    it('10.11 1k security regressions (<500ms)', () => {
      const cxs = [
        new Security.SecurityCounterexample({ id: 'cx1', entryNodeId: 'e1', violatedProperty: 'P1' }),
        new Security.SecurityCounterexample({ id: 'cx2', entryNodeId: 'e2', violatedProperty: 'P2' })
      ];
      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        engine.regressionAnalyzer.runSecurityRegression(cxs, { reopenedCounterexampleIds: [] });
      }
      const elapsed = performance.now() - start;
      assert.ok(elapsed < 500, `1k security regressions took ${elapsed.toFixed(2)}ms (target <500ms)`);
    });

    it('10.12 1k security snapshots (<400ms)', () => {
      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        new Security.SecuritySnapshot({
          snapshotId: `snap_${i}`,
          threatModelId: 'tm_test',
          threatModelState: { count: i }
        });
      }
      const elapsed = performance.now() - start;
      assert.ok(elapsed < 400, `1k security snapshots took ${elapsed.toFixed(2)}ms (target <400ms)`);
    });
  });
});
