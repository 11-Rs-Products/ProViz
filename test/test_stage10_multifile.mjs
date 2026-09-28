/**
 * ProViz — Stage 10 Test Suite: Universal Multi-File & Module Debugging Architecture
 *
 * Validates:
 *  1. SourceFile abstraction (stability, versioning, path/basename, serialization)
 *  2. SourceLocation coordinates (fileId, moduleId, path, line, column, matching)
 *  3. Module & ModuleGraph (directed dependencies, reverse dependents, cycle safety, shortest import path, topological sort)
 *  4. Workspace & WorkspaceSnapshot (versioning, immutable snapshots, historical trace integrity)
 *  5. TraceSource & TraceModule (source coordinate metadata, module event tracking)
 *  6. ExecutionRequest multi-file support (fromCode, fromWorkspace, options)
 *  7. Backward compatibility for single-file UET traces
 *  8. Multi-file execution trace simulation & cross-file call stacks (main -> utils -> models)
 *  9. Multi-file breakpoints (file-aware isolation: utils.py:10 does not hit main.py:10)
 * 10. Module scopes & independent namespaces
 * 11. Cross-module heap object identity invariant (shared heap object retains single ID obj_1)
 * 12. SourceMap bidirectional indexing (frame -> location, file:line -> frames)
 * 13. ModuleDebugger orchestrator (getCurrentFile, getCurrentModule, getModuleFrames, getBreakpointsForFile)
 * 14. EditorDebuggerAdapter multi-file navigation & onFileSwitch callbacks
 * 15. SceneGraph & ObjectInspector module metadata integration
 * 16. Unified global timeline & bidirectional cross-file playback
 * 17. Layout and Animation integration with multi-file frames
 * 18. Large workspace and trace performance benchmarks (1,000 files, 10,000 events)
 */

import { SourceFile } from '../src/workspace/SourceFile.js';
import { SourceLocation } from '../src/workspace/SourceLocation.js';
import { Module } from '../src/workspace/Module.js';
import { ModuleGraph } from '../src/workspace/ModuleGraph.js';
import { Workspace } from '../src/workspace/Workspace.js';
import { WorkspaceSnapshot } from '../src/workspace/WorkspaceSnapshot.js';
import { TraceSource } from '../src/trace/TraceSource.js';
import { TraceModule } from '../src/trace/TraceModule.js';
import { ExecutionRequest, createExecutionRequest } from '../src/trace/ExecutionRequest.js';
import { createExecutionTrace, createTraceEvent } from '../src/trace/TraceSchema.js';
import { Breakpoint } from '../src/debugger/Breakpoint.js';
import { Debugger } from '../src/debugger/Debugger.js';
import { DebuggerState } from '../src/debugger/DebuggerState.js';
import { SourceMap } from '../src/debugger/SourceMap.js';
import { ModuleDebugger } from '../src/debugger/ModuleDebugger.js';
import { EditorDebuggerAdapter } from '../src/debugger/EditorDebuggerAdapter.js';
import { PlaybackEngine } from '../src/PlaybackEngine.js';
import { ObjectInspector } from '../src/inspector/ObjectInspector.js';
import { SceneBuilder } from '../src/scene/SceneBuilder.js';
import { NODE_TYPES } from '../src/scene/SceneNode.js';
import { LayoutEngine } from '../src/layout/LayoutEngine.js';
import { AnimationRuntime } from '../src/animation/AnimationRuntime.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
    if (condition) {
        console.log(`  ✓ ${message}`);
        passed++;
    } else {
        console.error(`  ✗ FAIL: ${message}`);
        failed++;
    }
}

console.log('=== ProViz Stage 10: Universal Multi-File & Module Debugging Test Suite ===\n');

// ─────────────────────────────────────────────────────────────────────────────
// 1. SourceFile Abstraction
// ─────────────────────────────────────────────────────────────────────────────
console.log('1. Testing SourceFile Abstraction...');
{
    const file = new SourceFile({
        id: 'file_main',
        path: 'src/main.py',
        language: 'python',
        content: 'import utils\nx = utils.add(1, 2)\nprint(x)',
        moduleId: 'module_main',
        metadata: { author: 'dev' },
    });

    assert(file.id === 'file_main', 'File ID is preserved');
    assert(file.name === 'main.py', 'File name extracted from path');
    assert(file.path === 'src/main.py', 'File path is preserved');
    assert(file.lineCount === 3, 'Line count is 3');
    assert(file.getLine(2) === 'x = utils.add(1, 2)', 'getLine(2) returns correct content');
    assert(file.version === 1, 'Initial version is 1');

    file.updateContent('import utils\nx = utils.add(3, 4)\nprint(x)\n# comment');
    assert(file.version === 2, 'Version increments to 2 after updateContent');
    assert(file.lineCount === 4, 'Line count updated to 4');

    const cloned = file.clone();
    assert(cloned.equals(file), 'Cloned SourceFile equals original');
    assert(cloned !== file, 'Cloned SourceFile is a distinct instance');

    const json = file.toJSON();
    const fromJson = SourceFile.fromJSON(json);
    assert(fromJson.equals(file), 'SourceFile JSON round-trip is valid');
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. SourceLocation Coordinates
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n2. Testing SourceLocation Coordinates...');
{
    const loc1 = new SourceLocation({
        fileId: 'file_utils',
        moduleId: 'module_utils',
        path: 'src/utils.py',
        line: 14,
        column: 4,
    });

    assert(loc1.fileId === 'file_utils', 'fileId preserved');
    assert(loc1.moduleId === 'module_utils', 'moduleId preserved');
    assert(loc1.path === 'src/utils.py', 'path preserved');
    assert(loc1.file === 'src/utils.py', 'file alias returns path');
    assert(loc1.line === 14, 'line is 14');
    assert(loc1.column === 4, 'column is 4');
    assert(loc1.toString() === 'src/utils.py:14:4', 'toString format matches expected');

    // Matching tests
    assert(loc1.matches('src/utils.py', 14), 'Matches exact path and line');
    assert(loc1.matches('utils.py', 14), 'Matches basename and line');
    assert(loc1.matches('file_utils', 14), 'Matches fileId and line');
    assert(!loc1.matches('src/main.py', 14), 'Does not match different path');
    assert(!loc1.matches('src/utils.py', 15), 'Does not match different line');

    const loc2 = SourceLocation.from({ file: 'src/utils.py', line: 14, column: 4, fileId: 'file_utils', moduleId: 'module_utils' });
    assert(loc1.equals(loc2), 'SourceLocation.from produces identical coordinate');
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Module Abstraction
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n3. Testing Module Abstraction...');
{
    const mod = new Module({
        id: 'module_utils',
        name: 'utils',
        path: 'src/utils.py',
        language: 'python',
        fileIds: ['file_utils'],
        imports: ['module_models'],
        exports: ['calculate', 'format_data'],
    });

    assert(mod.id === 'module_utils', 'Module ID preserved');
    assert(mod.name === 'utils', 'Module name preserved');
    assert(mod.fileIds.includes('file_utils'), 'fileIds includes file_utils');
    assert(mod.imports.includes('module_models'), 'imports includes module_models');
    assert(mod.exports.includes('calculate'), 'exports includes calculate');

    mod.addImport('module_helpers');
    assert(mod.imports.includes('module_helpers'), 'addImport added module_helpers');
    mod.removeImport('module_helpers');
    assert(!mod.imports.includes('module_helpers'), 'removeImport removed module_helpers');

    const clonedMod = mod.clone();
    assert(clonedMod.equals(mod), 'Cloned module equals original');
    const jsonMod = Module.fromJSON(mod.toJSON());
    assert(jsonMod.equals(mod), 'Module JSON round-trip is valid');
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. ModuleGraph & Cycle-Safe Dependency Resolution
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n4. Testing ModuleGraph & Cycle Safety...');
{
    const graph = new ModuleGraph();
    const modA = new Module({ id: 'mod_a', name: 'a' });
    const modB = new Module({ id: 'mod_b', name: 'b' });
    const modC = new Module({ id: 'mod_c', name: 'c' });
    const modD = new Module({ id: 'mod_d', name: 'd' });

    graph.addModule(modA);
    graph.addModule(modB);
    graph.addModule(modC);
    graph.addModule(modD);

    // DAG: A -> B -> C, A -> D
    graph.addDependency('mod_a', 'mod_b');
    graph.addDependency('mod_b', 'mod_c');
    graph.addDependency('mod_a', 'mod_d');

    assert(graph.getDependencies('mod_a').includes('mod_b'), 'mod_a imports mod_b');
    assert(graph.getDependencies('mod_a').includes('mod_d'), 'mod_a imports mod_d');
    assert(graph.getDependents('mod_c').includes('mod_b'), 'mod_c imported by mod_b');
    assert(graph.getDependents('mod_b').includes('mod_a'), 'mod_b imported by mod_a');

    const pathAC = graph.getImportPath('mod_a', 'mod_c');
    assert(pathAC && pathAC.join(' -> ') === 'mod_a -> mod_b -> mod_c', 'Shortest import path A -> C is A -> B -> C');

    assert(!graph.hasCycles(), 'Graph has no cycles initially');

    // Introduce cycle: C -> A (A -> B -> C -> A)
    graph.addDependency('mod_c', 'mod_a');
    assert(graph.hasCycles(), 'Cycle detected after adding C -> A');
    const cycles = graph.findCycles();
    assert(cycles.length > 0, 'findCycles identified the cycle');

    // Cycle safety test: BFS traversal must not hang or throw
    const connected = graph.getConnectedModules('mod_a');
    assert(connected.length === 4, 'Cycle-safe getConnectedModules traversed all 4 nodes');
    const topo = graph.getTopologicalOrder();
    assert(topo.length === 4, 'Cycle-safe getTopologicalOrder returned all 4 nodes');

    // JSON round-trip
    const clonedGraph = ModuleGraph.fromJSON(graph.toJSON());
    assert(clonedGraph.hasModule('mod_a') && clonedGraph.hasCycles(), 'ModuleGraph JSON round-trip is valid');
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Workspace CRUD & Versioning
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n5. Testing Workspace CRUD & Versioning...');
{
    const ws = new Workspace({ id: 'ws_demo' });
    assert(ws.version === 1, 'Initial workspace version is 1');

    const f1 = ws.addFile({ id: 'file_main', path: 'main.py', content: 'x = 1', moduleId: 'mod_main' });
    const f2 = ws.addFile({ id: 'file_utils', path: 'utils.py', content: 'def f(): pass', moduleId: 'mod_utils' });

    assert(ws.hasFile('file_main'), 'Workspace has file_main');
    assert(ws.getFile('file_main') === f1, 'Lookup by file ID works');
    assert(ws.getFileByPath('utils.py') === f2, 'Lookup by file path works');
    assert(ws.getFiles().length === 2, 'Workspace contains 2 files');
    assert(ws.getModules().length === 2, 'Auto-registered 2 modules');

    // Update file
    ws.updateFile('file_main', 'x = 2\ny = 3');
    assert(ws.version === 2, 'Workspace version incremented to 2 after updateFile');
    assert(ws.getFile('file_main').content === 'x = 2\ny = 3', 'File content updated');

    // Snapshot creation
    const snapshot1 = ws.createSnapshot();
    assert(snapshot1.version === 2, 'Snapshot captures version 2');
    assert(snapshot1.getFile('file_main').content === 'x = 2\ny = 3', 'Snapshot captures current file content');

    // Historical trace integrity: Edit workspace after snapshot
    ws.updateFile('file_main', 'x = 999');
    assert(ws.version === 3, 'Workspace version incremented to 3');
    assert(ws.getFile('file_main').content === 'x = 999', 'Workspace has new content');
    assert(snapshot1.getFile('file_main').content === 'x = 2\ny = 3', 'Historical snapshot preserved old content (IMMUTABLE)');
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. TraceSource & TraceModule
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n6. Testing TraceSource & TraceModule...');
{
    const ts = new TraceSource({
        fileId: 'file_calc',
        moduleId: 'module_calc',
        path: 'calc.py',
        line: 42,
        column: 8,
    });

    assert(ts.fileId === 'file_calc', 'TraceSource fileId preserved');
    assert(ts.line === 42, 'TraceSource line is 42');
    const loc = ts.toSourceLocation();
    assert(loc instanceof SourceLocation && loc.line === 42, 'toSourceLocation returned valid SourceLocation');

    const tm = new TraceModule({
        moduleId: 'module_calc',
        name: 'calc',
        fileIds: ['file_calc'],
    });
    tm.recordEvent(10);
    tm.recordEvent(25);
    tm.recordEvent(5);

    assert(tm.entryEventId === 5, 'TraceModule entryEventId is 5 (minimum)');
    assert(tm.exitEventId === 25, 'TraceModule exitEventId is 25 (maximum)');
    assert(tm.eventIds.length === 3, 'TraceModule recorded 3 events');
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. ExecutionRequest Multi-File & Factories
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n7. Testing ExecutionRequest Multi-File & Factories...');
{
    // fromCode (backward compatible)
    const req1 = ExecutionRequest.fromCode('print("hello")');
    assert(req1.getMainCode() === 'print("hello")', 'fromCode sets main code');
    assert(req1.entrypoint === 'main.py', 'fromCode default entrypoint is main.py');

    // fromWorkspace
    const ws = Workspace.fromFiles({
        'src/main.py': 'import utils\nutils.run()',
        'src/utils.py': 'def run(): print("ok")',
    });
    const req2 = ExecutionRequest.fromWorkspace(ws, 'file_src_main_py');
    assert(req2.entrypoint === 'src/main.py', 'fromWorkspace resolved entrypoint path');
    assert(req2.files['src/utils.py'] === 'def run(): print("ok")', 'fromWorkspace populated all files');
    assert(req2.workspaceSnapshot instanceof WorkspaceSnapshot, 'ExecutionRequest attached WorkspaceSnapshot');
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. Backward Compatibility: Single-File Legacy Trace
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n8. Testing Backward Compatibility with Single-File Traces...');
{
    const legacyTrace = createExecutionTrace({
        source: { entrypoint: 'main.py', files: { 'main.py': 'x = 10\ny = 20' } },
        events: [
            createTraceEvent({
                id: 0,
                type: 'program_start',
                source: { file: 'main.py', line: 1 },
                scope: { function: '<module>', depth: 1 },
            }),
            createTraceEvent({
                id: 1,
                type: 'line',
                source: { file: 'main.py', line: 1 },
                scope: { function: '<module>', depth: 1 },
                data: { locals: { x: { kind: 'primitive', type: 'int', value: 10 } } },
            }),
            createTraceEvent({
                id: 2,
                type: 'line',
                source: { file: 'main.py', line: 2 },
                scope: { function: '<module>', depth: 1 },
                data: { locals: { x: { kind: 'primitive', type: 'int', value: 10 }, y: { kind: 'primitive', type: 'int', value: 20 } } },
            }),
            createTraceEvent({
                id: 3,
                type: 'program_end',
                source: { file: 'main.py', line: null },
                scope: { function: '<module>', depth: 0 },
            }),
        ],
    });

    const dbg = new Debugger();
    const state = dbg.loadExecution(legacyTrace);
    assert(state.totalFrames > 0, 'Legacy trace loaded frames');
    assert(state.sourceLocation.file === 'main.py', 'Legacy trace file is main.py');
    assert(dbg.stepForward().sourceLocation.line === 2, 'Stepped forward in single-file trace');
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. Multi-File Execution & Cross-File Call Stack (main -> utils -> models)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n9. Testing Multi-File Execution & Cross-File Calls...');
{
    const ws = new Workspace({ id: 'ws_crossfile' });
    const fMain = ws.addFile({ id: 'f_main', path: 'main.py', content: 'import utils\nres = utils.calc(5)', moduleId: 'm_main' });
    const fUtils = ws.addFile({ id: 'f_utils', path: 'utils.py', content: 'import models\ndef calc(v):\n  return models.double(v)', moduleId: 'm_utils' });
    const fModels = ws.addFile({ id: 'f_models', path: 'models.py', content: 'def double(x):\n  return x * 2', moduleId: 'm_models' });

    ws.getModuleGraph().addDependency('m_main', 'm_utils');
    ws.getModuleGraph().addDependency('m_utils', 'm_models');

    const multiFileTrace = createExecutionTrace({
        source: { entrypoint: 'main.py', files: { 'main.py': fMain.content, 'utils.py': fUtils.content, 'models.py': fModels.content } },
        events: [
            createTraceEvent({
                id: 0,
                type: 'program_start',
                source: { file: 'main.py', path: 'main.py', fileId: 'f_main', moduleId: 'm_main', line: 1 },
                scope: { function: '<module>', depth: 1 },
            }),
            createTraceEvent({
                id: 1,
                type: 'line',
                source: { file: 'main.py', path: 'main.py', fileId: 'f_main', moduleId: 'm_main', line: 2 },
                scope: { function: '<module>', depth: 1 },
            }),
            createTraceEvent({
                id: 2,
                type: 'call',
                source: { file: 'utils.py', path: 'utils.py', fileId: 'f_utils', moduleId: 'm_utils', line: 2 },
                scope: { function: 'calc', depth: 2 },
                data: { locals: { v: { kind: 'primitive', type: 'int', value: 5 } } },
            }),
            createTraceEvent({
                id: 3,
                type: 'line',
                source: { file: 'utils.py', path: 'utils.py', fileId: 'f_utils', moduleId: 'm_utils', line: 3 },
                scope: { function: 'calc', depth: 2 },
                data: { locals: { v: { kind: 'primitive', type: 'int', value: 5 } } },
            }),
            createTraceEvent({
                id: 4,
                type: 'call',
                source: { file: 'models.py', path: 'models.py', fileId: 'f_models', moduleId: 'm_models', line: 1 },
                scope: { function: 'double', depth: 3 },
                data: { locals: { x: { kind: 'primitive', type: 'int', value: 5 } } },
            }),
            createTraceEvent({
                id: 5,
                type: 'line',
                source: { file: 'models.py', path: 'models.py', fileId: 'f_models', moduleId: 'm_models', line: 2 },
                scope: { function: 'double', depth: 3 },
                data: { locals: { x: { kind: 'primitive', type: 'int', value: 5 } } },
            }),
            createTraceEvent({
                id: 6,
                type: 'return',
                source: { file: 'models.py', path: 'models.py', fileId: 'f_models', moduleId: 'm_models', line: 2 },
                scope: { function: 'double', depth: 3 },
                data: { return_value: { kind: 'primitive', type: 'int', value: 10 } },
            }),
            createTraceEvent({
                id: 7,
                type: 'return',
                source: { file: 'utils.py', path: 'utils.py', fileId: 'f_utils', moduleId: 'm_utils', line: 3 },
                scope: { function: 'calc', depth: 2 },
                data: { return_value: { kind: 'primitive', type: 'int', value: 10 } },
            }),
            createTraceEvent({
                id: 8,
                type: 'line',
                source: { file: 'main.py', path: 'main.py', fileId: 'f_main', moduleId: 'm_main', line: 2 },
                scope: { function: '<module>', depth: 1 },
                data: { locals: { res: { kind: 'primitive', type: 'int', value: 10 } } },
            }),
            createTraceEvent({
                id: 9,
                type: 'program_end',
                source: { file: 'main.py', path: 'main.py', fileId: 'f_main', moduleId: 'm_main', line: null },
                scope: { function: '<module>', depth: 0 },
            }),
        ],
    });

    const mDbg = new ModuleDebugger({ workspace: ws });
    mDbg.loadExecution(multiFileTrace);

    assert(mDbg.getCurrentFile().name === 'main.py', 'Initial frame is in main.py');
    assert(mDbg.getCurrentModule().id === 'm_main', 'Initial module is m_main');

    // Step to utils.py: calc
    mDbg.stepForward(); // line 2 main.py
    mDbg.stepForward(); // call utils.py
    assert(mDbg.getCurrentFile().name === 'utils.py', 'Stepped into utils.py');
    assert(mDbg.getCurrentModule().id === 'm_utils', 'Current module is m_utils');

    // Step to models.py: double
    mDbg.stepForward(); // line 3 utils.py
    mDbg.stepForward(); // call models.py
    assert(mDbg.getCurrentFile().name === 'models.py', 'Stepped into models.py');
    assert(mDbg.getCurrentModule().id === 'm_models', 'Current module is m_models');

    // Check 3-level cross-file call stack
    const stack = mDbg.getCallStack();
    assert(stack.length === 3, 'Call stack depth is 3');
    assert(stack[0].file === 'main.py', 'Stack level 0 is main.py');
    assert(stack[1].file === 'utils.py', 'Stack level 1 is utils.py');
    assert(stack[2].file === 'models.py', 'Stack level 2 is models.py');

    // Return transitions back to main.py
    mDbg.stepForward(); // line 2 models.py
    mDbg.stepForward(); // return models.py
    mDbg.stepForward(); // return utils.py
    mDbg.stepForward(); // line 2 main.py with res=10
    assert(mDbg.getCurrentFile().name === 'main.py', 'Returned back to main.py');
    assert(mDbg.debugger.getDebuggerState().activeLocals.res?.value === 10, 'res is 10 in main.py scope');
}

// ─────────────────────────────────────────────────────────────────────────────
// 10. Multi-File Breakpoints & Isolation
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n10. Testing Multi-File Breakpoints & Isolation...');
{
    const ws = Workspace.fromFiles({
        'main.py': 'import utils\nline2 = 1\nline3 = 2',
        'utils.py': 'def helper():\n  line2 = 100\n  line3 = 200',
    });

    const trace = createExecutionTrace({
        source: { entrypoint: 'main.py', files: { 'main.py': ws.getFileByPath('main.py').content, 'utils.py': ws.getFileByPath('utils.py').content } },
        events: [
            createTraceEvent({ id: 0, type: 'program_start', source: { file: 'main.py', line: 1 } }),
            createTraceEvent({ id: 1, type: 'line', source: { file: 'main.py', line: 2 } }),
            createTraceEvent({ id: 2, type: 'line', source: { file: 'main.py', line: 3 } }),
            createTraceEvent({ id: 3, type: 'call', source: { file: 'utils.py', line: 1 }, scope: { function: 'helper', depth: 2 } }),
            createTraceEvent({ id: 4, type: 'line', source: { file: 'utils.py', line: 2 }, scope: { function: 'helper', depth: 2 } }),
            createTraceEvent({ id: 5, type: 'line', source: { file: 'utils.py', line: 3 }, scope: { function: 'helper', depth: 2 } }),
            createTraceEvent({ id: 6, type: 'return', source: { file: 'utils.py', line: 3 }, scope: { function: 'helper', depth: 2 } }),
            createTraceEvent({ id: 7, type: 'program_end', source: { file: 'main.py', line: null } }),
        ],
    });

    const mDbg = new ModuleDebugger({ workspace: ws });
    mDbg.loadExecution(trace);

    // Set breakpoint specifically on utils.py line 2
    mDbg.addFileBreakpoint('utils.py', 2);

    assert(mDbg.getBreakpointsForFile('utils.py').length === 1, 'utils.py has 1 breakpoint');
    assert(mDbg.getBreakpointsForFile('main.py').length === 0, 'main.py has 0 breakpoints');

    // Continue execution from start
    mDbg.continue();

    const currentLoc = mDbg.getCurrentLocation();
    assert(currentLoc.file.endsWith('utils.py') && currentLoc.line === 2, 'Debugger paused on utils.py:2 (NOT main.py:2)');
    assert(mDbg.getDebuggerState().reason === 'breakpoint', 'Pause reason is breakpoint');
}

// ─────────────────────────────────────────────────────────────────────────────
// 11. Cross-Module Heap Object Identity Invariant
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n11. Testing Cross-Module Heap Object Identity Invariant...');
{
    // Object obj_1 is created in mod_a and referenced in mod_b
    const trace = createExecutionTrace({
        events: [
            createTraceEvent({
                id: 0,
                type: 'line',
                source: { file: 'a.py', path: 'a.py', fileId: 'file_a', moduleId: 'mod_a', line: 1 },
                data: {
                    locals: { shared_list: { kind: 'reference', type: 'list', objectId: 'obj_1' } },
                    heap: { obj_1: { id: 'obj_1', type: 'list', elements: [{ kind: 'primitive', type: 'int', value: 42 }] } },
                },
            }),
            createTraceEvent({
                id: 1,
                type: 'call',
                source: { file: 'b.py', path: 'b.py', fileId: 'file_b', moduleId: 'mod_b', line: 1 },
                scope: { function: 'process', depth: 2 },
                data: {
                    locals: { items: { kind: 'reference', type: 'list', objectId: 'obj_1' } },
                    heap: { obj_1: { id: 'obj_1', type: 'list', elements: [{ kind: 'primitive', type: 'int', value: 42 }] } },
                },
            }),
        ],
    });

    const playback = new PlaybackEngine();
    playback.setFrames(trace);
    playback.jumpTo(1);

    const runtimeState = playback.getCurrentRuntimeState();
    const heap = runtimeState.heap;
    const obj = heap.getObject('obj_1');

    assert(obj !== null, 'Shared heap object obj_1 exists');
    assert(obj.id === 'obj_1', 'Heap object ID is clean obj_1 without embedded file path');
    assert(heap.getAllObjects().length === 1, 'Only 1 singular heap object exists across both modules');

    // Verify SceneGraph preserves singular heap node
    const scene = playback.getCurrentScene();
    const objNodes = scene.getAllNodes().filter(n => n.type === NODE_TYPES.OBJECT);
    assert(objNodes.length === 1, 'SceneGraph has exactly 1 OBJECT node for obj_1');
    assert(objNodes[0].semanticId === 'obj_1', 'SceneNode semanticId is obj_1');
}

// ─────────────────────────────────────────────────────────────────────────────
// 12. SourceMap Bidirectional Indexing
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n12. Testing SourceMap Bidirectional Indexing...');
{
    const ws = Workspace.fromFiles({
        'main.py': 'x = 1\ny = 2',
        'utils.py': 'def f():\n  pass',
    });
    const snapshot = ws.createSnapshot();

    const trace = createExecutionTrace({
        events: [
            createTraceEvent({ id: 0, type: 'line', source: { file: 'main.py', line: 1 } }),
            createTraceEvent({ id: 1, type: 'line', source: { file: 'main.py', line: 2 } }),
            createTraceEvent({ id: 2, type: 'call', source: { file: 'utils.py', line: 1 }, scope: { function: 'f', depth: 2 } }),
            createTraceEvent({ id: 3, type: 'line', source: { file: 'utils.py', line: 2 }, scope: { function: 'f', depth: 2 } }),
        ],
    });

    const sm = new SourceMap({ workspaceSnapshot: snapshot, uetTrace: trace });

    const locFrame0 = sm.getFrameLocation(0);
    assert(locFrame0.file.endsWith('main.py') && locFrame0.line === 1, 'Frame 0 maps to main.py:1');

    const locFrame2 = sm.getFrameLocation(2);
    assert(locFrame2.file.endsWith('utils.py') && locFrame2.line === 1, 'Frame 2 maps to utils.py:1');

    const mainFrames = sm.getFramesForFile('main.py');
    assert(mainFrames.length === 2 && mainFrames[0] === 0 && mainFrames[1] === 1, 'getFramesForFile(main.py) returns [0, 1]');

    const utilsFrames = sm.getFramesForLine('utils.py', 2);
    assert(utilsFrames.length === 1 && utilsFrames[0] === 3, 'getFramesForLine(utils.py, 2) returns [3]');
}

// ─────────────────────────────────────────────────────────────────────────────
// 13. EditorDebuggerAdapter Multi-File Switching
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n13. Testing EditorDebuggerAdapter Multi-File Navigation...');
{
    const dbg = new Debugger();
    let switchedFile = null;
    let highlightedLine = null;
    let highlightedFile = null;

    const adapter = new EditorDebuggerAdapter({
        debuggerInstance: dbg,
        onFileSwitch: (file, fileId) => {
            switchedFile = file;
        },
        highlightFn: (line, file, fileId) => {
            highlightedLine = line;
            highlightedFile = file;
        },
    });

    const trace = createExecutionTrace({
        events: [
            createTraceEvent({ id: 0, type: 'line', source: { file: 'main.py', line: 10 } }),
            createTraceEvent({ id: 1, type: 'line', source: { file: 'services.py', line: 55 } }),
        ],
    });

    dbg.loadExecution(trace);
    assert(highlightedFile === 'main.py' && highlightedLine === 10, 'Initial highlight on main.py:10');

    dbg.stepForward();
    assert(switchedFile === 'services.py', 'onFileSwitch triggered for services.py');
    assert(highlightedFile === 'services.py' && highlightedLine === 55, 'Highlight moved to services.py:55');
}

// ─────────────────────────────────────────────────────────────────────────────
// 14. SceneGraph & ObjectInspector Multi-File Integration
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n14. Testing SceneGraph & ObjectInspector Multi-File Integration...');
{
    const trace = createExecutionTrace({
        events: [
            createTraceEvent({
                id: 0,
                type: 'call',
                source: { file: 'models.py', line: 5, fileId: 'f_models', moduleId: 'm_models' },
                scope: { function: 'create_user', depth: 2 },
                data: {
                    locals: { user_obj: { kind: 'reference', type: 'instance', objectId: 'obj_user' } },
                    heap: { obj_user: { id: 'obj_user', type: 'instance', className: 'User', fields: { name: { kind: 'primitive', type: 'str', value: 'Alice' } } } },
                },
            }),
        ],
    });

    const playback = new PlaybackEngine();
    playback.setFrames(trace);
    playback.jumpTo(0);

    const scene = playback.getCurrentScene();
    const frameNode = scene.getNode('scene_frame_frame_2');
    assert(frameNode !== null, 'Frame node exists in SceneGraph');
    assert(frameNode.metadata.moduleId === 'm_models', 'Frame node carries moduleId m_models');
    assert(frameNode.metadata.fileId === 'f_models', 'Frame node carries fileId f_models');

    // ObjectInspector integration
    const inspector = new ObjectInspector({ runtimeState: playback.getCurrentRuntimeState() });
    const inspected = inspector.getObjectDetails('obj_user');
    assert(inspected !== null && inspected.exists, 'ObjectInspector inspected obj_user across multi-file trace');
    assert(inspected.className === 'User', 'ObjectInspector resolved className User');
    assert(inspected.fields.name.value === 'Alice', 'ObjectInspector resolved field name Alice');
}

// ─────────────────────────────────────────────────────────────────────────────
// 15. Unified Global Timeline Playback Across Files
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n15. Testing Unified Global Timeline & Bidirectional Playback...');
{
    const trace = createExecutionTrace({
        events: [
            createTraceEvent({ id: 0, type: 'line', source: { file: 'main.py', line: 1 } }),
            createTraceEvent({ id: 1, type: 'line', source: { file: 'utils.py', line: 10 } }),
            createTraceEvent({ id: 2, type: 'line', source: { file: 'models.py', line: 20 } }),
            createTraceEvent({ id: 3, type: 'line', source: { file: 'utils.py', line: 11 } }),
            createTraceEvent({ id: 4, type: 'line', source: { file: 'main.py', line: 2 } }),
        ],
    });

    const playback = new PlaybackEngine();
    playback.setFrames(trace);

    assert(playback.totalFrames === 5, 'Global unified timeline contains all 5 interleaved frames');

    // Step forward through interleaved files
    playback.jumpTo(0);
    assert(playback.getCurrentFrame().file === 'main.py', 'Frame 0 is main.py');
    playback.nextFrame();
    assert(playback.getCurrentFrame().file === 'utils.py', 'Frame 1 is utils.py');
    playback.nextFrame();
    assert(playback.getCurrentFrame().file === 'models.py', 'Frame 2 is models.py');
    playback.nextFrame();
    assert(playback.getCurrentFrame().file === 'utils.py', 'Frame 3 is utils.py');
    playback.nextFrame();
    assert(playback.getCurrentFrame().file === 'main.py', 'Frame 4 is main.py');

    // Step backward
    playback.prevFrame();
    assert(playback.getCurrentFrame().file === 'utils.py', 'Stepped back to utils.py');

    // Arbitrary scrub jump
    playback.jumpTo(2);
    assert(playback.getCurrentFrame().file === 'models.py', 'Scrub jump to models.py');
}

// ─────────────────────────────────────────────────────────────────────────────
// 16. Layout & Animation Integration with Multi-File Traces
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n16. Testing Layout & Animation Runtime Integration...');
{
    const trace = createExecutionTrace({
        events: [
            createTraceEvent({
                id: 0,
                type: 'line',
                source: { file: 'main.py', line: 1 },
                data: {
                    locals: { data: { kind: 'reference', type: 'list', objectId: 'obj_data' } },
                    heap: { obj_data: { id: 'obj_data', type: 'list', elements: [{ kind: 'primitive', type: 'int', value: 1 }] } },
                },
            }),
            createTraceEvent({
                id: 1,
                type: 'call',
                source: { file: 'utils.py', line: 5 },
                scope: { function: 'mutate', depth: 2 },
                data: {
                    locals: { arr: { kind: 'reference', type: 'list', objectId: 'obj_data' } },
                    heap: { obj_data: { id: 'obj_data', type: 'list', elements: [{ kind: 'primitive', type: 'int', value: 1 }, { kind: 'primitive', type: 'int', value: 2 }] } },
                },
            }),
        ],
    });

    const playback = new PlaybackEngine();
    playback.setFrames(trace);

    // Layout
    const layout0 = playback.getLayout(0);
    const layout1 = playback.getLayout(1);
    assert(layout0.totalNodes > 0, 'Layout computed for frame 0');
    assert(layout1.totalNodes > 0, 'Layout computed for frame 1');

    // Animation
    const animPlan = playback.getAnimationPlan(0, 1);
    assert(animPlan !== null, 'Generated AnimationPlan across multi-file step');
    assert(animPlan.duration > 0, 'AnimationPlan has non-zero duration');

    const runtime = new AnimationRuntime();
    runtime.play(animPlan);
    const sample = runtime.seek(0.5);
    assert(sample !== null, 'AnimationRuntime sampled transition between files');
}

// ─────────────────────────────────────────────────────────────────────────────
// 17. Large Workspace & Trace Performance Benchmarks
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n17. Testing Large Workspace & Trace Performance...');
{
    // 1. 1,000 files in Workspace
    const startWs = performance.now();
    const bigWs = new Workspace({ id: 'ws_big' });
    for (let i = 1; i <= 1000; i++) {
        bigWs.addFile({
            id: `file_${i}`,
            path: `src/pkg_${Math.floor(i / 50)}/module_${i}.py`,
            content: `def func_${i}(): return ${i}`,
            moduleId: `mod_${i}`,
        });
    }
    const wsElapsed = performance.now() - startWs;
    assert(bigWs.getFiles().length === 1000, 'Workspace contains 1,000 files');
    assert(wsElapsed < 200, `Created 1,000 file workspace in ${wsElapsed.toFixed(1)}ms (< 200ms)`);

    // 2. Snapshot 1,000 files
    const startSnap = performance.now();
    const snap = bigWs.createSnapshot();
    const snapElapsed = performance.now() - startSnap;
    assert(snap.getFiles().length === 1000, 'Snapshot captured 1,000 files');
    assert(snapElapsed < 100, `Created snapshot of 1,000 files in ${snapElapsed.toFixed(1)}ms (< 100ms)`);

    // 3. 10,000 trace events across multiple files
    const events = [];
    for (let i = 0; i < 10000; i++) {
        const fileNum = (i % 20) + 1;
        events.push(createTraceEvent({
            id: i,
            type: 'line',
            source: {
                file: `src/pkg_0/module_${fileNum}.py`,
                fileId: `file_${fileNum}`,
                moduleId: `mod_${fileNum}`,
                line: (i % 50) + 1,
            },
            data: { locals: { count: { kind: 'primitive', type: 'int', value: i } } },
        }));
    }
    const bigTrace = createExecutionTrace({
        source: { entrypoint: 'src/pkg_0/module_1.py' },
        events,
    });

    const startSM = performance.now();
    const sourceMap = new SourceMap({ workspaceSnapshot: snap, uetTrace: bigTrace });
    const smElapsed = performance.now() - startSM;
    assert(smElapsed < 250, `Built SourceMap for 10,000 multi-file events in ${smElapsed.toFixed(1)}ms (< 250ms)`);

    // Instant lookup test
    const startLookup = performance.now();
    const mappedLoc = sourceMap.getFrameLocation(5000);
    const lookupElapsed = performance.now() - startLookup;
    assert(mappedLoc !== null && mappedLoc.line > 0, 'Instant frame location lookup succeeded');
    assert(lookupElapsed < 5, `Looked up frame location in ${lookupElapsed.toFixed(3)}ms (< 5ms)`);
}

console.log('\n========================================');
console.log(`Results: ${passed} passed, ${failed} failed, ${passed + failed} total.`);
console.log('========================================');

if (failed > 0) {
    process.exit(1);
}
