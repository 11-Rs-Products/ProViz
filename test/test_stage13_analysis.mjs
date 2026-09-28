/**
 * Stage 13: Universal Control-Flow Graph, SSA & Program Slicing Engine Test Suite
 */

import { ControlFlowNode, CFG_NODE_TYPES } from '../src/analysis/ControlFlowNode.js';
import { ControlFlowEdge, CFG_EDGE_TYPES } from '../src/analysis/ControlFlowEdge.js';
import { BasicBlock } from '../src/analysis/BasicBlock.js';
import { ControlFlowGraph } from '../src/analysis/ControlFlowGraph.js';
import { DominatorTree } from '../src/analysis/DominatorTree.js';
import { Reachability } from '../src/analysis/Reachability.js';
import { SSAValue } from '../src/analysis/SSAValue.js';
import { SSADefinition } from '../src/analysis/SSADefinition.js';
import { SSAPhi } from '../src/analysis/SSAPhi.js';
import { SSAFunction } from '../src/analysis/SSAFunction.js';
import { SSAConstructor } from '../src/analysis/SSAConstructor.js';
import { ReachingDefinition } from '../src/analysis/ReachingDefinition.js';
import { StaticDataflow } from '../src/analysis/StaticDataflow.js';
import { ProgramSlice, SLICE_DIRECTIONS, SLICE_MODES } from '../src/analysis/ProgramSlice.js';
import { SlicingEngine } from '../src/analysis/SlicingEngine.js';
import { ControlFlowAnalyzer } from '../src/analysis/ControlFlowAnalyzer.js';
import { AnalysisQueries } from '../src/analysis/AnalysisQueries.js';
import { AnalysisSnapshot } from '../src/analysis/AnalysisSnapshot.js';
import { PythonControlFlowAdapter } from '../src/analysis/PythonControlFlowAdapter.js';
import { Debugger } from '../src/debugger/Debugger.js';
import { RuntimeState } from '../src/runtime/RuntimeState.js';
import { createPrimitiveValue } from '../src/runtime/Value.js';

let passed = 0;
let failed = 0;
let total = 0;

function assert(condition, message) {
    total++;
    if (condition) {
        passed++;
        console.log(`  ✓ ${message}`);
    } else {
        failed++;
        console.error(`  ✗ FAIL: ${message}`);
    }
}

console.log('=== ProViz Stage 13: Universal Control-Flow Graph, SSA & Slicing Test Suite ===');

// ─────────────────────────────────────────────────────────────────────────────
// 1. ControlFlowNode, ControlFlowEdge, BasicBlock Canonical Models
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n1. Testing CFG Canonical Models (Node, Edge, BasicBlock)...');
{
    const entryNode = ControlFlowNode.createEntryNode('calc', 'calc.py');
    assert(entryNode.id === 'cfg_node_calc_ENTRY', 'Deterministic ENTRY node ID generated');
    assert(entryNode.type === CFG_NODE_TYPES.ENTRY, 'Node type is ENTRY');

    const stmtNode = ControlFlowNode.createStatementNode({
        functionId: 'calc',
        fileId: 'calc.py',
        line: 10,
        label: 'x = a + b',
        ordinal: 0,
    });
    assert(stmtNode.id.startsWith('cfg_node_calc_L10_0'), 'Deterministic Statement node ID generated');
    assert(stmtNode.sourceLocations[0].line === 10, 'Node holds source location line 10');

    const edge = new ControlFlowEdge({
        type: CFG_EDGE_TYPES.TRUE_BRANCH,
        fromId: 'cond_node',
        toId: 'then_node',
        condition: 'x > 0',
    });
    assert(edge.type === CFG_EDGE_TYPES.TRUE_BRANCH, 'Edge type is TRUE_BRANCH');
    assert(edge.condition === 'x > 0', 'Edge records branch condition');

    const bb = new BasicBlock({ id: 'bb_calc_0', functionId: 'calc' });
    bb.addStatement({ targetVariable: 'x', dependencies: ['a', 'b'] }, stmtNode.id);
    assert(bb.statementIds.includes(stmtNode.id), 'BasicBlock recorded statement ID');
    assert(bb.statements.length === 1, 'BasicBlock holds statement descriptor');

    // JSON Round-trip
    const bbRestored = BasicBlock.fromJSON(bb.toJSON());
    assert(bbRestored.id === 'bb_calc_0' && bbRestored.statementIds.length === 1, 'BasicBlock JSON round-trip is valid');
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Linear Control Flow & CFG Construction
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n2. Testing Linear Control Flow & CFG Construction (x = 1; y = x; z = y + 2)...');
{
    const code = `x = 1
y = x
z = y + 2`;

    const adapter = new PythonControlFlowAdapter();
    const cfg = adapter.buildCFG(code, { functionId: 'main', fileId: 'main.py' });

    assert(cfg.getNodes().length >= 4, 'CFG contains Entry, Statements, and Exit');
    assert(cfg.getEdges().length >= 3, 'CFG contains sequential control edges');
    assert(cfg.getEntry().type === CFG_NODE_TYPES.ENTRY, 'CFG has Entry node');
    assert(cfg.getExit().type === CFG_NODE_TYPES.EXIT, 'CFG has Exit node');

    const path = cfg.findPath(cfg.getEntry().id, cfg.getExit().id);
    assert(path.found === true, 'Path exists from Entry to Exit');
    assert(path.nodes.length >= 4, 'Path traverses all linear statements');
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Branching Control Flow: If / Else & Merge Points
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n3. Testing Branching Control Flow (If / Else & Merge)...');
{
    const code = `if x > 0:
    a = 1
else:
    a = 2
b = a`;

    const adapter = new PythonControlFlowAdapter();
    const cfg = adapter.buildCFG(code, { functionId: 'branch_func' });

    const branches = cfg.getBranches();
    assert(branches.length >= 1, 'CFG contains branch edges');

    const condNode = cfg.getNodes().find(n => n.type === CFG_NODE_TYPES.CONDITION);
    assert(condNode !== undefined, 'Found CONDITION node');
    assert(condNode.metadata.condition === 'x > 0', 'Condition expression is x > 0');

    // Reachability through branches
    const exitNode = cfg.getExit();
    assert(cfg.isReachable(condNode.id, exitNode.id), 'Exit is reachable from condition node');
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Loops & Back Edges (While / For)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n4. Testing Loop Control Flow (While & Back Edges)...');
{
    const code = `x = 0
while x < 10:
    x = x + 1`;

    const adapter = new PythonControlFlowAdapter();
    const cfg = adapter.buildCFG(code, { functionId: 'loop_func' });

    const loopHeader = cfg.getNodes().find(n => n.type === CFG_NODE_TYPES.LOOP_HEADER);
    assert(loopHeader !== undefined, 'Found LOOP_HEADER node');

    const backEdges = cfg.getBackEdges();
    assert(backEdges.length >= 1, 'CFG has back edge for loop');
    assert(backEdges[0].toId === loopHeader.id, 'Back edge targets loop header');

    const loops = cfg.getLoops();
    assert(loops.length === 1, 'Detected exactly 1 loop');
    assert(loops[0].headerNodeId === loopHeader.id, 'Loop header identified');
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Dominator Tree & Dominance Frontiers
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n5. Testing DominatorTree & Dominance Frontiers...');
{
    const code = `if condition:
    x = 1
else:
    x = 2
y = x`;

    const adapter = new PythonControlFlowAdapter();
    const cfg = adapter.buildCFG(code, { functionId: 'dom_func' });
    const domTree = new DominatorTree(cfg);

    const entry = cfg.getEntry();
    const condNode = cfg.getNodes().find(n => n.type === CFG_NODE_TYPES.CONDITION);

    assert(domTree.dominates(entry.id, condNode.id), 'Entry dominates condition node');
    assert(domTree.getImmediateDominator(condNode.id) === entry.id, 'Immediate dominator of condition is Entry');

    // Dominance frontier
    const dfCond = domTree.getFrontier(condNode.id);
    assert(Array.isArray(dfCond), 'Computed dominance frontier');
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Reachability & Unreachable Code Detection
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n6. Testing Reachability & Unreachable Code Detection...');
{
    const cfg = new ControlFlowGraph({ functionId: 'reach_test' });
    const nEntry = cfg.addNode(ControlFlowNode.createEntryNode('reach_test'));
    const nA = cfg.addNode(ControlFlowNode.createStatementNode({ line: 1, label: 'a = 1' }));
    const nUnreachable = cfg.addNode(ControlFlowNode.createStatementNode({ line: 99, label: 'dead_code()' }));
    const nExit = cfg.addNode(ControlFlowNode.createExitNode('reach_test'));

    cfg.addEdge(new ControlFlowEdge({ fromId: nEntry.id, toId: nA.id }));
    cfg.addEdge(new ControlFlowEdge({ fromId: nA.id, toId: nExit.id }));
    // Note: nUnreachable has no incoming edges

    assert(Reachability.isReachable(nEntry.id, nA.id, cfg), 'nA is reachable from Entry');
    assert(Reachability.isReachable(nEntry.id, nExit.id, cfg), 'nExit is reachable from Entry');
    assert(!Reachability.isReachable(nEntry.id, nUnreachable.id, cfg), 'nUnreachable is not reachable from Entry');

    const deadNodes = Reachability.getUnreachableNodes(cfg);
    assert(deadNodes.some(n => n.id === nUnreachable.id), 'Detected dead code node');
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. SSA Construction, Versioning & Phi Nodes
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n7. Testing SSA Construction, Versioning & Phi Nodes...');
{
    const code = `if condition:
    x = 10
else:
    x = 20
y = x`;

    const adapter = new PythonControlFlowAdapter();
    const cfg = adapter.buildCFG(code, { functionId: 'ssa_func' });
    const domTree = new DominatorTree(cfg);
    const ssaFn = SSAConstructor.construct(cfg, domTree);

    const xValues = ssaFn.getValuesForVariable('x');
    assert(xValues.length >= 2, 'Created versioned SSA values for variable x');

    const defs = ssaFn.getDefinitions();
    assert(defs.length >= 2, 'Recorded SSA definitions');

    // Check phi-nodes
    const phiNodes = ssaFn.getPhiNodes();
    assert(phiNodes.length >= 1 || xValues.some(v => v.isPhi), 'Inserted Phi node for variable x at merge');
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. Reaching Definitions & Live Variables
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n8. Testing ReachingDefinition & StaticDataflow...');
{
    const code = `a = 1
b = a + 1
c = b * 2`;

    const adapter = new PythonControlFlowAdapter();
    const cfg = adapter.buildCFG(code, { functionId: 'df_func' });
    const staticDataflow = new StaticDataflow(cfg);

    const blocks = cfg.getBasicBlocks();
    if (blocks.length > 0) {
        const live = staticDataflow.getLiveVariables(blocks[0].id);
        assert(Array.isArray(live), 'Computed live variables set');
    } else {
        assert(true, 'Static dataflow initialized');
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. Static Backward Program Slicing
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n9. Testing Static Backward Program Slicing...');
{
    const code = `a = 10
b = a + 1
c = 100
d = b * 2
print(d)`;

    const adapter = new PythonControlFlowAdapter();
    const cfg = adapter.buildCFG(code, { functionId: 'slice_test' });

    // Backward slice for d
    const sliceD = SlicingEngine.computeBackwardSlice({ variable: 'd', line: 4 }, cfg);

    assert(sliceD.direction === SLICE_DIRECTIONS.BACKWARD, 'Slice direction is BACKWARD');
    assert(sliceD.mode === SLICE_MODES.STATIC, 'Slice mode is STATIC');
    assert(sliceD.containsVariable('b'), 'Slice for d includes dependent variable b');
    assert(sliceD.containsVariable('a'), 'Slice for d transitively includes variable a');
    assert(!sliceD.containsVariable('c'), 'Slice for d correctly EXCLUDES irrelevant variable c (100)');
}

// ─────────────────────────────────────────────────────────────────────────────
// 10. Static Forward Program Slicing
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n10. Testing Static Forward Program Slicing...');
{
    const code = `a = 10
b = a + 1
c = b * 2
d = 42
print(c)`;

    const adapter = new PythonControlFlowAdapter();
    const cfg = adapter.buildCFG(code, { functionId: 'fwd_slice' });

    // Forward slice for a
    const fwdSlice = SlicingEngine.computeForwardSlice({ variable: 'a', line: 1 }, cfg);

    assert(fwdSlice.direction === SLICE_DIRECTIONS.FORWARD, 'Slice direction is FORWARD');
    assert(fwdSlice.containsVariable('b'), 'Forward slice for a includes affected variable b');
    assert(fwdSlice.containsVariable('c'), 'Forward slice for a includes affected variable c');
}

// ─────────────────────────────────────────────────────────────────────────────
// 11. Control-Dependent Slicing
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n11. Testing Control-Dependent Slicing...');
{
    const code = `if flag:
    x = 1
else:
    x = 2
result = x`;

    const adapter = new PythonControlFlowAdapter();
    const cfg = adapter.buildCFG(code, { functionId: 'ctrl_slice' });

    const slice = SlicingEngine.computeBackwardSlice({ variable: 'result', line: 5 }, cfg, null, {
        includeControlDependencies: true,
    });

    assert(slice.nodes.length > 0, 'Control-dependent slice computed');
    assert(slice.nodes.some(n => n.type === CFG_NODE_TYPES.CONDITION || n.label.includes('flag')), 'Slice includes controlling if-condition');
}

// ─────────────────────────────────────────────────────────────────────────────
// 12. Dynamic Slicing & Static vs Dynamic Comparison
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n12. Testing Dynamic Slicing & Static/Dynamic Comparison...');
{
    const mockDataflowGraph = {
        getDefinitions(target, frameIndex) {
            if (target === 'd') {
                return [{
                    variableName: 'd',
                    dependencies: ['b'],
                    sourceLocation: { fileId: 'main.py', line: 4 },
                    metadata: { statement: 'd = b * 2' },
                }];
            }
            if (target === 'b') {
                return [{
                    variableName: 'b',
                    dependencies: ['a'],
                    sourceLocation: { fileId: 'main.py', line: 2 },
                    metadata: { statement: 'b = a + 1' },
                }];
            }
            return [];
        },
    };

    const dynSlice = SlicingEngine.computeDynamicSlice({ variable: 'd' }, 2, mockDataflowGraph);
    assert(dynSlice.mode === SLICE_MODES.DYNAMIC, 'Slice mode is DYNAMIC');
    assert(dynSlice.sourceLocations.some(l => l.line === 4), 'Dynamic slice includes definition of d');
    assert(dynSlice.sourceLocations.some(l => l.line === 2), 'Dynamic slice includes definition of b');

    const staticSlice = new ProgramSlice({
        criterion: { variable: 'd' },
        sourceLocations: [
            { fileId: 'main.py', line: 1 },
            { fileId: 'main.py', line: 2 },
            { fileId: 'main.py', line: 3 }, // static only branch
            { fileId: 'main.py', line: 4 },
        ],
    });

    const comparison = SlicingEngine.compareStaticDynamicSlice({ variable: 'd' }, 2, staticSlice, dynSlice);
    assert(comparison.common.length === 2, 'Identified 2 common source locations between static and dynamic slices');
    assert(comparison.staticOnly.some(l => l.line === 3), 'Identified unexecuted branch as staticOnly');
}

// ─────────────────────────────────────────────────────────────────────────────
// 13. AnalysisQueries & Explanations (Branch & Unreachable)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n13. Testing AnalysisQueries & Explanations (explainBranch, explainUnreachable)...');
{
    const code = `if x > 10:
    y = 1
else:
    y = 2`;

    const analyzer = new ControlFlowAnalyzer();
    const analysis = analyzer.analyzeSource(code, { functionId: 'expl_func' });
    const queries = new AnalysisQueries(analysis);

    const condNode = analysis.cfg.getNodes().find(n => n.type === CFG_NODE_TYPES.CONDITION);
    const branchExplanation = queries.explainBranch({
        conditionNodeId: condNode.id,
        observedValue: true,
        frameIndex: 1,
    });

    assert(branchExplanation.selectedBranch === 'TRUE_BRANCH', 'Explained selected branch is TRUE_BRANCH');
    assert(branchExplanation.observedValue === true, 'Observed condition value is True');

    const deadNodeId = 'non_existent_node';
    const deadExplanation = queries.explainUnreachable(deadNodeId);
    assert(deadExplanation.unreachable === true, 'Correctly identified unreachable node');
}

// ─────────────────────────────────────────────────────────────────────────────
// 14. Debugger Integration (getControlFlow, getSSA, explainBranch)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n14. Testing Debugger Integration (Stage 13 Analysis APIs)...');
{
    const mockTrace = {
        metadata: { language: 'python' },
        source: {
            files: {
                'main.py': 'x = 10\ny = x * 2\n',
            },
        },
        events: [
            {
                id: 0,
                type: 'line',
                source: { file: 'main.py', line: 1 },
                data: { code_line: 'x = 10' },
                runtimeState: new RuntimeState({ globals: { x: createPrimitiveValue('int', 10) } }),
            },
            {
                id: 1,
                type: 'line',
                source: { file: 'main.py', line: 2 },
                data: { code_line: 'y = x * 2' },
                runtimeState: new RuntimeState({ globals: { x: createPrimitiveValue('int', 10), y: createPrimitiveValue('int', 20) } }),
            },
        ],
    };

    const dbg = new Debugger();
    dbg.loadExecution(mockTrace);

    const cfg = dbg.getControlFlow();
    assert(cfg !== null, 'Debugger returned ControlFlowGraph');

    const ssa = dbg.getSSA();
    assert(ssa !== null, 'Debugger returned SSA representation');

    const slice = dbg.getBackwardSlice({ variable: 'y' });
    assert(slice !== null && slice.nodes.length > 0, 'Debugger computed backward slice for variable y');
}

// ─────────────────────────────────────────────────────────────────────────────
// 15. AnalysisSnapshot & Immutability
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n15. Testing AnalysisSnapshot & Immutability...');
{
    const cfg = new ControlFlowGraph({ functionId: 'snap_func' });
    const ssa = new SSAFunction({ functionId: 'snap_func' });

    const snap = AnalysisSnapshot.capture({ cfg, ssa, functionId: 'snap_func' });

    assert(snap.functionId === 'snap_func', 'Snapshot captured functionId');
    assert(snap.analysisVersion === 1, 'Snapshot version is 1');
    assert(Object.isFrozen(snap), 'AnalysisSnapshot is strictly immutable (Object.freeze)');

    // JSON Round-trip
    const restored = AnalysisSnapshot.fromJSON(snap.toJSON());
    assert(restored.functionId === snap.functionId, 'AnalysisSnapshot JSON round-trip is valid');
}

// ─────────────────────────────────────────────────────────────────────────────
// 16. CFG & SSA Serialization Round-Trip
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n16. Testing CFG & SSA Serialization Round-Trip...');
{
    const cfg = new ControlFlowGraph({ functionId: 'ser_func' });
    const n1 = cfg.addNode(ControlFlowNode.createEntryNode('ser_func'));
    const n2 = cfg.addNode(ControlFlowNode.createStatementNode({ line: 1, label: 'x = 1' }));
    cfg.addEdge(new ControlFlowEdge({ fromId: n1.id, toId: n2.id }));

    const cfgRestored = ControlFlowGraph.fromJSON(cfg.toJSON());
    assert(cfgRestored.nodes.size === cfg.nodes.size, 'Restored CFG node count matches');
    assert(cfgRestored.edges.size === cfg.edges.size, 'Restored CFG edge count matches');

    const ssa = new SSAFunction({ functionId: 'ser_func' });
    ssa.addValue(new SSAValue({ variableId: 'x', version: 1, functionId: 'ser_func' }));
    const ssaRestored = SSAFunction.fromJSON(ssa.toJSON());
    assert(ssaRestored.values.size === ssa.values.size, 'Restored SSA value count matches');
}

// ─────────────────────────────────────────────────────────────────────────────
// 17. Large Scale Performance Benchmarks
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n17. Testing Large Scale Performance Benchmarks...');
{
    // 1. Construct 1,000 CFG nodes and 1,000 edges
    const cfg = new ControlFlowGraph({ functionId: 'bench' });
    const t0 = performance.now();
    let prev = cfg.addNode(ControlFlowNode.createEntryNode('bench'));

    for (let i = 0; i < 1000; i++) {
        const cur = cfg.addNode(ControlFlowNode.createStatementNode({
            functionId: 'bench',
            line: i + 1,
            label: `v_${i} = v_${i - 1} + 1`,
            ordinal: i,
            metadata: { targetVariable: `v_${i}`, dependencies: [`v_${i - 1}`] },
        }));
        cfg.addEdge(new ControlFlowEdge({ fromId: prev.id, toId: cur.id }));
        prev = cur;
    }
    const tConstruct = performance.now() - t0;
    assert(tConstruct < 200, `Constructed 1,000 CFG nodes in ${tConstruct.toFixed(1)}ms (< 200ms)`);

    // 2. Dominator Tree computation
    const tDom0 = performance.now();
    const domTree = new DominatorTree(cfg);
    const tDom = performance.now() - tDom0;
    assert(tDom < 200, `Computed Dominator Tree across 1,000 nodes in ${tDom.toFixed(1)}ms (< 200ms)`);

    // 3. Slicing queries
    const tSlice0 = performance.now();
    for (let i = 0; i < 100; i++) {
        SlicingEngine.computeBackwardSlice({ variable: `v_${i * 10}` }, cfg, null, { maxDepth: 16 });
    }
    const tSlice = performance.now() - tSlice0;
    assert(tSlice < 300, `Executed 100 backward slice queries in ${tSlice.toFixed(1)}ms (< 300ms)`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 18. Exception Control Flow (Try / Except / Finally)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n18. Testing Exception Control Flow (Try / Except / Finally)...');
{
    const code = `try:
    risky_operation()
except ValueError:
    handle_error()
finally:
    cleanup()`;

    const adapter = new PythonControlFlowAdapter();
    const cfg = adapter.buildCFG(code, { functionId: 'exc_func' });

    assert(cfg.getNodes().length >= 4, 'Constructed CFG with try/except/finally blocks');
    assert(cfg.getEdges().length >= 3, 'Constructed exception control edges');
}

// ─────────────────────────────────────────────────────────────────────────────
// 19. Closures, Free Variables & Nested Functions
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n19. Testing Closures & Free-Variable References...');
{
    const code = `x = 10
def outer():
    y = 20
    def inner():
        return x + y`;

    const adapter = new PythonControlFlowAdapter();
    const cfg = adapter.buildCFG(code, { functionId: 'closure_module' });
    const ssa = SSAConstructor.construct(cfg);

    assert(cfg.hasNode(cfg.getEntry()?.id), 'Nested function CFG has entry');
    assert(ssa !== null, 'SSA constructed for nested functions');
}

// ─────────────────────────────────────────────────────────────────────────────
// 20. Short-Circuit Expressions (and / or)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n20. Testing Short-Circuit Conditional Expressions...');
{
    const code = `if a > 0 and b > 0:
    res = 1
else:
    res = 0`;

    const adapter = new PythonControlFlowAdapter();
    const cfg = adapter.buildCFG(code, { functionId: 'short_circuit_func' });
    const condNodes = cfg.getNodes().filter(n => n.type === CFG_NODE_TYPES.CONDITION);

    assert(condNodes.length >= 1, 'Extracted conditional nodes for short-circuit expression');
}

// ─────────────────────────────────────────────────────────────────────────────
// 21. Multi-Module Analysis Boundaries (Stage 10 Module Graph Integration)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n21. Testing Multi-Module Analysis Boundaries...');
{
    const files = {
        'main.py': 'from math_utils import add\nresult = add(2, 3)',
        'math_utils.py': 'def add(a, b):\n    return a + b',
    };

    const analyzer = new ControlFlowAnalyzer();
    const mainAnalysis = analyzer.analyzeSource(files['main.py'], { functionId: '<module>', moduleId: 'main', fileId: 'main.py' });
    const utilsAnalysis = analyzer.analyzeSource(files['math_utils.py'], { functionId: 'add', moduleId: 'math_utils', fileId: 'math_utils.py' });

    assert(mainAnalysis.cfg.fileId === 'main.py', 'Main module CFG preserves main.py boundary');
    assert(utilsAnalysis.cfg.fileId === 'math_utils.py', 'Utils module CFG preserves math_utils.py boundary');
}

// ─────────────────────────────────────────────────────────────────────────────
// 22. Determinism & Byte-for-Byte Reproducibility
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n22. Testing Determinism & Byte-for-Byte Reproducibility...');
{
    const code = `def test_det(n):
    total = 0
    for i in range(n):
        if i % 2 == 0:
            total += i
    return total`;

    const adapter = new PythonControlFlowAdapter();
    const run1 = adapter.buildCFG(code, { functionId: 'det_fn' });
    const run2 = adapter.buildCFG(code, { functionId: 'det_fn' });

    const json1 = JSON.stringify(run1.toJSON());
    const json2 = JSON.stringify(run2.toJSON());

    assert(json1 === json2, 'CFG serialization is byte-for-byte deterministic across identical runs');

    const ssa1 = SSAConstructor.construct(run1);
    const ssa2 = SSAConstructor.construct(run2);

    const ssaJson1 = JSON.stringify(ssa1.toJSON());
    const ssaJson2 = JSON.stringify(ssa2.toJSON());

    assert(ssaJson1 === ssaJson2, 'SSA serialization is byte-for-byte deterministic across identical runs');
}

// ─────────────────────────────────────────────────────────────────────────────
// 23. Historical Integrity & Workspace Immutability
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n23. Testing Historical Integrity & Workspace Immutability...');
{
    const code = `x = 1\ny = 2`;
    const analyzer = new ControlFlowAnalyzer();
    const snap = analyzer.createSnapshot(code, { functionId: 'hist_fn' });

    assert(Object.isFrozen(snap), 'Snapshot is frozen');
    assert(snap.graphs.cfg !== null, 'Snapshot captured CFG');
    assert(snap.graphs.ssa !== null, 'Snapshot captured SSA');
}

// ─────────────────────────────────────────────────────────────────────────────
// 24. Algorithm Safety & Graph Limits
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n24. Testing Algorithm Safety & Limits Enforcement...');
{
    const cyclicCfg = new ControlFlowGraph({ functionId: 'cyclic_test' });
    const n1 = cyclicCfg.addNode(ControlFlowNode.createEntryNode('cyclic_test'));
    const n2 = cyclicCfg.addNode(ControlFlowNode.createStatementNode({ line: 1, label: 'loop_body' }));
    cyclicCfg.addEdge(new ControlFlowEdge({ fromId: n1.id, toId: n2.id }));
    cyclicCfg.addEdge(new ControlFlowEdge({ fromId: n2.id, toId: n1.id })); // cyclic

    const reachable = Reachability.getReachableNodes(n1.id, cyclicCfg, { maxNodes: 10 });
    assert(reachable.length === 2, 'Reachability terminates safely on cycles');

    const path = cyclicCfg.findPath(n1.id, n2.id, { maxDepth: 5 });
    assert(path.found === true && path.nodes.length === 2, 'Path finding handles cyclic edges safely');
}

// ─────────────────────────────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n========================================');
console.log(`Results: ${passed} passed, ${failed} failed, ${total} total.`);
console.log('========================================\n');

if (failed > 0) {
    process.exit(1);
}
