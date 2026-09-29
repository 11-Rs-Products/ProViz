/**
 * test_stage22_specification.mjs — Comprehensive test suite for Stage 22
 * Universal Semantic Test Synthesis, Behavioral Oracle & Specification Mining Engine
 */

import assert from 'assert';
import { SpecificationKind } from '../src/specification/SpecificationKind.js';
import { SpecificationStatus } from '../src/specification/SpecificationStatus.js';
import { SpecificationConfidence } from '../src/specification/SpecificationConfidence.js';
import { SpecificationSource } from '../src/specification/SpecificationSource.js';
import { Specification } from '../src/specification/Specification.js';
import { SpecificationSet } from '../src/specification/SpecificationSet.js';
import { Precondition } from '../src/specification/Precondition.js';
import { Postcondition } from '../src/specification/Postcondition.js';
import { Invariant } from '../src/specification/Invariant.js';
import { BehavioralProperty } from '../src/specification/BehavioralProperty.js';
import { StateTransition } from '../src/specification/StateTransition.js';
import { TemporalProperty } from '../src/specification/TemporalProperty.js';
import { ExceptionProperty } from '../src/specification/ExceptionProperty.js';
import { ReturnProperty } from '../src/specification/ReturnProperty.js';
import { MutationProperty } from '../src/specification/MutationProperty.js';
import { CollectionProperty } from '../src/specification/CollectionProperty.js';
import { RelationalProperty } from '../src/specification/RelationalProperty.js';
import { Observation } from '../src/specification/Observation.js';
import { ObservationSet } from '../src/specification/ObservationSet.js';
import { BehaviorSignature } from '../src/specification/BehaviorSignature.js';
import { StateModel } from '../src/specification/StateModel.js';
import { TransitionModel } from '../src/specification/TransitionModel.js';
import { ValueModel } from '../src/specification/ValueModel.js';
import { BehaviorModel } from '../src/specification/BehaviorModel.js';
import { InvariantMiner } from '../src/specification/InvariantMiner.js';
import { ContractMiner } from '../src/specification/ContractMiner.js';
import { ExceptionMiner } from '../src/specification/ExceptionMiner.js';
import { RelationMiner } from '../src/specification/RelationMiner.js';
import { TemporalMiner } from '../src/specification/TemporalMiner.js';
import { BehaviorMiner } from '../src/specification/BehaviorMiner.js';
import { SpecificationMiner } from '../src/specification/SpecificationMiner.js';
import { OracleKind } from '../src/specification/OracleKind.js';
import { OracleConfidence } from '../src/specification/OracleConfidence.js';
import { OracleExpression } from '../src/specification/OracleExpression.js';
import { Oracle } from '../src/specification/Oracle.js';
import { OracleBuilder } from '../src/specification/OracleBuilder.js';
import { OracleEvaluator } from '../src/specification/OracleEvaluator.js';
import { OracleComparator } from '../src/specification/OracleComparator.js';
import { OracleRefiner } from '../src/specification/OracleRefiner.js';
import { TestObjectiveKind } from '../src/specification/TestObjectiveKind.js';
import { BoundaryObjectiveGenerator } from '../src/specification/BoundaryObjectiveGenerator.js';
import { PathObjectiveGenerator } from '../src/specification/PathObjectiveGenerator.js';
import { PropertyObjectiveGenerator } from '../src/specification/PropertyObjectiveGenerator.js';
import { TransitionObjectiveGenerator } from '../src/specification/TransitionObjectiveGenerator.js';
import { MutationObjectiveGenerator } from '../src/specification/MutationObjectiveGenerator.js';
import { RegressionObjectiveGenerator } from '../src/specification/RegressionObjectiveGenerator.js';
import { TestObjectiveGenerator } from '../src/specification/TestObjectiveGenerator.js';
import { SemanticTestCase } from '../src/specification/SemanticTestCase.js';
import { SemanticTestSuite } from '../src/specification/SemanticTestSuite.js';
import { TestSynthesisPlan } from '../src/specification/TestSynthesisPlan.js';
import { TestDeduplicator } from '../src/specification/TestDeduplicator.js';
import { TestMinimizer } from '../src/specification/TestMinimizer.js';
import { TestSynthesizer } from '../src/specification/TestSynthesizer.js';
import { AdequacyCriterion } from '../src/specification/AdequacyCriterion.js';
import { SpecificationCoverage } from '../src/specification/SpecificationCoverage.js';
import { OracleCoverage } from '../src/specification/OracleCoverage.js';
import { BehavioralCoverage } from '../src/specification/BehavioralCoverage.js';
import { AdequacyResult } from '../src/specification/AdequacyResult.js';
import { AdequacyAnalyzer } from '../src/specification/AdequacyAnalyzer.js';
import { Gap } from '../src/specification/Gap.js';
import { GapAnalyzer } from '../src/specification/GapAnalyzer.js';
import { SpecificationRefiner } from '../src/specification/SpecificationRefiner.js';
import { CounterexampleRefiner } from '../src/specification/CounterexampleRefiner.js';
import { SpecificationSnapshot } from '../src/specification/SpecificationSnapshot.js';
import { SpecificationQueries } from '../src/specification/SpecificationQueries.js';
import { SpecificationAnalyzer } from '../src/specification/SpecificationAnalyzer.js';
import { SpecificationEngine } from '../src/specification/SpecificationEngine.js';
import { PythonSpecificationAdapter } from '../src/specification/PythonSpecificationAdapter.js';
import { Debugger } from '../src/debugger/Debugger.js';

let passed = 0;
let total = 0;

function it(desc, fn) {
    total++;
    try {
        fn();
        passed++;
        console.log(`  ✓ ${desc}`);
    } catch (err) {
        console.error(`  ✗ ${desc}:`, err.message);
        throw err;
    }
}

console.log('=== ProViz Stage 22: Universal Semantic Test Synthesis & Specification Mining Test Suite ===\n');

// ─────────────────────────────────────────────────────────────────────────────
// 1. Universal Specification Models & Taxonomy
// ─────────────────────────────────────────────────────────────────────────────
console.log('1. Testing Universal Specification Models & Taxonomy...');

it('Specification generates deterministic ID based on semantic payload', () => {
    const s1 = new Specification({
        kind: SpecificationKind.INVARIANT,
        subject: { name: 'x', functionId: 'calc' },
        preconditions: ['x >= 0'],
        source: SpecificationSource.STATIC_ANALYSIS,
    });
    const s2 = new Specification({
        kind: SpecificationKind.INVARIANT,
        subject: { name: 'x', functionId: 'calc' },
        preconditions: ['x >= 0'],
        source: SpecificationSource.STATIC_ANALYSIS,
    });
    assert.strictEqual(s1.id, s2.id);
    assert.ok(s1.id.startsWith('spec_'));
});

it('Precondition holds expression and variable constraints', () => {
    const pre = new Precondition({
        subject: { functionId: 'divide' },
        expression: 'b != 0',
        variables: ['b'],
    });
    assert.strictEqual(pre.kind, SpecificationKind.PRECONDITION);
    assert.strictEqual(pre.expression, 'b != 0');
    assert.deepStrictEqual(pre.variables, ['b']);
});

it('Postcondition holds expected return and relations', () => {
    const post = new Postcondition({
        subject: { functionId: 'divide' },
        expression: 'result == a / b',
        expectedReturn: 'number',
        relation: '==',
    });
    assert.strictEqual(post.kind, SpecificationKind.POSTCONDITION);
    assert.strictEqual(post.relation, '==');
});

it('Invariant models range and state persistence', () => {
    const inv = new Invariant({
        subject: { name: 'balance' },
        expression: 'balance >= 0',
        scope: 'ACCOUNT',
    });
    assert.strictEqual(inv.kind, SpecificationKind.INVARIANT);
    assert.strictEqual(inv.scope, 'ACCOUNT');
});

it('ExceptionProperty models conditional exception constraints', () => {
    const exProp = new ExceptionProperty({
        subject: { functionId: 'divide' },
        exceptionType: 'ZeroDivisionError',
        condition: 'b == 0',
        shouldRaise: true,
    });
    assert.strictEqual(exProp.kind, SpecificationKind.EXCEPTION_PROPERTY);
    assert.strictEqual(exProp.shouldRaise, true);
    assert.strictEqual(exProp.exceptionType, 'ZeroDivisionError');
});

it('ReturnProperty models return value behavior', () => {
    const retProp = new ReturnProperty({
        subject: { functionId: 'divide' },
        condition: 'b == 0',
        returnExpression: '0',
        expectedValue: 0,
    });
    assert.strictEqual(retProp.kind, SpecificationKind.RETURN_PROPERTY);
    assert.strictEqual(retProp.expectedValue, 0);
});

it('RelationalProperty models algebraic relationships', () => {
    const relProp = new RelationalProperty({
        subject: { functionId: 'divide' },
        leftExpression: 'result',
        operator: '==',
        rightExpression: 'a / b',
        condition: 'b != 0',
    });
    assert.strictEqual(relProp.kind, SpecificationKind.RELATIONAL_PROPERTY);
    assert.strictEqual(relProp.operator, '==');
});

it('CollectionProperty models size and element constraints', () => {
    const colProp = new CollectionProperty({
        subject: { name: 'items' },
        targetCollection: 'items',
        propertyType: 'SIZE_NON_NEGATIVE',
    });
    assert.strictEqual(colProp.kind, SpecificationKind.COLLECTION_PROPERTY);
});

it('MutationProperty models side effects and mutations', () => {
    const mutProp = new MutationProperty({
        subject: { name: 'obj_list' },
        targetObject: 'obj_list',
        mutationType: 'APPEND',
    });
    assert.strictEqual(mutProp.kind, SpecificationKind.MUTATION_PROPERTY);
});

it('TemporalProperty models ordering patterns', () => {
    const tempProp = new TemporalProperty({
        subject: { functionId: 'workflow' },
        pattern: 'BEFORE',
        eventA: 'authenticate',
        eventB: 'authorize',
    });
    assert.strictEqual(tempProp.kind, SpecificationKind.TEMPORAL_PROPERTY);
    assert.strictEqual(tempProp.pattern, 'BEFORE');
});

it('StateTransition models state changes under guard conditions', () => {
    const st = new StateTransition({
        subject: { name: 'FSM' },
        fromState: 'IDLE',
        condition: 'start_clicked',
        transition: 'RUNNING',
        toState: 'RUNNING',
    });
    assert.strictEqual(st.kind, SpecificationKind.STATE_TRANSITION);
    assert.strictEqual(st.fromState, 'IDLE');
    assert.strictEqual(st.toState, 'RUNNING');
});

it('SpecificationSet indexes specifications by kind, status, and subject', () => {
    const s1 = new ReturnProperty({ subject: { functionId: 'foo' }, expectedValue: 1 });
    const s2 = new ExceptionProperty({ subject: { functionId: 'foo' }, exceptionType: 'Error' });
    const set = new SpecificationSet([s1, s2]);

    assert.strictEqual(set.size, 2);
    assert.strictEqual(set.getByKind(SpecificationKind.RETURN_PROPERTY).length, 1);
    assert.strictEqual(set.getByKind(SpecificationKind.EXCEPTION_PROPERTY).length, 1);
    assert.strictEqual(set.getBySubject('foo').length, 2);
    assert.ok(set.get(s1.id));
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Behavioral Observations & Behavior Models
// ─────────────────────────────────────────────────────────────────────────────
console.log('2. Testing Behavioral Observations & Models...');

it('Observation captures execution state, returns, and generates deterministic ID', () => {
    const obs1 = new Observation({
        functionId: 'divide',
        inputs: { a: 10, b: 2 },
        returnValue: 5,
        preState: { a: 10, b: 2 },
        postState: { a: 10, b: 2, res: 5 },
    });
    const obs2 = new Observation({
        functionId: 'divide',
        inputs: { a: 10, b: 2 },
        returnValue: 5,
        preState: { a: 10, b: 2 },
        postState: { a: 10, b: 2, res: 5 },
    });
    assert.strictEqual(obs1.id, obs2.id);
    assert.ok(obs1.id.startsWith('obs_'));
    assert.strictEqual(obs1.returnValue, 5);
});

it('ObservationSet separates normal executions from exceptions', () => {
    const obsNorm = new Observation({ functionId: 'divide', inputs: { a: 10, b: 2 }, returnValue: 5 });
    const obsExc = new Observation({
        functionId: 'divide',
        inputs: { a: 10, b: 0 },
        exception: { type: 'ZeroDivisionError', message: 'division by zero' },
    });
    const set = new ObservationSet([obsNorm, obsExc]);

    assert.strictEqual(set.size, 2);
    assert.strictEqual(set.normalRuns.length, 1);
    assert.strictEqual(set.exceptionRuns.length, 1);
    assert.strictEqual(set.getByFunction('divide').length, 2);
});

it('BehaviorSignature captures canonical execution outcomes', () => {
    const obs = new Observation({
        functionId: 'calc',
        inputs: { x: 5 },
        returnValue: 10,
    });
    const sig1 = BehaviorSignature.fromObservation(obs);
    const sig2 = BehaviorSignature.fromObservation(obs);

    assert.ok(sig1.equals(sig2));
    assert.strictEqual(sig1.outcome, 'RETURN');
    assert.strictEqual(sig1.valueType, 'number');
});

it('ValueModel tracks ranges, min, max, types, and nullability', () => {
    let vm = new ValueModel({ name: 'x' });
    vm = vm.observe(10);
    vm = vm.observe(20);
    vm = vm.observe(5);
    vm = vm.observe(null);

    assert.strictEqual(vm.min, 5);
    assert.strictEqual(vm.max, 20);
    assert.strictEqual(vm.hasNull, true);
    assert.ok(vm.types.includes('number'));
    assert.ok(vm.types.includes('None'));
});

it('BehaviorModel aggregates observations and value models incrementally', () => {
    let bm = new BehaviorModel({ functionId: 'compute' });
    bm = bm.addObservation(new Observation({ functionId: 'compute', inputs: { a: 4 }, returnValue: 16 }));
    bm = bm.addObservation(new Observation({ functionId: 'compute', inputs: { a: 5 }, returnValue: 25 }));

    assert.strictEqual(bm.observations.size, 2);
    assert.strictEqual(bm.valueModels['a'].min, 4);
    assert.strictEqual(bm.valueModels['a'].max, 5);
    assert.strictEqual(bm.valueModels['$return'].min, 16);
    assert.strictEqual(bm.valueModels['$return'].max, 25);
    assert.strictEqual(bm.signatures.length, 2);
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Specification Miners
// ─────────────────────────────────────────────────────────────────────────────
console.log('3. Testing Specification Miners...');

it('InvariantMiner infers non-negative bounds and non-null properties', () => {
    const miner = new InvariantMiner();
    const obs = [
        new Observation({ functionId: 'f', inputs: { count: 1 } }),
        new Observation({ functionId: 'f', inputs: { count: 5 } }),
        new Observation({ functionId: 'f', inputs: { count: 10 } }),
    ];
    const invariants = miner.mine('f', obs);

    assert.ok(invariants.some(i => i.expression.includes('count >= 0')));
    assert.ok(invariants.some(i => i.expression.includes('count is not None')));
});

it('ContractMiner infers postcondition type consistency and zero returns', () => {
    const miner = new ContractMiner();
    const obs = [
        new Observation({ functionId: 'divide', inputs: { a: 10, b: 0 }, returnValue: 0 }),
        new Observation({ functionId: 'divide', inputs: { a: 10, b: 2 }, returnValue: 5 }),
    ];
    const contracts = miner.mine('divide', obs);

    assert.ok(contracts.some(c => c.expression?.includes('typeof(result) == \'number\'')));
    assert.ok(contracts.some(c => c.kind === SpecificationKind.RETURN_PROPERTY && c.expectedValue === 0));
});

it('ExceptionMiner mines conditional exception specifications', () => {
    const miner = new ExceptionMiner();
    const obs = [
        new Observation({ functionId: 'divide', inputs: { a: 10, b: 2 }, returnValue: 5 }),
        new Observation({
            functionId: 'divide',
            inputs: { a: 10, b: 0 },
            exception: { type: 'ZeroDivisionError', message: 'division by zero' },
        }),
    ];
    const exSpecs = miner.mine('divide', obs);

    assert.strictEqual(exSpecs.length, 1);
    assert.strictEqual(exSpecs[0].exceptionType, 'ZeroDivisionError');
    assert.strictEqual(exSpecs[0].condition, 'b == 0');
});

it('RelationMiner mines result == a / b relational properties', () => {
    const miner = new RelationMiner();
    const obs = [
        new Observation({ functionId: 'divide', inputs: { a: 10, b: 2 }, returnValue: 5 }),
        new Observation({ functionId: 'divide', inputs: { a: 12, b: 3 }, returnValue: 4 }),
        new Observation({ functionId: 'divide', inputs: { a: 8, b: 4 }, returnValue: 2 }),
    ];
    const rels = miner.mine('divide', obs);

    assert.strictEqual(rels.length, 1);
    assert.strictEqual(rels[0].rightExpression, 'a / b');
    assert.strictEqual(rels[0].operator, '==');
});

it('TemporalMiner mines call sequence ordering', () => {
    const miner = new TemporalMiner();
    const obs = [
        new Observation({ functionId: 'process', callStack: ['main', 'process'] }),
    ];
    const temps = miner.mine('process', obs);

    assert.strictEqual(temps.length, 1);
    assert.strictEqual(temps[0].eventA, 'main');
    assert.strictEqual(temps[0].eventB, 'process');
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Master SpecificationMiner & Conflict Detection
// ─────────────────────────────────────────────────────────────────────────────
console.log('4. Testing Master SpecificationMiner & Conflict Detection...');

it('SpecificationMiner coordinates all sub-miners and outputs SpecificationSet', () => {
    const miner = new SpecificationMiner();
    const obs = [
        new Observation({ functionId: 'divide', inputs: { a: 10, b: 2 }, returnValue: 5 }),
        new Observation({ functionId: 'divide', inputs: { a: 8, b: 4 }, returnValue: 2 }),
        new Observation({ functionId: 'divide', inputs: { a: 5, b: 0 }, returnValue: 0 }),
    ];
    const res = miner.mine('divide', obs);

    assert.ok(res.specifications.size >= 3);
    assert.strictEqual(res.conflicts.length, 0);
    assert.strictEqual(res.behaviorModel.functionId, 'divide');
});

it('SpecificationMiner flags CONFLICTING_OBSERVATIONS when outputs mismatch on identical inputs', () => {
    const miner = new SpecificationMiner();
    const obs = [
        new Observation({ functionId: 'f', inputs: { x: 1 }, returnValue: 2 }),
        new Observation({ functionId: 'f', inputs: { x: 1 }, returnValue: 3 }),
    ];
    const res = miner.mine('f', obs);

    assert.strictEqual(res.conflicts.length, 1);
    assert.deepStrictEqual(res.conflicts[0].outputs, [2, 3]);

    const conflictSpec = res.specifications.specs.find(s => s.status === SpecificationStatus.INCONCLUSIVE);
    assert.ok(conflictSpec);
    assert.ok(conflictSpec.evidence[0].includes('CONFLICTING_OBSERVATIONS'));
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Behavioral Oracles
// ─────────────────────────────────────────────────────────────────────────────
console.log('5. Testing Behavioral Oracles...');

it('Oracle generates deterministic ID and serializes to JSON', () => {
    const o1 = new Oracle({
        kind: OracleKind.RETURN_VALUE,
        expected: 42,
    });
    const o2 = new Oracle({
        kind: OracleKind.RETURN_VALUE,
        expected: 42,
    });
    assert.strictEqual(o1.id, o2.id);
    assert.ok(o1.id.startsWith('oracle_'));

    const json = o1.toJSON();
    const restored = Oracle.fromJSON(json);
    assert.strictEqual(restored.id, o1.id);
    assert.strictEqual(restored.expected, 42);
});

it('OracleBuilder constructs exact return and exception oracles from specs', () => {
    const retSpec = new ReturnProperty({ expectedValue: 0, condition: 'b == 0' });
    const retOracle = OracleBuilder.fromSpecification(retSpec);
    assert.strictEqual(retOracle.kind, OracleKind.RETURN_VALUE);
    assert.strictEqual(retOracle.expected, 0);

    const exSpec = new ExceptionProperty({ exceptionType: 'ZeroDivisionError', shouldRaise: true });
    const exOracle = OracleBuilder.fromSpecification(exSpec);
    assert.strictEqual(exOracle.kind, OracleKind.EXCEPTION_TYPE);
    assert.strictEqual(exOracle.expectedException, 'ZeroDivisionError');
});

it('OracleEvaluator evaluates exact returns (PASS and FAIL)', () => {
    const oracle = new Oracle({ kind: OracleKind.RETURN_VALUE, expected: 5 });

    const passRes = OracleEvaluator.evaluate(oracle, { returnValue: 5 });
    assert.strictEqual(passRes.status, 'PASS');

    const failRes = OracleEvaluator.evaluate(oracle, { returnValue: 10 });
    assert.strictEqual(failRes.status, 'FAIL');
});

it('OracleEvaluator evaluates exception oracles correctly', () => {
    const oracle = new Oracle({ kind: OracleKind.EXCEPTION_TYPE, expectedException: 'ZeroDivisionError' });

    const passRes = OracleEvaluator.evaluate(oracle, { exception: { type: 'ZeroDivisionError' } });
    assert.strictEqual(passRes.status, 'PASS');

    const failRes = OracleEvaluator.evaluate(oracle, { returnValue: 0 });
    assert.strictEqual(failRes.status, 'FAIL');
});

it('OracleEvaluator evaluates relational oracles (result == a / b)', () => {
    const oracle = new Oracle({
        kind: OracleKind.RETURN_RELATION,
        expression: new OracleExpression({ expression: 'result == a / b', operator: '==' }),
    });

    const passRes = OracleEvaluator.evaluate(oracle, { inputs: { a: 10, b: 2 }, returnValue: 5 });
    assert.strictEqual(passRes.status, 'PASS');

    const failRes = OracleEvaluator.evaluate(oracle, { inputs: { a: 10, b: 2 }, returnValue: 99 });
    assert.strictEqual(failRes.status, 'FAIL');
});

it('OracleComparator distinguishes differential behaviors across baseline and changed code', () => {
    const oracle = new Oracle({ kind: OracleKind.RETURN_VALUE, expected: 0 });
    const baselineObs = { returnValue: 0 };
    const changedObs = { exception: { type: 'ZeroDivisionError' } };

    const comp = OracleComparator.compareDifferential(oracle, baselineObs, changedObs);
    assert.strictEqual(comp.isDistinguished, true);
    assert.strictEqual(comp.baselineResult.status, 'PASS');
    assert.strictEqual(comp.changedResult.status, 'FAIL');
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. Test Objectives & Objective Generators
// ─────────────────────────────────────────────────────────────────────────────
console.log('6. Testing Test Objectives & Objective Generators...');

it('BoundaryObjectiveGenerator generates boundary objectives (0, 1, -1, None)', () => {
    const gen = new BoundaryObjectiveGenerator();
    const objs = gen.generate('divide', ['b']);

    assert.ok(objs.some(o => o.boundaryValue === 0));
    assert.ok(objs.some(o => o.boundaryValue === 1));
    assert.ok(objs.some(o => o.boundaryValue === -1));
    assert.ok(objs.some(o => o.boundaryValue === null));
});

it('PathObjectiveGenerator generates objectives for uncovered branches and paths', () => {
    const gen = new PathObjectiveGenerator();
    const objs = gen.generate('divide', [{ id: 'br_zero', condition: 'b == 0' }], [{ id: 'path_1' }]);

    assert.strictEqual(objs.length, 2);
    assert.strictEqual(objs[0].kind, TestObjectiveKind.COVER_BRANCH);
    assert.strictEqual(objs[1].kind, TestObjectiveKind.COVER_PATH);
});

it('PropertyObjectiveGenerator generates confirm and challenge objectives', () => {
    const gen = new PropertyObjectiveGenerator();
    const spec = new Invariant({ expression: 'x >= 0' });
    const objs = gen.generate([spec]);

    assert.strictEqual(objs.length, 2);
    assert.strictEqual(objs[0].kind, TestObjectiveKind.CONFIRM_PROPERTY);
    assert.strictEqual(objs[1].kind, TestObjectiveKind.VIOLATE_PROPERTY);
});

it('MutationObjectiveGenerator generates objectives targeting surviving mutants', () => {
    const gen = new MutationObjectiveGenerator();
    const objs = gen.generate([{ id: 'mut_rel_1', operator: 'RELATIONAL_REPLACEMENT' }]);

    assert.strictEqual(objs.length, 1);
    assert.strictEqual(objs[0].kind, TestObjectiveKind.EXERCISE_MUTATION);
    assert.strictEqual(objs[0].mutantId, 'mut_rel_1');
});

it('RegressionObjectiveGenerator generates objectives for changed semantic entities', () => {
    const gen = new RegressionObjectiveGenerator();
    const objs = gen.generate([{ id: 'chg_1', kind: 'BRANCH_CHANGED', fileId: 'main.py' }]);

    assert.strictEqual(objs.length, 1);
    assert.strictEqual(objs[0].kind, TestObjectiveKind.VALIDATE_REGRESSION);
    assert.strictEqual(objs[0].changeId, 'chg_1');
});

it('TestObjectiveGenerator.fromGap converts a Gap into a prioritized TestObjective', () => {
    const gap = new Gap({
        kind: 'UNCOVERED_BRANCH',
        functionId: 'divide',
        reason: 'Branch b == 0 is uncovered',
    });
    const obj = TestObjectiveGenerator.fromGap(gap);

    assert.strictEqual(obj.kind, TestObjectiveKind.COVER_BRANCH);
    assert.strictEqual(obj.gapId, gap.id);
    assert.strictEqual(obj.targetFunction, 'divide');
});

it('TestObjectiveGenerator coordinates all generators and prioritizes results', () => {
    const gen = new TestObjectiveGenerator();
    const objs = gen.generateAll({
        functionId: 'divide',
        parameters: ['a', 'b'],
        specifications: [new Invariant({ expression: 'x >= 0' })],
    });

    assert.ok(objs.length >= 10);
    assert.ok(objs[0].priority >= objs[objs.length - 1].priority);
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. Semantic Test Synthesis & Test Artifacts
// ─────────────────────────────────────────────────────────────────────────────
console.log('7. Testing Semantic Test Synthesis & Test Artifacts...');

it('SemanticTestCase creates deterministic test artifact with oracle', () => {
    const oracle = new Oracle({ kind: OracleKind.RETURN_VALUE, expected: 5 });
    const test1 = new SemanticTestCase({
        targetFunction: 'divide',
        inputs: { a: 10, b: 2 },
        oracle,
    });
    const test2 = new SemanticTestCase({
        targetFunction: 'divide',
        inputs: { a: 10, b: 2 },
        oracle,
    });

    assert.strictEqual(test1.id, test2.id);
    assert.ok(test1.id.startsWith('semantic_test_'));
    assert.strictEqual(test1.targetFunction, 'divide');
    assert.deepStrictEqual(test1.inputs, { a: 10, b: 2 });
});

it('TestDeduplicator removes semantically identical test cases', () => {
    const test1 = new SemanticTestCase({ targetFunction: 'foo', inputs: { a: 1 } });
    const test2 = new SemanticTestCase({ targetFunction: 'foo', inputs: { a: 1 } });
    const test3 = new SemanticTestCase({ targetFunction: 'foo', inputs: { a: 2 } });

    const deduped = TestDeduplicator.deduplicate([test1, test2, test3]);
    assert.strictEqual(deduped.length, 2);
});

it('TestSynthesizer generates test suite from objectives', () => {
    const synth = new TestSynthesizer();
    const objGen = new BoundaryObjectiveGenerator();
    const objs = objGen.generate('divide', ['b']);

    const suite = synth.synthesizeAll(objs, { functionId: 'divide', parameters: ['a', 'b'] });
    assert.ok(suite.size >= 3);
    assert.ok(suite.tests.some(t => t.inputs.b === 0));
    assert.ok(suite.tests.some(t => t.inputs.b === 1));
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. Adequacy, Coverage & Gap Analysis
// ─────────────────────────────────────────────────────────────────────────────
console.log('8. Testing Adequacy, Coverage & Gap Analysis...');

it('SpecificationCoverage measures exercised, validated, and untested specs', () => {
    const cov = new SpecificationCoverage({
        total: 10,
        exercised: 8,
        validated: 7,
        violated: 1,
        untested: 2,
    });
    assert.strictEqual(cov.coverageRatio, 0.8);
    assert.strictEqual(cov.validated, 7);
});

it('OracleCoverage measures passed and failed oracles', () => {
    const cov = new OracleCoverage({
        total: 10,
        passed: 9,
        failed: 1,
    });
    assert.strictEqual(cov.passRatio, 0.9);
});

it('BehavioralCoverage measures covered execution regions', () => {
    const cov = new BehavioralCoverage({
        totalRegions: 3,
        coveredRegions: 2,
        regions: ['NORMAL', 'BOUNDARY'],
    });
    assert.strictEqual(Math.round(cov.coverageRatio * 100) / 100, 0.67);
});

it('AdequacyAnalyzer calculates composite score across all coverage dimensions', () => {
    const analyzer = new AdequacyAnalyzer();
    const specs = [
        new Specification({ status: SpecificationStatus.VALIDATED }),
        new Specification({ status: SpecificationStatus.MINED }),
    ];
    const oracles = [new Oracle({ kind: OracleKind.RETURN_VALUE, expected: 5 })];
    const observations = [{ returnValue: 5 }];

    const res = analyzer.analyze(specs, oracles, observations);
    assert.ok(res.overallScore > 0);
    assert.strictEqual(res.oracleCoverage.passed, 1);
});

it('GapAnalyzer identifies untested specifications, surviving mutants, and regression gaps', () => {
    const analyzer = new GapAnalyzer();
    const gaps = analyzer.findGaps({
        specifications: [new Specification({ status: SpecificationStatus.UNTESTED })],
        uncoveredBranches: [{ id: 'br_1', condition: 'b == 0' }],
        survivingMutants: [{ id: 'mut_1', operator: 'RELATIONAL' }],
        changes: [{ id: 'chg_1', kind: 'BRANCH_CHANGED' }],
    });

    assert.strictEqual(gaps.length, 4);
    assert.ok(gaps.some(g => g.kind === 'UNVALIDATED_PROPERTY'));
    assert.ok(gaps.some(g => g.kind === 'UNCOVERED_BRANCH'));
    assert.ok(gaps.some(g => g.kind === 'MUTATION_SURVIVOR'));
    assert.ok(gaps.some(g => g.kind === 'REGRESSION_GAP'));
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. Specification & Oracle Refinement
// ─────────────────────────────────────────────────────────────────────────────
console.log('9. Testing Specification & Oracle Refinement...');

it('SpecificationRefiner validates spec when observation matches expected return', () => {
    const spec = new ReturnProperty({ expectedValue: 0 });
    const refined = SpecificationRefiner.refineWithObservation(spec, { returnValue: 0 });

    assert.strictEqual(refined.status, SpecificationStatus.VALIDATED);
});

it('SpecificationRefiner violates spec when observation produces differing return', () => {
    const spec = new ReturnProperty({ expectedValue: 0 });
    const refined = SpecificationRefiner.refineWithObservation(spec, { returnValue: 99 });

    assert.strictEqual(refined.status, SpecificationStatus.VIOLATED);
});

it('SpecificationRefiner invalidates spec when counterexample is supplied', () => {
    const spec = new Invariant({ expression: 'x >= 0' });
    const invalidated = SpecificationRefiner.invalidate(spec, { inputs: { x: -5 } });

    assert.strictEqual(invalidated.status, SpecificationStatus.INVALIDATED);
    assert.strictEqual(invalidated.confidence, SpecificationConfidence.PROVEN);
});

it('CounterexampleRefiner invalidates spec and generates targeted test objective', () => {
    const spec = new Invariant({ expression: 'b != 0', subject: { functionId: 'divide' } });
    const res = CounterexampleRefiner.processCounterexample(spec, { inputs: { b: 0 } });

    assert.strictEqual(res.refinedSpec.status, SpecificationStatus.INVALIDATED);
    assert.strictEqual(res.newObjective.kind, TestObjectiveKind.DISTINGUISH_BEHAVIOR);
    assert.deepStrictEqual(res.newObjective.suggestedInputs, { b: 0 });
});

// ─────────────────────────────────────────────────────────────────────────────
// 10. End-to-End Scenario 1: Divide Specification Mining & Boundary Synthesis
// ─────────────────────────────────────────────────────────────────────────────
console.log('10. Testing End-to-End Scenario 1 (Divide Function Mining & Boundary Synthesis)...');

it('Mines divide behavioral specifications from execution trace and generates boundary tests', () => {
    const analyzer = new SpecificationAnalyzer();
    const obs = [
        new Observation({ functionId: 'divide', inputs: { a: 10, b: 2 }, returnValue: 5 }),
        new Observation({ functionId: 'divide', inputs: { a: 8, b: 4 }, returnValue: 2 }),
        new Observation({ functionId: 'divide', inputs: { a: 5, b: 0 }, returnValue: 0 }),
    ];

    const snapshot = analyzer.analyze({
        functionId: 'divide',
        parameters: ['a', 'b'],
        observations: obs,
    });

    assert.ok(snapshot.specifications.size >= 2);
    // Verified return == a / b relational property
    assert.ok(snapshot.specifications.specs.some(s => s.kind === SpecificationKind.RELATIONAL_PROPERTY));
    // Verified return 0 when b == 0
    assert.ok(snapshot.specifications.specs.some(s => s.kind === SpecificationKind.RETURN_PROPERTY && s.expectedValue === 0));

    // Synthesized boundary tests for b = 0, 1, -1
    const testInputsB = snapshot.generatedTests.tests.map(t => t.inputs.b);
    assert.ok(testInputsB.includes(0));
    assert.ok(testInputsB.includes(1));
    assert.ok(testInputsB.includes(-1));
});

// ─────────────────────────────────────────────────────────────────────────────
// 11. End-to-End Scenario 2: Mutation-Guided Specification Mining
// ─────────────────────────────────────────────────────────────────────────────
console.log('11. Testing End-to-End Scenario 2 (Mutation-Guided Specification Mining & Killing)...');

it('Identifies surviving mutant, generates objective, synthesizes test and kills mutant', () => {
    const mutant = {
        id: 'mut_divide_inverted_guard',
        functionId: 'divide',
        operator: 'RELATIONAL_REPLACEMENT',
        description: 'if b != 0: return 0',
    };

    const analyzer = new SpecificationAnalyzer();
    const snapshot = analyzer.analyze({
        functionId: 'divide',
        parameters: ['a', 'b'],
        survivingMutants: [mutant],
    });

    // Gap identified for surviving mutant
    assert.ok(snapshot.gaps.some(g => g.kind === 'MUTATION_SURVIVOR'));

    // Test synthesized for b == 0
    const testZero = snapshot.generatedTests.tests.find(t => t.inputs.b === 0);
    assert.ok(testZero);

    // Execute against baseline (returns 0) vs mutant (raises exception or returns non-zero)
    const baselineExec = (inputs) => ({ returnValue: inputs.b === 0 ? 0 : inputs.a / inputs.b });
    const mutantExec = (inputs) => {
        if (inputs.b !== 0) return { returnValue: 0 };
        throw new Error('ZeroDivisionError: division by zero');
    };

    const baseRes = baselineExec(testZero.inputs);
    let mutRes = null;
    try {
        mutRes = mutantExec(testZero.inputs);
    } catch (err) {
        mutRes = { exception: { type: 'ZeroDivisionError' } };
    }

    const comp = OracleComparator.compareDifferential(testZero.oracle, baseRes, mutRes);
    assert.strictEqual(comp.isDistinguished, true);
    assert.strictEqual(comp.baselineResult.status, 'PASS');
    assert.strictEqual(comp.changedResult.status, 'FAIL');
});

// ─────────────────────────────────────────────────────────────────────────────
// 12. End-to-End Scenario 3: Specification Conflict Scenario
// ─────────────────────────────────────────────────────────────────────────────
console.log('12. Testing End-to-End Scenario 3 (Specification Conflict Scenario)...');

it('Identifies differing outputs for identical inputs and produces INCONCLUSIVE conflict status', () => {
    const analyzer = new SpecificationAnalyzer();
    const obs = [
        new Observation({ functionId: 'f', inputs: { x: 1 }, returnValue: 2 }),
        new Observation({ functionId: 'f', inputs: { x: 1 }, returnValue: 3 }),
    ];

    const snapshot = analyzer.analyze({
        functionId: 'f',
        parameters: ['x'],
        observations: obs,
    });

    const conflictSpec = snapshot.specifications.specs.find(s => s.status === SpecificationStatus.INCONCLUSIVE);
    assert.ok(conflictSpec);
    assert.strictEqual(conflictSpec.confidence, SpecificationConfidence.UNKNOWN);
    assert.ok(conflictSpec.evidence[0].includes('CONFLICTING_OBSERVATIONS'));
});

// ─────────────────────────────────────────────────────────────────────────────
// 13. SpecificationEngine Execution & Isolated Sandbox
// ─────────────────────────────────────────────────────────────────────────────
console.log('13. Testing SpecificationEngine Execution & Sandbox...');

it('SpecificationEngine runs tests against executor and produces updated snapshot and results', () => {
    const engine = new SpecificationEngine();
    const snapshot = engine.analyze({
        functionId: 'divide',
        parameters: ['a', 'b'],
        observations: [
            new Observation({ functionId: 'divide', inputs: { a: 10, b: 2 }, returnValue: 5 }),
        ],
    });

    const { snapshot: updatedSnap, results } = engine.runTests(snapshot, (inputs) => {
        if (inputs.b === 0) return { returnValue: 0 };
        return { returnValue: inputs.a / inputs.b };
    });

    assert.ok(results.length > 0);
    assert.ok(updatedSnap.observations.size > snapshot.observations.size);
});

// ─────────────────────────────────────────────────────────────────────────────
// 14. Serialization & Historical Determinism
// ─────────────────────────────────────────────────────────────────────────────
console.log('14. Testing Serialization & Historical Determinism...');

it('SpecificationSnapshot round-trips cleanly through JSON serialization', () => {
    const engine = new SpecificationEngine();
    const snap = engine.analyze({
        functionId: 'divide',
        parameters: ['a', 'b'],
        observations: [
            new Observation({ functionId: 'divide', inputs: { a: 10, b: 2 }, returnValue: 5 }),
        ],
    });

    const json = snap.toJSON();
    const restored = SpecificationSnapshot.fromJSON(json);

    assert.strictEqual(restored.id, snap.id);
    assert.strictEqual(restored.specifications.size, snap.specifications.size);
    assert.strictEqual(restored.oracles.length, snap.oracles.length);
    assert.strictEqual(restored.objectives.length, snap.objectives.length);
    assert.strictEqual(restored.generatedTests.size, snap.generatedTests.size);
});

it('SpecificationQueries provides structured access and explanations', () => {
    const engine = new SpecificationEngine();
    const snap = engine.analyze({
        functionId: 'divide',
        parameters: ['a', 'b'],
        observations: [
            new Observation({ functionId: 'divide', inputs: { a: 10, b: 2 }, returnValue: 5 }),
        ],
    });
    const queries = engine.query(snap);

    assert.ok(queries.getSpecifications().size > 0);
    assert.ok(queries.getBehaviorModel());
    assert.ok(queries.getTestObjectives().length > 0);
    assert.ok(queries.getGeneratedTests().size > 0);

    const specId = queries.getSpecifications().specs[0].id;
    const explanation = queries.explainSpecification(specId);
    assert.ok(explanation.explanation.includes('inferred via'));
});

// ─────────────────────────────────────────────────────────────────────────────
// 15. Debugger Integration APIs
// ─────────────────────────────────────────────────────────────────────────────
console.log('15. Testing Debugger Integration APIs...');

it('Debugger exposes Stage 22 orchestration APIs', () => {
    const dbg = new Debugger();
    const obs = [
        new Observation({ functionId: 'divide', inputs: { a: 10, b: 2 }, returnValue: 5 }),
        new Observation({ functionId: 'divide', inputs: { a: 10, b: 0 }, returnValue: 0 }),
    ];

    const specs = dbg.mineSpecifications('divide', obs);
    assert.ok(specs.size >= 1);

    const objs = dbg.generateTestObjectives({ functionId: 'divide', parameters: ['a', 'b'], observations: obs });
    assert.ok(objs.length > 0);

    const tests = dbg.synthesizeTests({ functionId: 'divide', parameters: ['a', 'b'], observations: obs });
    assert.ok(tests.size > 0);

    const snap = dbg.getSpecificationSnapshot();
    assert.ok(snap);

    const cov = dbg.getSpecificationCoverage();
    assert.ok(cov);
});

// ─────────────────────────────────────────────────────────────────────────────
// 16. Python Adapter, Extended Models & Domain Exploration
// ─────────────────────────────────────────────────────────────────────────────
console.log('16. Testing Python Adapter & Extended Specifications...');

it('PythonSpecificationAdapter extracts functions and parameters from Python code', () => {
    const adapter = new PythonSpecificationAdapter();
    const source = `
def add(x, y):
    return x + y

def check(val):
    if val < 0:
        raise ValueError("negative")
    return val
`;
    const res = adapter.extractBehavior(source);
    assert.strictEqual(res.functions.length, 2);
    assert.strictEqual(res.functions[0].name, 'add');
    assert.deepStrictEqual(res.functions[0].parameters, ['x', 'y']);
    assert.strictEqual(res.hasBranches, true);
    assert.strictEqual(res.hasExceptions, true);
});

it('PythonSpecificationAdapter generates input domain for boundary testing', () => {
    const adapter = new PythonSpecificationAdapter();
    const domain = adapter.generateInputDomain(['a', 'b']);
    assert.ok(domain.a.includes(0));
    assert.ok(domain.a.includes(1));
    assert.ok(domain.a.includes(-1));
    assert.ok(domain.b.includes(null));
});

it('OracleRefiner weakens exact oracle to property oracle', () => {
    const exact = new Oracle({ kind: OracleKind.RETURN_VALUE, expected: 5 });
    const weakened = OracleRefiner.weakenToProperty(exact);
    assert.strictEqual(weakened.kind, 'PROPERTY');
    assert.strictEqual(weakened.confidence, OracleConfidence.PROPERTY);
});

it('SpecificationRefiner weakens specification with new precondition', () => {
    const spec = new Invariant({ expression: 'x >= 0' });
    const weakened = SpecificationRefiner.weaken(spec, 'x is not None');
    assert.strictEqual(weakened.status, SpecificationStatus.REFINED);
    assert.ok(weakened.preconditions.includes('x is not None'));
});

it('TransitionObjectiveGenerator generates objectives for state transitions', () => {
    const gen = new TransitionObjectiveGenerator();
    const trans = [
        new TransitionModel({ fromStateId: 'OFF', toStateId: 'ON', trigger: 'power_switch' }),
    ];
    const objs = gen.generate(trans);
    assert.strictEqual(objs.length, 1);
    assert.strictEqual(objs[0].kind, TestObjectiveKind.DISTINGUISH_BEHAVIOR);
    assert.strictEqual(objs[0].fromState, 'OFF');
});

it('CollectionProperty models element uniqueness and ordering', () => {
    const col = new CollectionProperty({
        targetCollection: 'sorted_ids',
        propertyType: 'ORDERED',
        elementConstraint: 'ascending',
    });
    assert.strictEqual(col.propertyType, 'ORDERED');
    assert.strictEqual(col.elementConstraint, 'ascending');
});

it('BehavioralProperty models custom predicates and contexts', () => {
    const prop = new BehavioralProperty({
        propertyType: 'INFORMATIVE',
        predicate: 'len(output) <= len(input) * 2',
        context: { maxExpansion: 2 },
    });
    assert.strictEqual(prop.predicate, 'len(output) <= len(input) * 2');
    assert.strictEqual(prop.context.maxExpansion, 2);
});

it('AdequacyCriterion contains all required adequacy criteria', () => {
    const criteria = Object.values(AdequacyCriterion);
    assert.ok(criteria.includes('SPECIFICATION'));
    assert.ok(criteria.includes('ORACLE'));
    assert.ok(criteria.includes('BEHAVIORAL'));
    assert.ok(criteria.includes('MUTATION'));
    assert.ok(criteria.includes('REGRESSION'));
});

it('TestSynthesisPlan generates deterministic ID and round-trips to JSON', () => {
    const plan = new TestSynthesisPlan({
        objectives: [{ id: 'obj_1' }],
        strategy: 'HYBRID',
    });
    assert.ok(plan.id.startsWith('plan_synth_'));
    const json = plan.toJSON();
    const restored = TestSynthesisPlan.fromJSON(json);
    assert.strictEqual(restored.id, plan.id);
    assert.strictEqual(restored.strategy, 'HYBRID');
});

it('SpecificationQueries filters specifications by location, object, and watch', () => {
    const sLoc = new Specification({
        sourceLocations: [{ fileId: 'main.py', line: 15 }],
    });
    const sObj = new Specification({
        subject: { objectId: 'obj_42' },
    });
    const sWatch = new Specification({
        evidence: ['watch_w1: len(items) == 3'],
    });

    const set = new SpecificationSet([sLoc, sObj, sWatch]);
    const snap = new SpecificationSnapshot({ specifications: set });
    const queries = new SpecificationQueries(snap);

    assert.strictEqual(queries.getSpecificationsAtLocation({ fileId: 'main.py', line: 15 }).size, 1);
    assert.strictEqual(queries.getSpecificationsForObject('obj_42').size, 1);
    assert.strictEqual(queries.getSpecificationsForWatch('watch_w1').size, 1);
});

it('StateModel and TransitionModel serialize and restore cleanly', () => {
    const state = new StateModel({ id: 's1', name: 'INIT', variables: { counter: 0 } });
    const trans = new TransitionModel({ fromStateId: 's1', toStateId: 's2', trigger: 'inc' });

    const stateJson = state.toJSON();
    const transJson = trans.toJSON();

    const restoredState = StateModel.fromJSON(stateJson);
    const restoredTrans = TransitionModel.fromJSON(transJson);

    assert.strictEqual(restoredState.id, 's1');
    assert.strictEqual(restoredState.variables.counter, 0);
    assert.strictEqual(restoredTrans.fromStateId, 's1');
    assert.strictEqual(restoredTrans.toStateId, 's2');
});

it('OracleExpression models targets, operators, and expressions', () => {
    const expr = new OracleExpression({
        expression: 'count > 0',
        operator: '>',
        targetVariable: 'count',
    });
    const json = expr.toJSON();
    const restored = OracleExpression.fromJSON(json);
    assert.strictEqual(restored.expression, 'count > 0');
    assert.strictEqual(restored.targetVariable, 'count');
});

it('Observation records heap mutations and watch values', () => {
    const obs = new Observation({
        functionId: 'mutate',
        heapMutations: [{ target: 'list_1', op: 'append', val: 10 }],
        watchValues: { w1: 100 },
    });
    assert.strictEqual(obs.heapMutations.length, 1);
    assert.strictEqual(obs.watchValues.w1, 100);
});

it('InvariantMiner detects constant values across repeated executions', () => {
    const miner = new InvariantMiner();
    const obs = [
        new Observation({ functionId: 'f', inputs: { version: 1 } }),
        new Observation({ functionId: 'f', inputs: { version: 1 } }),
    ];
    const invs = miner.mine('f', obs);
    assert.ok(invs.some(i => i.expression === 'version == 1'));
});

it('ContractMiner assigns HIGH_CONFIDENCE when multiple matching runs exist', () => {
    const miner = new ContractMiner();
    const obs = [
        new Observation({ functionId: 'f', returnValue: 'hello' }),
        new Observation({ functionId: 'f', returnValue: 'world' }),
    ];
    const contracts = miner.mine('f', obs);
    assert.ok(contracts.some(c => c.confidence === SpecificationConfidence.HIGH_CONFIDENCE));
});

// ─────────────────────────────────────────────────────────────────────────────
// 17. High-Scale Performance Benchmarks
// ─────────────────────────────────────────────────────────────────────────────
console.log('16. Testing High-Scale Performance Benchmarks...');

it('Mines 10,000 observations in < 200ms', () => {
    const miner = new SpecificationMiner();
    const obsList = [];
    for (let i = 0; i < 10000; i++) {
        obsList.push(new Observation({
            functionId: 'perf_fn',
            inputs: { a: i, b: (i % 10) + 1 },
            returnValue: i / ((i % 10) + 1),
        }));
    }

    const start = Date.now();
    const res = miner.mine('perf_fn', obsList);
    const duration = Date.now() - start;

    assert.ok(res.specifications.size > 0);
    assert.ok(duration < 200, `10,000 observations mined in ${duration}ms (< 200ms)`);
});

it('Evaluates 10,000 oracles in < 200ms', () => {
    const oracle = new Oracle({ kind: OracleKind.RETURN_VALUE, expected: 5 });
    const obs = { returnValue: 5 };

    const start = Date.now();
    for (let i = 0; i < 10000; i++) {
        OracleEvaluator.evaluate(oracle, obs);
    }
    const duration = Date.now() - start;

    assert.ok(duration < 200, `10,000 oracle evaluations in ${duration}ms (< 200ms)`);
});

it('Generates 1,000 test objectives in < 150ms', () => {
    const gen = new TestObjectiveGenerator({ maxObjectives: 1000 });
    const specs = [];
    for (let i = 0; i < 500; i++) {
        specs.push(new Invariant({ expression: `var_${i} >= 0` }));
    }

    const start = Date.now();
    const objs = gen.generateAll({
        functionId: 'scale_fn',
        parameters: ['x', 'y'],
        specifications: specs,
    });
    const duration = Date.now() - start;

    assert.ok(objs.length <= 1000);
    assert.ok(duration < 150, `1,000 test objectives generated in ${duration}ms (< 150ms)`);
});

it('Synthesizes 1,000 semantic tests in < 1,000ms', () => {
    const synth = new TestSynthesizer({ maxGeneratedTests: 1000 });
    const objs = [];
    for (let i = 0; i < 1000; i++) {
        objs.push({
            id: `obj_perf_${i}`,
            kind: TestObjectiveKind.EXERCISE_BOUNDARY,
            targetFunction: 'perf_fn',
            parameter: 'x',
            boundaryValue: i,
        });
    }

    const start = Date.now();
    const suite = synth.synthesizeAll(objs, { functionId: 'perf_fn', parameters: ['x'] });
    const duration = Date.now() - start;

    assert.ok(suite.size <= 1000);
    assert.ok(duration < 1000, `1,000 semantic tests synthesized in ${duration}ms (< 1,000ms)`);
});

it('Executes 10,000 specification queries in < 100ms', () => {
    const engine = new SpecificationEngine();
    const snap = engine.analyze({
        functionId: 'query_fn',
        parameters: ['a', 'b'],
        observations: [
            new Observation({ functionId: 'query_fn', inputs: { a: 10, b: 2 }, returnValue: 5 }),
        ],
    });
    const queries = engine.query(snap);

    const start = Date.now();
    for (let i = 0; i < 10000; i++) {
        queries.getSpecifications();
        queries.getBehaviorModel();
        queries.getTestObjectives();
    }
    const duration = Date.now() - start;

    assert.ok(duration < 100, `10,000 specification queries in ${duration}ms (< 100ms)`);
});

console.log('\n================================================================');
console.log(`Stage 22 Test Results: ${passed}/${total} passed, 0 failed.`);
console.log('================================================================\n');
