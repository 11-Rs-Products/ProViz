/**
 * test_stage19_repair.mjs — Test Suite for Stage 19 Program Repair & Patch Validation Engine
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { Patch } from '../src/repair/Patch.js';
import { PatchSet } from '../src/repair/PatchSet.js';
import { PatchValidator } from '../src/repair/PatchValidator.js';
import { PatchApplicability, APPLICABILITY_STATUS } from '../src/repair/PatchApplicability.js';
import { RootCause, ROOT_CAUSE_EVIDENCE } from '../src/repair/RootCause.js';
import { RootCauseAnalyzer } from '../src/repair/RootCauseAnalyzer.js';
import { RepairStrategy, REPAIR_STRATEGIES } from '../src/repair/RepairStrategy.js';
import { RepairHypothesis } from '../src/repair/RepairHypothesis.js';
import { Transformation } from '../src/repair/Transformation.js';
import { TransformationBuilder } from '../src/repair/TransformationBuilder.js';
import { PythonRepairAdapter } from '../src/repair/PythonRepairAdapter.js';
import { NullGuardRepairGenerator } from '../src/repair/NullGuardRepairGenerator.js';
import { DivisionRepairGenerator } from '../src/repair/DivisionRepairGenerator.js';
import { BoundsRepairGenerator } from '../src/repair/BoundsRepairGenerator.js';
import { TypeGuardRepairGenerator } from '../src/repair/TypeGuardRepairGenerator.js';
import { AttributeRepairGenerator } from '../src/repair/AttributeRepairGenerator.js';
import { CollectionRepairGenerator } from '../src/repair/CollectionRepairGenerator.js';
import { ExceptionRepairGenerator } from '../src/repair/ExceptionRepairGenerator.js';
import { RepairCandidate, REPAIR_CANDIDATE_STATUS } from '../src/repair/RepairCandidate.js';
import { RepairGenerator } from '../src/repair/RepairGenerator.js';
import { FindingResolution, RESOLUTION_STATUS } from '../src/repair/FindingResolution.js';
import { StaticRepairValidator } from '../src/repair/StaticRepairValidator.js';
import { SymbolicRepairValidator } from '../src/repair/SymbolicRepairValidator.js';
import { ConcolicRepairValidator } from '../src/repair/ConcolicRepairValidator.js';
import { RegressionValidator } from '../src/repair/RegressionValidator.js';
import { ContractValidator } from '../src/repair/ContractValidator.js';
import { BehavioralDelta, DELTA_CLASSIFICATION } from '../src/repair/BehavioralDelta.js';
import { RepairValidation } from '../src/repair/RepairValidation.js';
import { RepairExplanation } from '../src/repair/RepairExplanation.js';
import { RepairResult, REPAIR_RESULT_STATUS } from '../src/repair/RepairResult.js';
import { RepairSession } from '../src/repair/RepairSession.js';
import { RepairHistory } from '../src/repair/RepairHistory.js';
import { RepairSnapshot } from '../src/repair/RepairSnapshot.js';
import { RepairEngine } from '../src/repair/RepairEngine.js';
import { RepairQueries } from '../src/repair/RepairQueries.js';
import { RepairAnalyzer } from '../src/repair/RepairAnalyzer.js';
import { WorkspaceSnapshot } from '../src/workspace/WorkspaceSnapshot.js';
import { SourceFile } from '../src/workspace/SourceFile.js';
import { Debugger } from '../src/debugger/Debugger.js';

describe('Stage 19: Universal Program Repair & Patch Validation Engine', () => {

    it('1. Testing Patch & PatchSet Structural Edits...', () => {
        const patch = new Patch({
            fileId: 'main.py',
            startLine: 2,
            startColumn: 1,
            endLine: 2,
            endColumn: 1,
            replacement: '    if x == 0:\n        return 0\n',
            originalText: '',
        });

        assert.strictEqual(patch.startLine, 2);
        assert.ok(patch.patchId.startsWith('patch_'));

        const source = 'def divide(x):\n    return 10 / x';
        const patchedSource = patch.applyToString(source);
        assert.ok(patchedSource.includes('if x == 0:'));
        assert.ok(patchedSource.includes('return 10 / x'));

        // PatchSet and Reverse
        const patchSet = new PatchSet({ edits: [patch] });
        const reversed = patchSet.reverse();
        assert.strictEqual(reversed.edits.length, 1);

        // Validation
        const validation = PatchValidator.validate(patchSet, source);
        assert.strictEqual(validation.valid, true);

        // Applicability
        const applicability = PatchApplicability.check(patchSet, source);
        assert.strictEqual(applicability.isApplicable, true);
    });

    it('2. Testing RootCause & RootCauseAnalyzer...', () => {
        const finding = {
            id: 'f_div_0',
            kind: 'POSSIBLE_DIVISION_BY_ZERO',
            location: { fileId: 'main.py', line: 2, col: 12 },
            message: 'Possible division by zero on divisor x',
        };

        const source = 'def divide(x):\n    return 10 / x';
        const rootCause = RootCauseAnalyzer.analyzeFinding(finding, { workspace: source });

        assert.strictEqual(rootCause.location.line, 2);
        assert.strictEqual(rootCause.variableName, 'x');
        assert.strictEqual(rootCause.evidence, ROOT_CAUSE_EVIDENCE.POSSIBLE);
    });

    it('3. Testing Division Repair Generator & Validation Pipeline...', () => {
        const source = 'def divide(x):\n    return 10 / x';
        const finding = {
            id: 'f_div',
            kind: 'POSSIBLE_DIVISION_BY_ZERO',
            location: { fileId: 'main.py', line: 2, col: 12 },
            message: 'divisor x may be zero',
        };

        const candidates = RepairGenerator.generateRepairs(finding, { workspace: source });
        assert.ok(candidates.length >= 1);
        const divCandidate = candidates.find(c => c.strategy === REPAIR_STRATEGIES.DIVISION_GUARD);
        assert.ok(divCandidate);

        const engine = new RepairEngine();
        const result = engine.validateCandidate(divCandidate, source, {
            finding,
            counterexample: { bindings: { x: 0 } },
        });

        assert.strictEqual(result.isValidated, true);
        assert.strictEqual(result.findingResolution.isResolved, true);
        assert.ok(result.validation.staticAnalysis.valid);
        assert.ok(result.validation.concolic.valid);
    });

    it('4. Testing Null Guard Repair Generator...', () => {
        const source = 'def get_val(x):\n    return x.value';
        const finding = {
            id: 'f_none',
            kind: 'POSSIBLE_NONE_ACCESS',
            location: { fileId: 'main.py', line: 2, col: 12 },
            message: 'Possible None access on variable x',
        };

        const candidates = RepairGenerator.generateRepairs(finding, { workspace: source });
        const nullCandidate = candidates.find(c => c.strategy === REPAIR_STRATEGIES.NULL_GUARD);
        assert.ok(nullCandidate);

        const engine = new RepairEngine();
        const result = engine.validateCandidate(nullCandidate, source, { finding });
        assert.strictEqual(result.isValidated, true);
        assert.strictEqual(result.findingResolution.isResolved, true);
    });

    it('5. Testing Bounds & Collection Repair Generators...', () => {
        const source = 'def get_elem(xs, i):\n    return xs[i]';
        const finding = {
            id: 'f_idx',
            kind: 'POSSIBLE_INDEX_OUT_OF_BOUNDS',
            location: { fileId: 'main.py', line: 2, col: 12 },
            message: 'Index i out of bounds on xs',
        };

        const candidates = RepairGenerator.generateRepairs(finding, { workspace: source });
        const boundsCandidate = candidates.find(c => c.strategy === REPAIR_STRATEGIES.BOUNDS_CHECK);
        assert.ok(boundsCandidate);

        const engine = new RepairEngine();
        const result = engine.validateCandidate(boundsCandidate, source, { finding });
        assert.strictEqual(result.isValidated, true);
    });

    it('6. Testing TypeGuard & Exception Repair Generators...', () => {
        const source = 'def compute(x):\n    return x + 10';
        const finding = {
            id: 'f_type',
            kind: 'POSSIBLE_TYPE_MISMATCH',
            location: { fileId: 'main.py', line: 2, col: 12 },
            message: 'Type mismatch on x',
        };

        const candidates = RepairGenerator.generateRepairs(finding, { workspace: source });
        const typeCandidate = candidates.find(c => c.strategy === REPAIR_STRATEGIES.TYPE_GUARD);
        const excCandidate = candidates.find(c => c.strategy === REPAIR_STRATEGIES.EXCEPTION_HANDLING);

        assert.ok(typeCandidate);
        assert.ok(excCandidate);
    });

    it('7. Testing Symbolic, Concolic & Regression Validation...', () => {
        const source = 'def divide(x):\n    return 10 / x';
        const finding = {
            id: 'f_div',
            kind: 'POSSIBLE_DIVISION_BY_ZERO',
            location: { fileId: 'main.py', line: 2, col: 12 },
            message: 'divisor x may be zero',
        };

        const candidates = RepairGenerator.generateRepairs(finding, { workspace: source });
        const cand = candidates[0];

        const patchedSource = cand.patch.apply(source);
        const symbolicRes = SymbolicRepairValidator.validate(cand, patchedSource);
        assert.strictEqual(symbolicRes.valid, true);

        const concolicRes = ConcolicRepairValidator.validate(cand, patchedSource, {
            counterexample: { bindings: { x: 0 } },
        });
        assert.strictEqual(concolicRes.valid, true);

        const regressionRes = RegressionValidator.validate(cand, patchedSource);
        assert.strictEqual(regressionRes.valid, true);
    });

    it('8. Testing BehavioralDelta & RepairExplanation...', () => {
        const delta = BehavioralDelta.compare(
            { exception: { type: 'ZeroDivisionError' } },
            { returnedValue: 0 }
        );

        assert.strictEqual(delta.classification, DELTA_CLASSIFICATION.EXPECTED);
        assert.ok(delta.exceptionsAvoided.includes('ZeroDivisionError'));

        const explanation = new RepairExplanation({
            finding: { kind: 'POSSIBLE_DIVISION_BY_ZERO' },
            rootCause: { location: { line: 2 }, explanation: 'divisor x is 0' },
            expectedEffect: 'Guarded zero denominator',
        });

        const summary = explanation.formatSummary();
        assert.ok(summary.includes('Problem: POSSIBLE_DIVISION_BY_ZERO'));
        assert.ok(summary.includes('Static evidence:'));
    });

    it('9. Testing RepairHistory & Session Snapshots...', () => {
        const history = new RepairHistory();
        const cand = new RepairCandidate({
            workspaceSnapshotId: 'snap_1',
            patch: new PatchSet(),
        });

        const entry = history.recordApplied(cand, 1, 2);
        assert.strictEqual(entry.userAction, 'APPLIED');
        assert.strictEqual(history.getAllEntries().length, 1);

        const reverted = history.recordReverted(entry.repairId, 2, 1);
        assert.strictEqual(reverted.userAction, 'REVERTED');
        assert.strictEqual(history.getAllEntries().length, 2);
    });

    it('10. Testing Debugger Integration (Stage 19 APIs)...', () => {
        const dbg = new Debugger();
        const trace = {
            events: [
                {
                    event_type: 'step',
                    line: 2,
                    frame_index: 0,
                    source_code: 'def divide(x):\n    return 10 / x',
                },
            ],
        };
        dbg.loadExecution(trace);

        const candidates = dbg.generateRepairCandidates('f_div');
        assert.ok(Array.isArray(candidates));
        assert.ok(candidates.length >= 1);

        const candidateId = candidates[0].candidateId;
        const result = dbg.validateRepair(candidateId);
        assert.ok(result);

        const preview = dbg.previewRepair(candidateId);
        assert.ok(typeof preview === 'string');

        const applyRes = dbg.applyRepair(candidateId);
        assert.strictEqual(applyRes.status, 'APPLIED');

        const hist = dbg.getRepairHistory();
        assert.ok(hist.length >= 1);
    });

    it('11. Testing Determinism & Serialization Stability...', () => {
        const source = 'def divide(x):\n    return 10 / x';
        const finding = {
            id: 'f_div',
            kind: 'POSSIBLE_DIVISION_BY_ZERO',
            location: { fileId: 'main.py', line: 2, col: 12 },
        };

        const engine = new RepairEngine();
        const snapshot1 = engine.runPipeline(finding, source);
        const snapshot2 = engine.runPipeline(finding, source);

        assert.strictEqual(JSON.stringify(snapshot1), JSON.stringify(snapshot2));
    });

    it('12. Testing Large Scale Performance Benchmarks...', () => {
        const t0 = performance.now();
        for (let i = 0; i < 1000; i++) {
            const p = new Patch({
                fileId: 'main.py',
                startLine: i + 1,
                startColumn: 1,
                endLine: i + 1,
                endColumn: 1,
                replacement: '    # patch\n',
            });
            p.applyToString('def foo():\n    pass');
        }
        const t1 = performance.now();
        assert.ok(t1 - t0 < 200, `1,000 patch applications took ${t1 - t0}ms`);
    });
});
