/**
 * test_stage20_mutation.mjs — Test Suite for Stage 20 Mutation Analysis, Test Adequacy & Robustness Engine
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { MUTATION_OPERATOR_KINDS } from '../src/mutation/MutationOperatorKind.js';
import { MutationOperator } from '../src/mutation/MutationOperator.js';
import { MUTATION_STATUS } from '../src/mutation/MutationStatus.js';
import { MutationCandidate } from '../src/mutation/MutationCandidate.js';
import { MutationSite } from '../src/mutation/MutationSite.js';
import { MutationSiteAnalyzer } from '../src/mutation/MutationSiteAnalyzer.js';
import { PythonMutationAdapter } from '../src/mutation/PythonMutationAdapter.js';
import { MutationFilter } from '../src/mutation/MutationFilter.js';
import { MutationGenerator } from '../src/mutation/MutationGenerator.js';
import { MutantWorkspace } from '../src/mutation/MutantWorkspace.js';
import { MutationOracle, ORACLE_KINDS } from '../src/mutation/MutationOracle.js';
import { MutationComparator } from '../src/mutation/MutationComparator.js';
import { DifferentialExecutor } from '../src/mutation/DifferentialExecutor.js';
import { MutationExecutor } from '../src/mutation/MutationExecutor.js';
import { EquivalenceAnalyzer, EQUIVALENCE_CERTAINTY } from '../src/mutation/EquivalenceAnalyzer.js';
import { MutationClassifier } from '../src/mutation/MutationClassifier.js';
import { MutationScore } from '../src/mutation/MutationScore.js';
import { MutationMatrix } from '../src/mutation/MutationMatrix.js';
import { DifferentialSymbolicAnalyzer } from '../src/mutation/DifferentialSymbolicAnalyzer.js';
import { MutationTestGenerator } from '../src/mutation/MutationTestGenerator.js';
import { MutationConcolicEngine } from '../src/mutation/MutationConcolicEngine.js';
import { RepairMutationValidator } from '../src/mutation/RepairMutationValidator.js';
import { MutationSession } from '../src/mutation/MutationSession.js';
import { MutationResult } from '../src/mutation/MutationResult.js';
import { MutationCampaign } from '../src/mutation/MutationCampaign.js';
import { MutationSnapshot } from '../src/mutation/MutationSnapshot.js';
import { MutationQueries } from '../src/mutation/MutationQueries.js';
import { MutationAnalyzer } from '../src/mutation/MutationAnalyzer.js';
import { TestCase } from '../src/testing/TestCase.js';
import { TestInput } from '../src/testing/TestInput.js';
import { PatchSet } from '../src/repair/PatchSet.js';
import { Patch } from '../src/repair/Patch.js';
import { Debugger } from '../src/debugger/Debugger.js';

describe('Stage 20: Universal Mutation Analysis & Test Adequacy Engine', () => {

    it('1. Testing Mutation Operators & Python Adapter (Arithmetic, Relational, Boolean, Constant)...', () => {
        const source = 'def compute(x, y):\n    if x > 0 and y == 1:\n        return x + y\n    return 0';
        const adapter = new PythonMutationAdapter();
        const sites = adapter.enumerateMutationSites(source);

        assert.ok(sites.length >= 4);

        const candidates = [];
        for (const s of sites) {
            candidates.push(...adapter.buildMutations(s, source));
        }

        assert.ok(candidates.length >= 4);

        const relMut = candidates.find(c => c.category === MUTATION_OPERATOR_KINDS.RELATIONAL);
        const arithMut = candidates.find(c => c.category === MUTATION_OPERATOR_KINDS.ARITHMETIC);
        const boolMut = candidates.find(c => c.category === MUTATION_OPERATOR_KINDS.BOOLEAN);
        const constMut = candidates.find(c => c.category === MUTATION_OPERATOR_KINDS.CONSTANT);

        assert.ok(relMut);
        assert.ok(arithMut);
        assert.ok(boolMut);
        assert.ok(constMut);
    });

    it('2. Testing Mutation Site Discovery & Filtering...', () => {
        const source = 'def check(a, b):\n    return a < b';
        const sites = MutationSiteAnalyzer.findSites(source);

        assert.strictEqual(sites.length, 2); // '<' and 'return'
        assert.strictEqual(sites[0].originalValue, '<');

        const candidates = MutationGenerator.generateMutations(source);
        assert.ok(candidates.length >= 1);
        assert.ok(candidates[0].mutantId.startsWith('mutant_'));
    });

    it('3. Testing MutantWorkspace & Patch Isolation...', () => {
        const source = 'def add(a, b):\n    return a + b';
        const patch = new Patch({
            fileId: 'main.py',
            startLine: 2,
            startColumn: 14,
            endLine: 2,
            endColumn: 15,
            replacement: '-',
            originalText: '+',
        });
        const cand = new MutationCandidate({
            fileId: 'main.py',
            sourceLocation: { line: 2, col: 14 },
            operatorId: 'OP_ARITH_+_TO_-',
            category: 'ARITHMETIC',
            originalExpression: '+',
            mutatedExpression: '-',
            patch: new PatchSet({ edits: [patch] }),
        });

        const mutantWs = MutantWorkspace.create(source, cand);
        const mutatedSource = mutantWs.getMutatedSource();

        assert.ok(mutatedSource.includes('return a - b'));
        assert.strictEqual(source.includes('return a + b'), true); // Original unchanged
    });

    it('4. Testing Mutation Comparator & Oracles...', () => {
        const origObs = { returnedValue: 15 };
        const mutObs = { returnedValue: 5 };

        const oracle = new MutationOracle({ kind: ORACLE_KINDS.RETURN_VALUE });
        const evalRes = oracle.evaluate(origObs, mutObs);

        assert.strictEqual(evalRes.detected, true);

        const comparison = MutationComparator.compare(origObs, mutObs, [oracle]);
        assert.strictEqual(comparison.killed, true);
        assert.strictEqual(comparison.oracleKind, 'RETURN_VALUE');
    });

    it('5. Testing Differential Execution & Mutation Killing...', () => {
        const source = 'def divide(x, y):\n    return x / y';
        const testCase = new TestCase({
            input: new TestInput({ bindings: { x: 10, y: 2 } }),
            targetKind: 'TEST',
        });

        const patch = new Patch({
            fileId: 'main.py',
            startLine: 2,
            startColumn: 14,
            endLine: 2,
            endColumn: 15,
            replacement: '*',
            originalText: '/',
        });
        const cand = new MutationCandidate({
            fileId: 'main.py',
            sourceLocation: { line: 2, col: 14 },
            operatorId: 'OP_ARITH_/_TO_*',
            category: 'ARITHMETIC',
            originalExpression: '/',
            mutatedExpression: '*',
            patch: new PatchSet({ edits: [patch] }),
        });

        const executor = new MutationExecutor();
        const execRes = executor.executeMutant(cand, source, [testCase]);

        assert.strictEqual(execRes.killed, true);
        assert.strictEqual(execRes.killingTests.length, 1);
    });

    it('6. Testing Equivalent Mutant Detection...', () => {
        const source = 'def add_zero(x):\n    return x + 0';
        const cand = new MutationCandidate({
            sourceLocation: { line: 2, col: 14 },
            operatorId: 'OP_ARITH_+_TO_-',
            category: 'ARITHMETIC',
            originalExpression: '+',
            mutatedExpression: '-',
            patch: new PatchSet(),
        });

        const eqRes = EquivalenceAnalyzer.analyzeEquivalence(cand, source);
        assert.strictEqual(eqRes.equivalent, true);
        assert.strictEqual(eqRes.certainty, EQUIVALENCE_CERTAINTY.PROVEN_EQUIVALENT);

        const classification = MutationClassifier.classify(cand, { killed: false }, source);
        assert.strictEqual(classification.status, MUTATION_STATUS.EQUIVALENT);
    });

    it('7. Testing Mutation Score & Mutation Matrix...', () => {
        const results = [
            new MutationResult({ mutant: {}, status: 'KILLED' }),
            new MutationResult({ mutant: {}, status: 'KILLED' }),
            new MutationResult({ mutant: {}, status: 'SURVIVED' }),
            new MutationResult({ mutant: {}, status: 'EQUIVALENT' }),
        ];

        const score = MutationScore.compute(results);
        assert.strictEqual(score.totalMutants, 4);
        assert.strictEqual(score.killed, 2);
        assert.strictEqual(score.survived, 1);
        assert.strictEqual(score.equivalent, 1);
        assert.strictEqual(score.rawMutationRatio, 0.5);
        assert.strictEqual(score.effectiveMutationRatio, 2 / 3);

        const matrix = new MutationMatrix();
        matrix.addEntry({ testCaseId: 't1', mutantId: 'm1', result: 'KILLED' });
        matrix.addEntry({ testCaseId: 't2', mutantId: 'm1', result: 'KILLED' });
        matrix.addEntry({ testCaseId: 't1', mutantId: 'm2', result: 'SURVIVED' });

        assert.deepStrictEqual(matrix.testsKillingMutant('m1'), ['t1', 't2']);
        assert.deepStrictEqual(matrix.mutantsKilledByTest('t1'), ['m1']);
    });

    it('8. Testing Mutation-Guided Test Generation & Concolic Killing...', () => {
        const source = 'def is_positive(x):\n    return x > 0';
        const cand = new MutationCandidate({
            fileId: 'main.py',
            sourceLocation: { line: 2, col: 14 },
            operatorId: 'OP_REL_>_TO_>=',
            category: 'RELATIONAL',
            originalExpression: '>',
            mutatedExpression: '>=',
            patch: new PatchSet({
                edits: [
                    new Patch({
                        fileId: 'main.py',
                        startLine: 2,
                        startColumn: 14,
                        endLine: 2,
                        endColumn: 15,
                        replacement: '>=',
                        originalText: '>',
                    }),
                ],
            }),
        });

        const engine = new MutationConcolicEngine();
        const concolicRes = engine.targetMutant(cand, source);

        assert.ok(concolicRes.generatedTest);
        assert.strictEqual(concolicRes.generatedTest.targetKind, 'MUTATION_KILL');
    });

    it('9. Testing Repair Robustness Validation (Stage 19 Integration)...', () => {
        const source = 'def divide(x):\n    return 10 / x';
        const repairPatch = new PatchSet({
            edits: [
                new Patch({
                    fileId: 'main.py',
                    startLine: 2,
                    startColumn: 1,
                    endLine: 2,
                    endColumn: 1,
                    replacement: '    if x == 0:\n        return 0\n',
                    originalText: '',
                }),
            ],
        });

        const repairCandidate = { patch: repairPatch };
        const robustness = RepairMutationValidator.validateRepairRobustness(repairCandidate, source);

        assert.strictEqual(robustness.valid, true);
        assert.ok(robustness.mutantsEvaluated >= 1);
    });

    it('10. Testing Mutation Campaign & Analyzer End-to-End...', () => {
        const source = 'def multiply(a, b):\n    return a * b';
        const testSuite = [
            new TestCase({
                input: new TestInput({ bindings: { a: 4, b: 5 } }),
                targetKind: 'TEST',
            }),
        ];

        const queries = MutationAnalyzer.analyze(source, { testSuite });
        assert.ok(queries);

        const mutants = queries.getMutants();
        assert.ok(mutants.length >= 1);

        const score = queries.getMutationScore();
        assert.ok(score.totalMutants >= 1);
        assert.ok(score.rawMutationRatio > 0);

        const campaign = queries.getMutationCampaign();
        assert.ok(campaign);
    });

    it('11. Testing Debugger Integration (Stage 20 APIs)...', () => {
        const dbg = new Debugger();
        const trace = {
            events: [
                {
                    event_type: 'step',
                    line: 2,
                    frame_index: 0,
                    source_code: 'def add(a, b):\n    return a + b',
                },
            ],
        };
        dbg.loadExecution(trace);

        const campaign = dbg.startMutationCampaign();
        assert.ok(campaign);

        const status = dbg.getMutationStatus();
        assert.strictEqual(status, 'COMPLETED');

        const mutants = dbg.getMutants();
        assert.ok(mutants.length >= 1);

        const score = dbg.getMutationScore();
        assert.ok(score);

        const artifact = dbg.getMutationArtifact();
        assert.strictEqual(artifact.artifactType, 'MUTATION_CAMPAIGN');
    });

    it('12. Testing Determinism, Immutability & Performance Benchmarks...', () => {
        const source = 'def logic(x, y):\n    return (x > 0) and (y < 10)';
        const snapshot1 = MutationAnalyzer.analyze(source)._snapshot;
        const snapshot2 = MutationAnalyzer.analyze(source)._snapshot;

        assert.strictEqual(JSON.stringify(snapshot1), JSON.stringify(snapshot2));

        // Benchmark
        const t0 = performance.now();
        for (let i = 0; i < 1000; i++) {
            MutationGenerator.generateMutations('def foo(a, b):\n    return a + b');
        }
        const t1 = performance.now();
        assert.ok(t1 - t0 < 300, `1,000 mutation generations took ${t1 - t0}ms`);
    });
});
