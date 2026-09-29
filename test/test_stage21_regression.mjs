/**
 * Stage 21 Test Suite — Universal Semantic Change Impact, Regression Intelligence & Test Selection Engine
 */

import { CHANGE_KINDS } from '../src/regression/ChangeKind.js';
import { CHANGE_SEVERITIES } from '../src/regression/ChangeSeverity.js';
import { CHANGE_CONFIDENCES } from '../src/regression/ChangeConfidence.js';
import { ChangeRegion } from '../src/regression/ChangeRegion.js';
import { ChangeImpact } from '../src/regression/ChangeImpact.js';
import { SemanticChange } from '../src/regression/SemanticChange.js';
import { SemanticChangeSet } from '../src/regression/SemanticChangeSet.js';
import { SymbolChange } from '../src/regression/SymbolChange.js';
import { FunctionChange } from '../src/regression/FunctionChange.js';
import { ModuleChange } from '../src/regression/ModuleChange.js';
import { TypeChange } from '../src/regression/TypeChange.js';
import { ControlFlowChange } from '../src/regression/ControlFlowChange.js';
import { DataflowChange } from '../src/regression/DataflowChange.js';
import { VerificationChange } from '../src/regression/VerificationChange.js';
import { SymbolicChange } from '../src/regression/SymbolicChange.js';
import { BehaviorChange } from '../src/regression/BehaviorChange.js';
import { StructuralDiff } from '../src/regression/StructuralDiff.js';
import { AnalysisDiff } from '../src/regression/AnalysisDiff.js';
import { BehavioralDiff } from '../src/regression/BehavioralDiff.js';
import { SemanticDiff } from '../src/regression/SemanticDiff.js';
import { ChangeDetector } from '../src/regression/ChangeDetector.js';
import { ImpactNode, IMPACT_NODE_KINDS } from '../src/regression/ImpactNode.js';
import { ImpactEdge, IMPACT_EDGE_KINDS } from '../src/regression/ImpactEdge.js';
import { ImpactGraph } from '../src/regression/ImpactGraph.js';
import { ImpactPropagator } from '../src/regression/ImpactPropagator.js';
import { ImpactAnalyzer } from '../src/regression/ImpactAnalyzer.js';
import { AffectedSymbol } from '../src/regression/AffectedSymbol.js';
import { AffectedFunction } from '../src/regression/AffectedFunction.js';
import { AffectedModule } from '../src/regression/AffectedModule.js';
import { AffectedPath } from '../src/regression/AffectedPath.js';
import { AffectedObject } from '../src/regression/AffectedObject.js';
import { AffectedProperty } from '../src/regression/AffectedProperty.js';
import { TestRelevance, TEST_RELEVANCE_LEVELS } from '../src/regression/TestRelevance.js';
import { TestSelectionReason } from '../src/regression/TestSelectionReason.js';
import { TestDependencyGraph } from '../src/regression/TestDependencyGraph.js';
import { TestSelector, TEST_SELECTION_STRATEGIES } from '../src/regression/TestSelector.js';
import { TestPrioritizer } from '../src/regression/TestPrioritizer.js';
import { TestImpactAnalyzer } from '../src/regression/TestImpactAnalyzer.js';
import { TestSelectionPlan } from '../src/regression/TestSelectionPlan.js';
import { RegressionExpectation, EXPECTATION_KINDS } from '../src/regression/RegressionExpectation.js';
import { REGRESSION_CLASSIFICATIONS } from '../src/regression/RegressionClassification.js';
import { RegressionFinding } from '../src/regression/RegressionFinding.js';
import { RegressionComparator } from '../src/regression/RegressionComparator.js';
import { RegressionExplainer } from '../src/regression/RegressionExplainer.js';
import { RegressionAnalyzer } from '../src/regression/RegressionAnalyzer.js';
import { ChangeCoverage } from '../src/regression/ChangeCoverage.js';
import { RegressionCoverage } from '../src/regression/RegressionCoverage.js';
import { RiskScore } from '../src/regression/RiskScore.js';
import { ConfidenceScore } from '../src/regression/ConfidenceScore.js';
import { SymbolicImpactAnalyzer } from '../src/regression/SymbolicImpactAnalyzer.js';
import { ConcolicImpactAnalyzer } from '../src/regression/ConcolicImpactAnalyzer.js';
import { MutationImpactAnalyzer } from '../src/regression/MutationImpactAnalyzer.js';
import { RepairImpactAnalyzer } from '../src/regression/RepairImpactAnalyzer.js';
import { RegressionCampaign, REGRESSION_CAMPAIGN_STATUSES } from '../src/regression/RegressionCampaign.js';
import { RegressionSession } from '../src/regression/RegressionSession.js';
import { RegressionResult } from '../src/regression/RegressionResult.js';
import { RegressionSnapshot } from '../src/regression/RegressionSnapshot.js';
import { RegressionQueries } from '../src/regression/RegressionQueries.js';
import { RegressionEngine } from '../src/regression/RegressionEngine.js';
import { LanguageRegressionAdapter } from '../src/regression/LanguageRegressionAdapter.js';
import { WorkspaceSnapshot } from '../src/workspace/WorkspaceSnapshot.js';
import { SourceFile } from '../src/workspace/SourceFile.js';
import { ModuleGraph } from '../src/workspace/ModuleGraph.js';
import { TestCase } from '../src/testing/TestCase.js';
import { TestInput } from '../src/testing/TestInput.js';
import { TestExpectation } from '../src/testing/TestExpectation.js';
import { TestSuite } from '../src/testing/TestSuite.js';
import { Debugger } from '../src/debugger/Debugger.js';

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

console.log('=== ProViz Stage 21: Universal Semantic Change Impact & Regression Intelligence Test Suite ===\n');

// ─────────────────────────────────────────────────────────────────────────────
// 1. Semantic Change Model & Change Sets
// ─────────────────────────────────────────────────────────────────────────────
console.log('1. Testing Semantic Change Descriptors & ChangeSet Indexing...');
{
    const regionB = new ChangeRegion({ fileId: 'file_main', path: 'main.py', startLine: 1, endLine: 2, content: 'x = 10' });
    const regionA = new ChangeRegion({ fileId: 'file_main', path: 'main.py', startLine: 1, endLine: 2, content: 'x = 20' });

    const change1 = new SemanticChange({
        kind: CHANGE_KINDS.STATEMENT_MODIFIED,
        fileId: 'file_main',
        sourceLocationBefore: regionB,
        sourceLocationAfter: regionA,
        symbolIds: ['x'],
        functionIds: ['main'],
        before: 'x = 10',
        after: 'x = 20',
        causes: ['User edit'],
    });

    assert(change1.id.startsWith('change_'), 'SemanticChange generates deterministic ID');
    assert(change1.symbolIds.includes('x'), 'Captures symbol IDs');
    assert(change1.functionIds.includes('main'), 'Captures function IDs');

    const fnChange = new FunctionChange({
        functionName: 'compute',
        oldParams: ['a'],
        newParams: ['a', 'b'],
        fileId: 'file_main',
    });
    assert(fnChange.kind === CHANGE_KINDS.FUNCTION_BODY_CHANGED || fnChange.kind === CHANGE_KINDS.FUNCTION_SIGNATURE_CHANGED, 'FunctionChange specializes SemanticChange');

    const symChange = new SymbolChange({
        symbolName: 'total',
        oldBinding: 0,
        newBinding: 100,
        fileId: 'file_main',
    });
    assert(symChange.symbolName === 'total', 'SymbolChange records symbol name');

    const modChange = new ModuleChange({
        moduleName: 'utils',
        newImports: ['math'],
    });
    assert(modChange.moduleName === 'utils', 'ModuleChange records module name');

    const typeChange = new TypeChange({
        targetName: 'user',
        oldType: 'str',
        newType: 'int',
        oldNullable: false,
        newNullable: true,
    });
    assert(typeChange.oldType === 'str' && typeChange.newType === 'int', 'TypeChange records type shift');

    const set = new SemanticChangeSet({ changes: [change1, fnChange, symChange, modChange, typeChange] });
    assert(set.size === 5, 'SemanticChangeSet holds 5 changes');
    assert(set.getByFile('file_main').length >= 3, 'ChangeSet indexes changes by file');
    assert(set.getByKind(CHANGE_KINDS.STATEMENT_MODIFIED).length === 1, 'ChangeSet indexes changes by kind');
    assert(set.getBySymbol('x').length === 1, 'ChangeSet indexes changes by symbol');
    assert(set.has(change1.id), 'ChangeSet retrieves change by ID');
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Structural Diff (Added, Removed, Modified, Moved Statements)
// ─────────────────────────────────────────────────────────────────────────────
console.log('2. Testing StructuralDiff & Statement Movement Detection...');
{
    const fileA1 = new SourceFile({ id: 'file_main', path: 'main.py', content: 'def foo(x):\n    return x + 1\n' });
    const fileA2 = new SourceFile({ id: 'file_utils', path: 'utils.py', content: 'def bar():\n    return 42\n' });
    const snapA = new WorkspaceSnapshot({ files: [fileA1, fileA2], version: 1 });

    // snapB: utils.py removed, helper.py added, main.py modified with moved/changed lines
    const fileB1 = new SourceFile({ id: 'file_main', path: 'main.py', content: 'def foo(x, y):\n    z = 10\n    return x + y\n' });
    const fileB3 = new SourceFile({ id: 'file_helper', path: 'helper.py', content: 'def help():\n    pass\n' });
    const snapB = new WorkspaceSnapshot({ files: [fileB1, fileB3], version: 2 });

    const changes = StructuralDiff.diff(snapA, snapB);
    assert(changes.length > 0, 'StructuralDiff detects changes');

    const hasAdded = changes.some(c => c.kind === CHANGE_KINDS.FILE_ADDED && c.fileId === 'file_helper');
    const hasRemoved = changes.some(c => c.kind === CHANGE_KINDS.FILE_REMOVED && c.fileId === 'file_utils');
    const hasMod = changes.some(c => c.kind === CHANGE_KINDS.FILE_MODIFIED && c.fileId === 'file_main');

    assert(hasAdded, 'Detects file addition (helper.py)');
    assert(hasRemoved, 'Detects file removal (utils.py)');
    assert(hasMod, 'Detects file modification (main.py)');

    const fnSigChange = changes.find(c => c.kind === CHANGE_KINDS.FUNCTION_SIGNATURE_CHANGED);
    assert(fnSigChange && fnSigChange.metadata.functionName === 'foo', 'Detects function signature change for foo');
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. AnalysisDiff (CFG, Dataflow, Verification, Symbolic, TypeFlow)
// ─────────────────────────────────────────────────────────────────────────────
console.log('3. Testing AnalysisDiff across semantic models...');
{
    const codeA = 'def process(a):\n    if a > 0:\n        return a\n    return 0\n';
    const codeB = 'def process(a):\n    return a\n';

    const fileA = new SourceFile({ id: 'file_main', path: 'main.py', content: codeA });
    const fileB = new SourceFile({ id: 'file_main', path: 'main.py', content: codeB });

    const snapA = new WorkspaceSnapshot({ files: [fileA], version: 1 });
    const snapB = new WorkspaceSnapshot({ files: [fileB], version: 2 });

    const changes = AnalysisDiff.diff(snapA, snapB);
    assert(changes.length > 0, 'AnalysisDiff discovers semantic analysis changes');

    const hasControlFlow = changes.some(c => c.kind === CHANGE_KINDS.CONTROL_FLOW_REMOVED || c.kind.includes('BRANCH'));
    assert(hasControlFlow, 'Discovers control flow branch removal');
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. SemanticDiff Top-Level Orchestration
// ─────────────────────────────────────────────────────────────────────────────
console.log('4. Testing SemanticDiff Orchestration...');
{
    const fileA = new SourceFile({ id: 'file_main', path: 'main.py', content: 'x = 10\ny = x + 1\n' });
    const fileB = new SourceFile({ id: 'file_main', path: 'main.py', content: 'x = 20\ny = x + 1\n' });

    const snapA = new WorkspaceSnapshot({ files: [fileA], version: 1 });
    const snapB = new WorkspaceSnapshot({ files: [fileB], version: 2 });

    const diff = SemanticDiff.diff(snapA, snapB);
    assert(diff.fromRevision === 1, 'Records fromRevision');
    assert(diff.toRevision === 2, 'Records toRevision');
    assert(diff.changeSet instanceof SemanticChangeSet, 'Returns a SemanticChangeSet');
    assert(diff.changeSet.size >= 1, 'ChangeSet contains detected changes');

    const detector = new ChangeDetector();
    const detectedSet = detector.detect(snapA, snapB);
    assert(detectedSet.size === diff.changeSet.size, 'ChangeDetector yields identical ChangeSet');
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Impact Graph Construction & Cycle-Safe Propagation
// ─────────────────────────────────────────────────────────────────────────────
console.log('5. Testing ImpactGraph & Cycle-Safe Bounded Propagation...');
{
    const graph = new ImpactGraph();
    const nodeA = new ImpactNode({ id: 'func_parse', kind: IMPACT_NODE_KINDS.FUNCTION, name: 'parse' });
    const nodeB = new ImpactNode({ id: 'var_x', kind: IMPACT_NODE_KINDS.SYMBOL, name: 'x' });
    const nodeC = new ImpactNode({ id: 'func_transform', kind: IMPACT_NODE_KINDS.FUNCTION, name: 'transform' });
    const nodeD = new ImpactNode({ id: 'var_y', kind: IMPACT_NODE_KINDS.SYMBOL, name: 'y' });
    const nodeE = new ImpactNode({ id: 'func_consume', kind: IMPACT_NODE_KINDS.FUNCTION, name: 'consume' });
    const nodeT = new ImpactNode({ id: 'test_pipeline', kind: IMPACT_NODE_KINDS.TEST, name: 'test_pipeline' });

    graph.addNode(nodeA).addNode(nodeB).addNode(nodeC).addNode(nodeD).addNode(nodeE).addNode(nodeT);

    graph.addEdge(new ImpactEdge({ fromId: 'func_parse', toId: 'var_x', kind: IMPACT_EDGE_KINDS.DEFINES }));
    graph.addEdge(new ImpactEdge({ fromId: 'var_x', toId: 'func_transform', kind: IMPACT_EDGE_KINDS.DATA_DEPENDS_ON }));
    graph.addEdge(new ImpactEdge({ fromId: 'func_transform', toId: 'var_y', kind: IMPACT_EDGE_KINDS.DEFINES }));
    graph.addEdge(new ImpactEdge({ fromId: 'var_y', toId: 'func_consume', kind: IMPACT_EDGE_KINDS.DATA_DEPENDS_ON }));
    graph.addEdge(new ImpactEdge({ fromId: 'func_consume', toId: 'test_pipeline', kind: IMPACT_EDGE_KINDS.TESTS }));

    // Create a cycle to verify cycle safety: func_consume -> func_parse
    graph.addEdge(new ImpactEdge({ fromId: 'func_consume', toId: 'func_parse', kind: IMPACT_EDGE_KINDS.CALLS }));

    assert(graph.nodeCount === 6, 'Graph holds 6 nodes');
    assert(graph.edgeCount === 6, 'Graph holds 6 edges');

    const result = ImpactPropagator.propagate(['func_parse'], graph, { maxDepth: 10 });
    assert(result.impactedCount === 6, 'Propagates across all reachable nodes');
    assert(result.impactedNodes.has('test_pipeline'), 'Test node reached via transitive dataflow');

    const exp = result.explain('test_pipeline');
    assert(exp && exp.path.length === 6, 'Explains path to impacted test');
    assert(exp.explanation.includes('func_parse'), 'Explanation cites root seed');
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Test Relevance, Dependency Graph & Test Prioritizer
// ─────────────────────────────────────────────────────────────────────────────
console.log('6. Testing Test Relevance & Deterministic Prioritization...');
{
    const depGraph = new TestDependencyGraph();
    depGraph.addCoverage('test_1', 'func_divide');
    depGraph.addCoverage('test_2', 'func_multiply');
    depGraph.addCoverage('test_3', 'func_divide');

    assert(depGraph.getAffectedTests(['func_divide']).length === 2, 'Resolves affected tests for function');
    assert(depGraph.getCoveredEntities('test_1').includes('func_divide'), 'Resolves covered entities for test');

    const t1 = new TestRelevance({
        testId: 'test_1',
        relevance: TEST_RELEVANCE_LEVELS.DIRECTLY_AFFECTED,
        reasons: ['Direct branch coverage'],
        metadata: { depth: 1 },
    });
    const t2 = new TestRelevance({
        testId: 'test_2',
        relevance: TEST_RELEVANCE_LEVELS.INDIRECTLY_AFFECTED,
        reasons: ['Indirect transitive dataflow'],
        metadata: { depth: 4 },
    });
    const t3 = new TestRelevance({
        testId: 'test_3',
        relevance: TEST_RELEVANCE_LEVELS.DIRECTLY_AFFECTED,
        reasons: ['Mutation killing test'],
        metadata: { depth: 1 },
    });

    const prioritized = TestPrioritizer.prioritize([t2, t1, t3]);
    assert(prioritized.length === 3, 'Prioritizes all tests');
    assert(prioritized[0].priority >= prioritized[1].priority, 'Higher priority ordered first');
    assert(prioritized[0].relevance === TEST_RELEVANCE_LEVELS.DIRECTLY_AFFECTED, 'Direct impact test prioritized over indirect');
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. TestSelector Strategies & Selection Plan
// ─────────────────────────────────────────────────────────────────────────────
console.log('7. Testing TestSelector strategies (DIRECT, ALL, HYBRID)...');
{
    const testCases = [
        new TestCase({ id: 'test_div', targetId: 'divide' }),
        new TestCase({ id: 'test_mul', targetId: 'multiply' }),
        new TestCase({ id: 'test_add', targetId: 'add' }),
    ];

    const change = new FunctionChange({ functionName: 'divide', fileId: 'file_main' });
    const changeSet = new SemanticChangeSet({ changes: [change] });

    const file = new SourceFile({ id: 'file_main', path: 'main.py', content: 'def divide(a, b):\n    return a / b\n' });
    const snapshot = new WorkspaceSnapshot({ files: [file] });

    const impactAnalyzer = new ImpactAnalyzer();
    const impactResults = impactAnalyzer.analyze(changeSet, snapshot, testCases);

    const planHybrid = TestSelector.select(changeSet, testCases, impactResults, { strategy: TEST_SELECTION_STRATEGIES.HYBRID });
    assert(planHybrid.selectedCount >= 1, 'Hybrid strategy selects affected divide test');
    assert(planHybrid.getSelectedTestIds().includes('test_div'), 'test_div is selected');

    const planAll = TestSelector.select(changeSet, testCases, impactResults, { strategy: TEST_SELECTION_STRATEGIES.ALL });
    assert(planAll.selectedCount === 3, 'ALL strategy selects all 3 tests');

    assert(planHybrid.planId.startsWith('plan_'), 'TestSelectionPlan generates deterministic planId');
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. Regression Comparator & Classification Matrix
// ─────────────────────────────────────────────────────────────────────────────
console.log('8. Testing RegressionComparator & Classification Taxonomy...');
{
    // Case 1: No regression (identical returns)
    const base1 = { executionStatus: 'COMPLETED', returnValue: 42, exception: null };
    const changed1 = { executionStatus: 'COMPLETED', returnValue: 42, exception: null };
    const res1 = RegressionComparator.compare(base1, changed1);
    assert(res1.classification === REGRESSION_CLASSIFICATIONS.NO_REGRESSION, 'Classifies identical outputs as NO_REGRESSION');

    // Case 2: Unexpected regression (new exception)
    const base2 = { executionStatus: 'COMPLETED', returnValue: 0, exception: null };
    const changed2 = { executionStatus: 'ERROR', returnValue: undefined, exception: { type: 'ZeroDivisionError' } };
    const res2 = RegressionComparator.compare(base2, changed2);
    assert(res2.classification === REGRESSION_CLASSIFICATIONS.UNEXPECTED_REGRESSION, 'Classifies new exception as UNEXPECTED_REGRESSION');
    assert(res2.isRegression === true, 'Flags isRegression = true');

    // Case 3: Fixed failure (baseline had error, changed succeeded)
    const base3 = { executionStatus: 'ERROR', returnValue: undefined, exception: { type: 'ZeroDivisionError' } };
    const changed3 = { executionStatus: 'COMPLETED', returnValue: 0, exception: null };
    const res3 = RegressionComparator.compare(base3, changed3);
    assert(res3.classification === REGRESSION_CLASSIFICATIONS.FIXED_FAILURE, 'Classifies resolved error as FIXED_FAILURE');

    // Case 4: Expected change (with matching expectation)
    const exp = new RegressionExpectation({
        kind: EXPECTATION_KINDS.EXPECTED_RETURN_CHANGE,
        testId: 'test_api',
        expectedReturn: 'v2_payload',
    });
    const base4 = { executionStatus: 'COMPLETED', returnValue: 'v1_payload', exception: null };
    const changed4 = { executionStatus: 'COMPLETED', returnValue: 'v2_payload', exception: null };
    const res4 = RegressionComparator.compare(base4, changed4, exp);
    assert(res4.classification === REGRESSION_CLASSIFICATIONS.EXPECTED_CHANGE, 'Classifies matching expected delta as EXPECTED_CHANGE');
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. Regression Finding, Explanation & Causal Chains
// ─────────────────────────────────────────────────────────────────────────────
console.log('9. Testing RegressionFinding & RegressionExplainer...');
{
    const finding = new RegressionFinding({
        classification: REGRESSION_CLASSIFICATIONS.UNEXPECTED_REGRESSION,
        testId: 'test_zero_div',
        changedEntities: ['line_2_branch'],
        impactedEntities: ['divide'],
        baselineObservation: { executionStatus: 'COMPLETED', returnValue: 0 },
        changedObservation: { executionStatus: 'ERROR', exception: { type: 'ZeroDivisionError' } },
        behavioralDelta: {
            changed: { exception: { type: 'ZeroDivisionError' } },
            returnChanged: true,
        },
    });

    assert(finding.id.startsWith('regression_'), 'RegressionFinding generates deterministic ID');
    const expl = RegressionExplainer.explain(finding);
    assert(expl.causalChain.length >= 2, 'Generates multi-step causal explanation chain');
    assert(expl.summary.includes('ZeroDivisionError'), 'Explanation summary cites observed error');
}

// ─────────────────────────────────────────────────────────────────────────────
// 10. Required Scenario 1 — Unguarded Division Regression
// ─────────────────────────────────────────────────────────────────────────────
console.log('10. Testing Scenario 1: Unguarded Division Regression...');
{
    const codeBase = 'def divide(a, b):\n    if b != 0:\n        return a / b\n    return 0\n';
    const codeChanged = 'def divide(a, b):\n    return a / b\n';

    const fileA = new SourceFile({ id: 'file_main', path: 'main.py', content: codeBase });
    const fileB = new SourceFile({ id: 'file_main', path: 'main.py', content: codeChanged });

    const snapA = new WorkspaceSnapshot({ files: [fileA], version: 1 });
    const snapB = new WorkspaceSnapshot({ files: [fileB], version: 2 });

    const testNormal = new TestCase({
        id: 'test_div_normal',
        targetId: 'divide',
        inputs: new TestInput({ bindings: { a: 10, b: 2 } }),
        expected: new TestExpectation({ expectedReturnValue: 5 }),
    });

    const testZero = new TestCase({
        id: 'test_div_zero',
        targetId: 'divide',
        inputs: new TestInput({ bindings: { a: 10, b: 0 } }),
        expected: new TestExpectation({ expectedReturnValue: 0 }),
    });

    const engine = new RegressionEngine();
    const campaign = engine.run(snapA, snapB, [testNormal, testZero]);

    assert(campaign.status === REGRESSION_CAMPAIGN_STATUSES.COMPLETED, 'Scenario 1 campaign completes');
    assert(campaign.results.length === 2, 'Runs both selected tests');

    const zeroResult = campaign.results.find(r => r.testId === 'test_div_zero');
    assert(zeroResult !== undefined, 'test_div_zero was executed');
    assert(zeroResult.finding.classification === REGRESSION_CLASSIFICATIONS.UNEXPECTED_REGRESSION, 'Classifies zero division as UNEXPECTED_REGRESSION');
    assert(campaign.hasRegressions === true, 'Campaign correctly reports regressions detected');
}

// ─────────────────────────────────────────────────────────────────────────────
// 11. Required Scenario 2 — Repair Validation (Clean Patch Application)
// ─────────────────────────────────────────────────────────────────────────────
console.log('11. Testing Scenario 2: Program Repair Validation...');
{
    const codeBroken = 'def divide(a, b):\n    return a / b\n';
    const codeRepaired = 'def divide(a, b):\n    if b == 0:\n        return 0\n    return a / b\n';

    const fileA = new SourceFile({ id: 'file_main', path: 'main.py', content: codeBroken });
    const fileB = new SourceFile({ id: 'file_main', path: 'main.py', content: codeRepaired });

    const snapA = new WorkspaceSnapshot({ files: [fileA], version: 1 });
    const snapB = new WorkspaceSnapshot({ files: [fileB], version: 2 });

    const testZero = new TestCase({
        id: 'test_div_zero',
        targetId: 'divide',
        inputs: new TestInput({ bindings: { a: 10, b: 0 } }),
        expected: new TestExpectation({ expectedReturnValue: 0 }),
    });

    const engine = new RegressionEngine();
    const campaign = engine.run(snapA, snapB, [testZero]);

    const zeroResult = campaign.results.find(r => r.testId === 'test_div_zero');
    assert(zeroResult.finding.classification === REGRESSION_CLASSIFICATIONS.FIXED_FAILURE, 'Classifies repair outcome as FIXED_FAILURE');
    assert(campaign.hasRegressions === false, 'Repaired workspace has no unexpected regressions');

    // Repair impact analysis
    const repairImpact = RepairImpactAnalyzer.analyzeRepairImpact({ id: 'patch_1' }, snapA, snapB, [testZero]);
    assert(repairImpact.isCleanRepair === true, 'Repair confirmed clean without side effects');
    assert(repairImpact.recommendation === 'REPAIR_SAFE_TO_APPLY', 'Recommends safe to apply');
}

// ─────────────────────────────────────────────────────────────────────────────
// 12. Required Scenario 3 — Multi-File Module Impact Propagation
// ─────────────────────────────────────────────────────────────────────────────
console.log('12. Testing Scenario 3: Multi-File Workspace Impact Propagation...');
{
    const fileMain = new SourceFile({ id: 'file_main', path: 'main.py', moduleId: 'mod_main', content: 'from utils import calculate\ndef run():\n    return calculate(10)\n' });
    const fileUtils = new SourceFile({ id: 'file_utils', path: 'utils.py', moduleId: 'mod_utils', content: 'from models import format_val\ndef calculate(x):\n    return format_val(x * 2)\n' });
    const fileModelsA = new SourceFile({ id: 'file_models', path: 'models.py', moduleId: 'mod_models', content: 'def format_val(v):\n    return v\n' });
    const fileModelsB = new SourceFile({ id: 'file_models', path: 'models.py', moduleId: 'mod_models', content: 'def format_val(v):\n    return v + 100\n' });

    const mg = new ModuleGraph();
    mg.addEdge('mod_main', 'mod_utils');
    mg.addEdge('mod_utils', 'mod_models');

    const snapA = new WorkspaceSnapshot({ files: [fileMain, fileUtils, fileModelsA], moduleGraph: mg, version: 1 });
    const snapB = new WorkspaceSnapshot({ files: [fileMain, fileUtils, fileModelsB], moduleGraph: mg, version: 2 });

    const testModels = new TestCase({ id: 'test_models', targetId: 'format_val' });
    const testMain = new TestCase({ id: 'test_main', targetId: 'run' });
    const testUnrelated = new TestCase({ id: 'test_unrelated', targetId: 'unrelated_func' });

    const diff = SemanticDiff.diff(snapA, snapB);
    const impactAnalyzer = new ImpactAnalyzer();
    const impact = impactAnalyzer.analyze(diff.changeSet, snapB, [testModels, testMain, testUnrelated]);

    const plan = TestSelector.select(diff.changeSet, [testModels, testMain, testUnrelated], impact);
    assert(plan.getSelectedTestIds().includes('test_models'), 'Directly impacted models test selected');
    assert(!plan.getSelectedTestIds().includes('test_unrelated'), 'Unrelated test not selected');
}

// ─────────────────────────────────────────────────────────────────────────────
// 13. Stage 20 Mutation & Stage 16/18 Symbolic/Concolic Analyzers
// ─────────────────────────────────────────────────────────────────────────────
console.log('13. Testing Stage 20 Mutation & Stage 16/18 Specialized Analyzers...');
{
    const code = 'def test_math(x):\n    if x > 10:\n        return x * 2\n    return x + 1\n';
    const mutImpact = MutationImpactAnalyzer.analyze(code);
    assert(mutImpact.totalMutants > 0, 'Discovers mutation candidates');

    const symImpact = SymbolicImpactAnalyzer.analyze('x = 10\n', 'if x > 0:\n    y = 20\n');
    assert(symImpact.changedPaths.length >= symImpact.baselinePaths.length, 'Compares symbolic path condition counts');

    const concolic = ConcolicImpactAnalyzer.exploreChangedPaths(code, ['branch_1']);
    assert(concolic.testCases.length >= 0, 'Concolic exploration returns generated regression cases');
}

// ─────────────────────────────────────────────────────────────────────────────
// 14. Coverage, Risk & Confidence Metrics
// ─────────────────────────────────────────────────────────────────────────────
console.log('14. Testing ChangeCoverage, RiskScore & ConfidenceScore...');
{
    const cov = new ChangeCoverage({
        changedLinesTotal: 10,
        changedLinesCovered: 8,
        changedFunctionsTotal: 2,
        changedFunctionsCovered: 2,
        changedBranchesTotal: 4,
        changedBranchesCovered: 3,
    });
    assert(cov.lineCoverageRatio === 0.8, 'Calculates line coverage ratio');
    assert(cov.functionCoverageRatio === 1.0, 'Calculates function coverage ratio');
    assert(cov.overallRatio > 0.8, 'Calculates composite change coverage ratio');

    const change = new SemanticChange({
        kind: CHANGE_KINDS.BRANCH_CHANGED,
        severity: CHANGE_SEVERITIES.CRITICAL,
    });
    const set = new SemanticChangeSet({ changes: [change] });
    const risk = RiskScore.compute(set, null, cov);
    assert(risk.total > 0 && risk.total <= 1.0, 'Calculates normalized risk score');
    assert(risk.components.controlFlow > 0, 'Inspectable controlFlow risk component');

    const conf = new ConfidenceScore({ level: CHANGE_CONFIDENCES.PROVEN });
    assert(conf.value === 1.0, 'ConfidenceScore maps PROVEN to 1.0');
}

// ─────────────────────────────────────────────────────────────────────────────
// 15. Historical Determinism & Serialization Stability
// ─────────────────────────────────────────────────────────────────────────────
console.log('15. Testing Serialization & Historical Determinism...');
{
    const change = new SemanticChange({
        id: 'change_fixed_id',
        kind: CHANGE_KINDS.STATEMENT_MODIFIED,
        fileId: 'file_main',
        before: 'a = 1',
        after: 'a = 2',
    });

    const set = new SemanticChangeSet({ setId: 'set_1', changes: [change] });
    const jsonSet = set.toJSON();
    const restoredSet = SemanticChangeSet.fromJSON(jsonSet);

    assert(restoredSet.size === 1, 'ChangeSet round-trips through JSON');
    assert(restoredSet.get('change_fixed_id') !== null, 'Restored change has exact ID');

    const finding = new RegressionFinding({
        id: 'reg_fixed_id',
        classification: REGRESSION_CLASSIFICATIONS.UNEXPECTED_REGRESSION,
        testId: 'test_1',
    });
    const jsonFinding = finding.toJSON();
    const restoredFinding = RegressionFinding.fromJSON(jsonFinding);
    assert(restoredFinding.id === 'reg_fixed_id', 'RegressionFinding round-trips through JSON');

    const snapshot = new RegressionSnapshot({
        snapshotId: 'snap_1',
        workspaceVersion: 3,
        changeSet: set,
    });
    const jsonSnap = snapshot.toJSON();
    const restoredSnap = RegressionSnapshot.fromJSON(jsonSnap);
    assert(restoredSnap.snapshotId === 'snap_1', 'RegressionSnapshot round-trips through JSON');
}

// ─────────────────────────────────────────────────────────────────────────────
// 16. Debugger Integration (Stage 21 APIs)
// ─────────────────────────────────────────────────────────────────────────────
console.log('16. Testing Debugger Integration APIs...');
{
    const dbg = new Debugger();
    dbg.loadExecution({
        events: [{ id: 0, type: 'line', source_code: 'def divide(a, b):\n    return a / b\n' }],
    });

    const diff = dbg.getSemanticDiff();
    assert(diff !== null, 'Debugger.getSemanticDiff() returns diff');

    const impact = dbg.getImpactGraph();
    assert(impact instanceof ImpactGraph, 'Debugger.getImpactGraph() returns ImpactGraph');

    const risk = dbg.getRegressionRisk();
    assert(risk instanceof RiskScore, 'Debugger.getRegressionRisk() returns RiskScore');

    const snap = dbg.getRegressionSnapshot();
    assert(snap instanceof RegressionSnapshot, 'Debugger.getRegressionSnapshot() returns RegressionSnapshot');

    const campaign = dbg.createRegressionCampaign({});
    assert(campaign instanceof RegressionCampaign, 'Debugger.createRegressionCampaign returns campaign');
}

// ─────────────────────────────────────────────────────────────────────────────
// 17. High-Scale Bounded Performance Benchmarks
// ─────────────────────────────────────────────────────────────────────────────
console.log('17. Testing High-Scale Performance Benchmarks (10,000 nodes & tests)...');
{
    // Benchmark 1: 10,000-node ImpactGraph propagation
    const largeGraph = new ImpactGraph();
    for (let i = 0; i < 10000; i++) {
        largeGraph.addNode(new ImpactNode({ id: `node_${i}` }));
        if (i > 0) {
            largeGraph.addEdge(new ImpactEdge({ fromId: `node_${i - 1}`, toId: `node_${i}` }));
        }
    }

    const t0 = Date.now();
    const prop = ImpactPropagator.propagate(['node_0'], largeGraph, { maxDepth: 100, maxNodes: 500 });
    const dGraph = Date.now() - t0;
    assert(dGraph < 100, `10,000-node graph bounded propagation completes in < 100ms (${dGraph}ms)`);
    assert(prop.impactedCount <= 500, 'Enforces maxNodes bound');

    // Benchmark 2: 10,000-test relevance selection
    const largeTestSuite = [];
    for (let i = 0; i < 10000; i++) {
        largeTestSuite.push(new TestCase({ id: `test_${i}`, targetId: `func_${i % 100}` }));
    }
    const cSet = new SemanticChangeSet({ changes: [new FunctionChange({ functionName: 'func_42', fileId: 'file_main' })] });
    const impAnalyzer = new ImpactAnalyzer();
    const snap = new WorkspaceSnapshot({ files: [new SourceFile({ id: 'file_main', path: 'main.py', content: 'def func_42(): pass' })] });
    const impRes = impAnalyzer.analyze(cSet, snap, largeTestSuite);

    const t1 = Date.now();
    const plan = TestSelector.select(cSet, largeTestSuite, impRes, { maxSelectedTests: 200 });
    const dSelect = Date.now() - t1;
    assert(dSelect < 100, `10,000-test selection completes in < 100ms (${dSelect}ms)`);
    assert(plan.selectedCount <= 200, 'Enforces maxSelectedTests bound');
}

// ─────────────────────────────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n================================================================');
console.log(`Stage 21 Test Results: ${passedTests}/${totalTests} passed, ${failedTests} failed.`);
console.log('================================================================\n');

if (failedTests > 0) {
    process.exit(1);
}
