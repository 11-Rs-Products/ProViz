/**
 * Stage 17 Test Suite — Universal Counterexample-Guided Test Generation & Dynamic Validation Engine
 */

import { TestInput } from '../src/testing/TestInput.js';
import { TEST_INPUT_KINDS } from '../src/testing/TestInputKind.js';
import { TestValue, TEST_VALUE_TYPES } from '../src/testing/TestValue.js';
import { TestValueGenerator } from '../src/testing/TestValueGenerator.js';
import { TestCase } from '../src/testing/TestCase.js';
import { TEST_CASE_STATUSES } from '../src/testing/TestCaseStatus.js';
import { TestTarget } from '../src/testing/TestTarget.js';
import { TEST_TARGET_KINDS } from '../src/testing/TestTargetKind.js';
import { TestExpectation } from '../src/testing/TestExpectation.js';
import { TestObservation } from '../src/testing/TestObservation.js';
import { ConstraintConcretizer } from '../src/testing/ConstraintConcretizer.js';
import { ASSIGNMENT_STATUSES } from '../src/testing/ConstraintAssignment.js';
import { AssignmentValidator } from '../src/testing/AssignmentValidator.js';
import { PathTestGenerator } from '../src/testing/PathTestGenerator.js';
import { FindingTestGenerator } from '../src/testing/FindingTestGenerator.js';
import { CounterexampleGenerator } from '../src/testing/CounterexampleGenerator.js';
import { TestDeduplicator } from '../src/testing/TestDeduplicator.js';
import { TestMinimizer } from '../src/testing/TestMinimizer.js';
import { Coverage } from '../src/testing/Coverage.js';
import { CoverageAnalyzer } from '../src/testing/CoverageAnalyzer.js';
import { PredictionComparator, COMPARISON_STATUSES } from '../src/testing/PredictionComparator.js';
import { TestValidator } from '../src/testing/TestValidator.js';
import { TestResult, TEST_RESULT_STATUSES } from '../src/testing/TestResult.js';
import { TestSuite } from '../src/testing/TestSuite.js';
import { TestSuiteBuilder } from '../src/testing/TestSuiteBuilder.js';
import { TestExplanation } from '../src/testing/TestExplanation.js';
import { TestSnapshot } from '../src/testing/TestSnapshot.js';
import { PythonTestingAdapter } from '../src/testing/PythonTestingAdapter.js';
import { TestExecutor } from '../src/testing/TestExecutor.js';
import { TestingEngine } from '../src/testing/TestingEngine.js';
import { TestingAnalyzer } from '../src/testing/TestingAnalyzer.js';
import { TestingQueries } from '../src/testing/TestingQueries.js';
import { Debugger } from '../src/debugger/Debugger.js';
import { Constraint } from '../src/symbolic/Constraint.js';
import { SymbolicExpression } from '../src/symbolic/SymbolicExpression.js';
import { Counterexample } from '../src/symbolic/Counterexample.js';
import { SymbolicPath } from '../src/symbolic/SymbolicPath.js';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
    totalTests++;
    if (condition) {
        passedTests++;
        console.log(`  ✓ ${message}`);
    } else {
        failedTests++;
        console.error(`  ✗ FAIL: ${message}`);
        throw new Error(`Assertion failed: ${message}`);
    }
}

console.log('=== ProViz Stage 17: Universal Test Generation & Validation Test Suite ===\n');

// ─────────────────────────────────────────────────────────────────────────────
// 1. TestInput & TestValue Models
// ─────────────────────────────────────────────────────────────────────────────
console.log('1. Testing TestInput & TestValue Models...');
{
    const valInt = TestValue.int(42);
    const valStr = TestValue.string('hello');
    const valNone = TestValue.none();
    const valList = TestValue.list([1, 2, 3]);

    assert(valInt.type === TEST_VALUE_TYPES.INT, 'TestValue integer type is INT');
    assert(valInt.value === 42, 'TestValue integer value is 42');
    assert(valStr.type === TEST_VALUE_TYPES.STRING, 'TestValue string type is STRING');
    assert(valNone.type === TEST_VALUE_TYPES.NONE, 'TestValue none type is NONE');
    assert(valList.type === TEST_VALUE_TYPES.LIST, 'TestValue list type is LIST');

    const input = new TestInput({
        kind: TEST_INPUT_KINDS.FUNCTION_ARGUMENTS,
        bindings: { x: valInt, s: valStr },
    });

    assert(input.hasBinding('x'), 'TestInput contains binding x');
    assert(input.getBinding('x').value === 42, 'Binding x has value 42');
    assert(input.id.startsWith('input_'), 'Deterministic TestInput ID generated');

    // Serialization round-trip
    const json = input.toJSON();
    const restored = TestInput.fromJSON(json);
    assert(restored.id === input.id, 'TestInput JSON round-trip equality');
    assert(restored.getBinding('x').value === 42, 'Restored binding value matches');
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. TestValueGenerator (Boundaries, Intervals, Types)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n2. Testing TestValueGenerator & Boundary Candidate Selection...');
{
    const intVal = TestValueGenerator.generateInteger({ min: 10, max: 20 });
    assert(intVal.value >= 10 && intVal.value <= 20, 'Generated integer within interval [10, 20]');

    const zeroFavored = TestValueGenerator.generateInteger({ min: -5, max: 5, strategy: 'ZERO_FAVORED' });
    assert(zeroFavored.value === 0, 'Zero-favored integer strategy chose 0');

    const listVal = TestValueGenerator.generateList({ length: 3, elementValue: 9 });
    assert(listVal.value.length === 3, 'Generated list of length 3');
    assert(listVal.value[0] === 9, 'Generated list elements match specified value');

    const dictVal = TestValueGenerator.generateDict({ requiredKeys: ['user', 'id'], defaultValue: 1 });
    assert(dictVal.value.user === 1 && dictVal.value.id === 1, 'Generated dict contains required keys');
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. ConstraintConcretizer & Assignment Validation
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n3. Testing ConstraintConcretizer & Assignment Validation...');
{
    const c1 = Constraint.ge(SymbolicExpression.symbol('x'), SymbolicExpression.constant(5));
    const c2 = Constraint.le(SymbolicExpression.symbol('x'), SymbolicExpression.constant(10));
    const c3 = Constraint.ne(SymbolicExpression.symbol('x'), SymbolicExpression.constant(5));

    const assignment = ConstraintConcretizer.concretize([c1, c2, c3]);
    assert(assignment.status === ASSIGNMENT_STATUSES.SATISFIED, 'Concretization satisfied numeric interval');
    const xVal = assignment.getBinding('x').value;
    assert(xVal > 5 && xVal <= 10, `Generated value ${xVal} satisfies constraints x > 5 and x <= 10`);

    const validation = AssignmentValidator.validate(assignment.bindings, [c1, c2, c3]);
    assert(validation.isValid, 'AssignmentValidator confirmed validity of generated assignment');
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Counterexample Concretization
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n4. Testing Symbolic Counterexample Concretization...');
{
    const ce = new Counterexample({
        property: 'prop_safe_div',
        assignments: { y: 0, x: 10 },
        metadata: { findingId: 'find_div_zero_1' },
    });

    const assignment = ConstraintConcretizer.concretizeCounterexample(ce);
    assert(assignment.status === ASSIGNMENT_STATUSES.SATISFIED, 'Concretized counterexample successfully');
    assert(assignment.getBinding('y').value === 0, 'Counterexample binding y = 0 preserved');
    assert(assignment.getBinding('x').value === 10, 'Counterexample binding x = 10 preserved');

    const testCase = CounterexampleGenerator.generate(ce);
    assert(testCase !== null, 'Generated TestCase from Counterexample');
    assert(testCase.targetKind === TEST_TARGET_KINDS.COUNTEREXAMPLE, 'TestCase targetKind is COUNTEREXAMPLE');
    assert(testCase.inputs.getBinding('y').value === 0, 'TestCase input contains y = 0');
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Finding-Directed Test Generation
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n5. Testing Finding-Directed Test Generation...');
{
    const finding = {
        id: 'finding_div_zero_1',
        type: 'POSSIBLE_DIVISION_BY_ZERO',
        message: "Division by variable 'b' which may be zero",
        expression: 'a / b',
        counterexample: new Counterexample({
            property: 'prop_safe_div',
            assignments: { b: 0, a: 100 },
        }),
    };

    const tc = FindingTestGenerator.generateForFinding(finding);
    assert(tc !== null, 'Generated TestCase for division-by-zero finding');
    assert(tc.inputs.getBinding('b').value === 0, 'Targeted divisor b = 0');
    assert(tc.expected.expectedException === 'ZeroDivisionError', 'Expected exception is ZeroDivisionError');
    assert(tc.status === TEST_CASE_STATUSES.EXECUTABLE, 'TestCase status is EXECUTABLE');
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Path-Directed Test Generation
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n6. Testing Path-Directed Test Generation...');
{
    const path = new SymbolicPath({
        functionId: 'func_test',
        nodeIds: ['n1', 'n2', 'n3'],
        predicates: [],
        isFeasible: true,
    });

    const tc = PathTestGenerator.generateForPath(path);
    assert(tc !== null, 'Generated TestCase for feasible path');
    assert(tc.targetKind === TEST_TARGET_KINDS.PATH, 'TestCase targetKind is PATH');
    assert(tc.symbolicPathId === path.id, 'TestCase references symbolicPathId');
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. Test Deduplication & Minimization
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n7. Testing Test Deduplication & Minimization...');
{
    const tc1 = new TestCase({
        targetId: 'f1',
        inputs: new TestInput({ bindings: { x: 100, y: 50 } }),
    });
    const tc2 = new TestCase({
        targetId: 'f1',
        inputs: new TestInput({ bindings: { x: 100, y: 50 } }),
    });
    const tc3 = new TestCase({
        targetId: 'f1',
        inputs: new TestInput({ bindings: { x: 5, y: 2 } }),
    });

    const deduplicated = TestDeduplicator.deduplicate([tc1, tc2, tc3]);
    assert(deduplicated.length === 2, 'Deduplicator removed duplicate test case');

    // Minimization
    const minimized = TestMinimizer.minimize(tc1);
    assert(minimized.inputs.getBinding('x').value === 1, 'Minimizer reduced integer magnitude x: 100 -> 1');
    assert(minimized.inputs.getBinding('y').value === 1, 'Minimizer reduced integer magnitude y: 50 -> 1');
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. Coverage & CoverageAnalyzer
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n8. Testing Coverage & CoverageAnalyzer...');
{
    const traceEvents = [
        { line: 1, cfgNodeId: 'node_1', functionName: 'main' },
        { line: 2, cfgNodeId: 'node_2', functionName: 'main', branch: 'node_2:true' },
        { line: 3, cfgNodeId: 'node_3', functionName: 'main' },
    ];

    const cov = CoverageAnalyzer.analyzeTrace(traceEvents);
    assert(cov.lines.length === 3, 'Covered 3 source lines');
    assert(cov.nodes.length === 3, 'Covered 3 CFG nodes');
    assert(cov.branches.length === 1, 'Covered 1 branch');
    assert(cov.functions.includes('main'), 'Covered function main');

    const cov2 = new Coverage({ lines: [1, 4], totalLines: 5 });
    const unionCov = cov.union(cov2);
    assert(unionCov.lines.length === 4, 'Union coverage combines covered lines [1, 2, 3, 4]');
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. PredictionComparator & TestValidator
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n9. Testing PredictionComparator & TestValidator...');
{
    const exp = new TestExpectation({
        expectedException: 'ZeroDivisionError',
    });

    const obsMatch = new TestObservation({
        executionStatus: 'ERROR',
        exception: { type: 'ZeroDivisionError', message: 'division by zero' },
    });

    const compMatch = PredictionComparator.compare(exp, obsMatch);
    assert(compMatch.status === COMPARISON_STATUSES.MATCH, 'PredictionComparator identified matching exception');

    const obsMismatch = new TestObservation({
        executionStatus: 'COMPLETED',
        exception: null,
    });

    const compMismatch = PredictionComparator.compare(exp, obsMismatch);
    assert(compMismatch.status === COMPARISON_STATUSES.MISMATCH, 'PredictionComparator identified mismatched exception');

    const tc = new TestCase({
        targetId: 'div_finding',
        expected: exp,
    });

    const resMatch = TestValidator.validate(tc, obsMatch);
    assert(resMatch.isSuccess(), 'TestValidator confirmed PASS on matching observation');

    const resMismatch = TestValidator.validate(tc, obsMismatch);
    assert(resMismatch.status === TEST_RESULT_STATUSES.MISMATCH, 'TestValidator flagged MISMATCH on divergent observation');
}

// ─────────────────────────────────────────────────────────────────────────────
// 10. PythonTestingAdapter & TestExecutor Harness
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n10. Testing PythonTestingAdapter & TestExecutor Harness...');
{
    const adapter = new PythonTestingAdapter();
    const tc = new TestCase({
        targetId: 't1',
        inputs: new TestInput({
            bindings: { x: TestValue.int(10), s: TestValue.string('abc') },
        }),
    });

    const code = 'res = x + len(s)';
    const harnessed = adapter.createTestHarness(code, tc);
    assert(harnessed.includes('x = 10'), 'Harness prepended assignment x = 10');
    assert(harnessed.includes('s = "abc"'), 'Harness prepended assignment s = "abc"');

    const executor = new TestExecutor({ adapter });
    const obs = executor.execute(tc, code);
    assert(obs.executionStatus === 'COMPLETED', 'TestExecutor executed test successfully in isolated simulation');
}

// ─────────────────────────────────────────────────────────────────────────────
// 11. TestSuite & TestSuiteBuilder
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n11. Testing TestSuite & TestSuiteBuilder...');
{
    const builder = new TestSuiteBuilder({ workspaceVersion: 1, deduplicate: true });
    const tc1 = new TestCase({ targetId: 'p1' });
    const tc2 = new TestCase({ targetId: 'p2' });
    builder.addTests([tc1, tc2]);

    const suite = builder.build();
    assert(suite.length === 2, 'TestSuite contains 2 test cases');
    assert(suite.status === 'READY', 'TestSuite status is READY');

    // Serialization round-trip
    const json = suite.toJSON();
    const restored = TestSuite.fromJSON(json);
    assert(restored.length === 2, 'Restored TestSuite matches original length');
}

// ─────────────────────────────────────────────────────────────────────────────
// 12. TestExplanation Engine
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n12. Testing TestExplanation Engine...');
{
    const tc = new TestCase({
        targetKind: TEST_TARGET_KINDS.FINDING,
        targetId: 'finding_123',
        inputs: new TestInput({ bindings: { y: 0 } }),
        expected: new TestExpectation({ expectedException: 'ZeroDivisionError' }),
    });

    const result = new TestResult({
        testId: tc.id,
        status: TEST_RESULT_STATUSES.PASS,
        observation: new TestObservation({
            executionStatus: 'ERROR',
            exception: { type: 'ZeroDivisionError' },
        }),
    });

    const explanation = TestExplanation.fromTestCase(tc, result);
    assert(explanation.status === TEST_RESULT_STATUSES.PASS, 'TestExplanation reflects PASS status');
    assert(explanation.steps.length >= 4, 'TestExplanation includes sequential explanation steps');
    assert(explanation.toString().includes('ZeroDivisionError'), 'Formatted explanation text mentions ZeroDivisionError');
}

// ─────────────────────────────────────────────────────────────────────────────
// 13. TestSnapshot Immutability & Serialization
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n13. Testing TestSnapshot Immutability & Serialization...');
{
    const tc = new TestCase({ targetId: 'p1' });
    const snapshot = new TestSnapshot({
        version: 1,
        workspaceVersion: 1,
        tests: [tc],
        status: 'SUCCESS',
    });

    assert(Object.isFrozen(snapshot), 'TestSnapshot is frozen and immutable');
    assert(snapshot.tests.length === 1, 'TestSnapshot retains generated test');

    const json = snapshot.toJSON();
    const restored = TestSnapshot.fromJSON(json);
    assert(snapshot.equals(restored), 'TestSnapshot equals restored instance');
}

// ─────────────────────────────────────────────────────────────────────────────
// 14. TestingEngine & TestingAnalyzer End-to-End Pipeline
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n14. Testing TestingEngine & TestingAnalyzer End-to-End Pipeline...');
{
    const code = `a = 10\nb = 0\nc = a / b`;
    const analyzer = new TestingAnalyzer();
    const result = analyzer.analyzeSource(code, { functionId: 'pipeline_test' });

    assert(result.tests.length >= 1, 'Generated test cases from source analysis');
    assert(result.results.length >= 1, 'Executed and validated generated tests');
    const res = result.results[0];
    assert(res.status === TEST_RESULT_STATUSES.PASS, 'Validated predicted division by zero finding dynamically');

    const queries = new TestingQueries(result.snapshot);
    assert(queries.getTests().length >= 1, 'TestingQueries returned generated tests');
    assert(queries.getTestResults().length >= 1, 'TestingQueries returned test results');
    const expl = queries.getTestExplanation(result.tests[0].id);
    assert(expl !== null, 'TestingQueries returned structured test explanation');
}

// ─────────────────────────────────────────────────────────────────────────────
// 15. Debugger Integration (Stage 17 Testing APIs)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n15. Testing Debugger Integration (Stage 17 APIs)...');
{
    const dbg = new Debugger();
    const trace = {
        version: 1,
        events: [
            { id: 0, type: 'step', line: 1 },
            { id: 1, type: 'step', line: 2 },
        ],
        source: { code: 'x = 10\ny = 0\nz = x / y' },
    };
    dbg.loadExecution(trace);

    const snapshot = dbg.getTestingSnapshot();
    assert(snapshot !== null, 'Debugger returned TestingSnapshot');
    const tests = dbg.generateTestsForFinding('any');
    assert(Array.isArray(tests), 'Debugger returned tests array for finding');
    const cov = dbg.getCoverage();
    assert(cov !== null, 'Debugger returned coverage report');
}

// ─────────────────────────────────────────────────────────────────────────────
// 16. Determinism & Serialization Stability
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n16. Testing Determinism & Serialization Stability...');
{
    const code = `x = 5\nif x > 2:\n    y = 10\nelse:\n    y = 20`;
    const analyzer = new TestingAnalyzer();
    const res1 = analyzer.analyzeSource(code);
    const res2 = analyzer.analyzeSource(code);

    const json1 = JSON.stringify(res1.snapshot.toJSON());
    const json2 = JSON.stringify(res2.snapshot.toJSON());
    assert(json1 === json2, 'Test generation produces byte-for-byte identical serialization');
}

// ─────────────────────────────────────────────────────────────────────────────
// 17. Large Scale Performance Benchmarks
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n17. Testing Large Scale Performance Benchmarks...');
{
    // Benchmark 1: 1,000 test case generations
    const t0 = Date.now();
    const tests = [];
    for (let i = 0; i < 1000; i++) {
        tests.push(new TestCase({
            targetId: `f_${i}`,
            inputs: new TestInput({ bindings: { x: i } }),
        }));
    }
    const genDuration = Date.now() - t0;
    assert(genDuration < 1000, `Generated 1,000 TestCases in ${genDuration}ms (< 1000ms)`);

    // Benchmark 2: 10,000 constraint concretizations
    const t1 = Date.now();
    for (let i = 0; i < 10000; i++) {
        ConstraintConcretizer.concretize([
            Constraint.ge(SymbolicExpression.symbol('x'), SymbolicExpression.constant(i)),
            Constraint.le(SymbolicExpression.symbol('x'), SymbolicExpression.constant(i + 10)),
        ]);
    }
    const solveDuration = Date.now() - t1;
    assert(solveDuration < 500, `Executed 10,000 constraint concretizations in ${solveDuration}ms (< 500ms)`);

    // Benchmark 3: 1,000 test deduplications
    const t2 = Date.now();
    const deduped = TestDeduplicator.deduplicate(tests);
    const dedupDuration = Date.now() - t2;
    assert(dedupDuration < 100, `Deduplicated 1,000 test cases in ${dedupDuration}ms (< 100ms)`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n========================================');
console.log(`Results: ${passedTests} passed, ${failedTests} failed, ${totalTests} total.`);
console.log('========================================\n');

if (failedTests > 0) {
    process.exit(1);
}
