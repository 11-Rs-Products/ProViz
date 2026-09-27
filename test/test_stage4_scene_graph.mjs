/**
 * Stage 4 Test Suite — Universal Scene Graph & Runtime Visualization Layer
 *
 * Tests:
 *  1. Basic Primitives (x = 10, name = "hello", flag = True)
 *  2. List Representation & Object Identity (numbers = [1, 2, 3])
 *  3. Aliasing & Shared References (a = [1], b = a)
 *  4. Mutation Across Time (a = [1]; b = a; a.append(2))
 *  5. Nested Structures (a = [[1, 2], [3, 4]])
 *  6. Dictionary Key/Value Relationships
 *  7. Custom Object Attributes & References
 *  8. Cyclic Structures & Finite Construction (a = []; a.append(a))
 *  9. Call Stack & Scopes (Recursive Frames)
 * 10. Graph Determinism (build(state) twice produces identical SceneGraph)
 * 11. Playback Non-Linear Navigation Independence (0 -> 10 -> 25 -> 5 -> 40)
 * 12. Renderer Independence (Zero Three.js / WebGL / DOM imports)
 * 13. SceneGraph Container & Node/Relationship Methods (clone, equals, toJSON)
 */

import { SceneBuilder } from '../src/scene/SceneBuilder.js';
import { SceneGraph } from '../src/scene/SceneGraph.js';
import { SceneNode, NODE_TYPES } from '../src/scene/SceneNode.js';
import { SceneRelationship, RELATIONSHIP_TYPES } from '../src/scene/SceneRelationship.js';
import { SceneRenderer } from '../src/rendering/SceneRenderer.js';
import { RuntimeState } from '../src/runtime/RuntimeState.js';
import { Heap } from '../src/runtime/Heap.js';
import { HeapObject } from '../src/runtime/HeapObject.js';
import { Scope } from '../src/runtime/Scope.js';
import { CallFrame } from '../src/runtime/CallFrame.js';
import { createPrimitiveValue, createReferenceValue } from '../src/runtime/Value.js';
import { StateReconstructor } from '../src/playback/StateReconstructor.js';
import { PlaybackEngine } from '../src/PlaybackEngine.js';
import { createExecutionTrace, createTraceEvent, EVENT_TYPES } from '../src/trace/TraceSchema.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    }
}

console.log('=== ProViz Stage 4: Universal Scene Graph & Visualization Layer Test Suite ===\n');

const builder = new SceneBuilder();

// ─────────────────────────────────────────────────────────────────────────────
// Test 1: Basic Primitives
// ─────────────────────────────────────────────────────────────────────────────
console.log('1. Testing Basic Primitives (x = 10, name = "hello", flag = True)...');
{
    const state = new RuntimeState();
    const frame = new CallFrame({ frameId: 'frame_0', functionName: '<module>', depth: 0 });
    frame.scope.setBinding('x', createPrimitiveValue('int', 10));
    frame.scope.setBinding('name', createPrimitiveValue('str', 'hello'));
    frame.scope.setBinding('flag', createPrimitiveValue('bool', true));
    state.callStack.push(frame);

    const scene = builder.build(state);

    assert(scene instanceof SceneGraph, 'SceneBuilder returns a SceneGraph instance');
    assert(scene.hasNode('scene_frame_frame_0'), 'SceneGraph contains frame node');
    assert(scene.hasNode('scene_var_frame_0_x'), 'SceneGraph contains variable node for x');
    assert(scene.hasNode('scene_var_frame_0_name'), 'SceneGraph contains variable node for name');
    assert(scene.hasNode('scene_var_frame_0_flag'), 'SceneGraph contains variable node for flag');

    const nodeX = scene.getNode('scene_var_frame_0_x');
    assert(nodeX.type === NODE_TYPES.VARIABLE, 'x node is of type VARIABLE');
    assert(nodeX.semanticId === 'x', 'x node semanticId is "x"');
    assert(nodeX.value.value === 10, 'x node value is 10');

    const frameContainsX = scene.getRelationshipsFrom('scene_frame_frame_0').some(
        r => r.toId === 'scene_var_frame_0_x' && r.type === RELATIONSHIP_TYPES.CONTAINS
    );
    assert(frameContainsX, 'Frame has CONTAINS relationship to variable x');
}

// ─────────────────────────────────────────────────────────────────────────────
// Test 2: List Representation & Object Identity
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n2. Testing List Representation & Object Identity (numbers = [1, 2, 3])...');
{
    const state = new RuntimeState();
    const listObj = new HeapObject({
        id: 'obj_1',
        type: 'list',
        elements: [
            createPrimitiveValue('int', 1),
            createPrimitiveValue('int', 2),
            createPrimitiveValue('int', 3),
        ],
    });
    state.heap.setObject('obj_1', listObj);

    const frame = new CallFrame({ frameId: 'frame_0', functionName: '<module>' });
    frame.scope.setBinding('numbers', createReferenceValue('obj_1'));
    state.callStack.push(frame);

    const scene = builder.build(state);

    assert(scene.hasNode('scene_obj_1'), 'Scene contains heap object node scene_obj_1');
    const objNode = scene.getNode('scene_obj_1');
    assert(objNode.type === NODE_TYPES.OBJECT, 'Object node is type OBJECT');
    assert(objNode.semanticId === 'obj_1', 'Object node semanticId is obj_1');
    assert(objNode.value.elementsCount === 3, 'Object node reflects 3 elements');

    const varNode = scene.getNode('scene_var_frame_0_numbers');
    assert(varNode !== null, 'Variable node numbers exists');

    const refEdges = scene.getRelationshipsFrom('scene_var_frame_0_numbers');
    assert(refEdges.length === 1, 'Variable has exactly 1 reference relationship');
    assert(refEdges[0].toId === 'scene_obj_1', 'Variable points to scene_obj_1');
    assert(refEdges[0].type === RELATIONSHIP_TYPES.REFERENCES, 'Relationship type is REFERENCES');
}

// ─────────────────────────────────────────────────────────────────────────────
// Test 3: Aliasing & Shared References (a = [1], b = a)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n3. Testing Aliasing & Shared References (a = [1], b = a)...');
{
    const state = new RuntimeState();
    const listObj = new HeapObject({
        id: 'obj_1',
        type: 'list',
        elements: [createPrimitiveValue('int', 1)],
    });
    state.heap.setObject('obj_1', listObj);

    const frame = new CallFrame({ frameId: 'frame_0', functionName: '<module>' });
    frame.scope.setBinding('a', createReferenceValue('obj_1'));
    frame.scope.setBinding('b', createReferenceValue('obj_1'));
    state.callStack.push(frame);

    const scene = builder.build(state);

    const objNodes = scene.getAllNodes().filter(n => n.type === NODE_TYPES.OBJECT);
    assert(objNodes.length === 1, 'Exactly one heap object node exists (no duplicate objects)');
    assert(objNodes[0].id === 'scene_obj_1', 'Heap object is scene_obj_1');

    const aRefs = scene.getRelationshipsFrom('scene_var_frame_0_a');
    const bRefs = scene.getRelationshipsFrom('scene_var_frame_0_b');

    assert(aRefs.length === 1 && aRefs[0].toId === 'scene_obj_1', 'Variable a points to scene_obj_1');
    assert(bRefs.length === 1 && bRefs[0].toId === 'scene_obj_1', 'Variable b points to same scene_obj_1');
}

// ─────────────────────────────────────────────────────────────────────────────
// Test 4: Mutation Across Time (a = [1]; b = a; a.append(2))
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n4. Testing Mutation Across Time (a = [1]; b = a; a.append(2))...');
{
    const events = [
        createTraceEvent({
            id: 0,
            type: EVENT_TYPES.LINE,
            source: { line: 1 },
            data: {
                locals: { a: createReferenceValue('obj_1') },
                heap: { obj_1: { id: 'obj_1', type: 'list', elements: [createPrimitiveValue('int', 1)] } },
            },
        }),
        createTraceEvent({
            id: 1,
            type: EVENT_TYPES.LINE,
            source: { line: 2 },
            data: {
                locals: { a: createReferenceValue('obj_1'), b: createReferenceValue('obj_1') },
                heap: { obj_1: { id: 'obj_1', type: 'list', elements: [createPrimitiveValue('int', 1)] } },
            },
        }),
        createTraceEvent({
            id: 2,
            type: EVENT_TYPES.LINE,
            source: { line: 3 },
            data: {
                locals: { a: createReferenceValue('obj_1'), b: createReferenceValue('obj_1') },
                heap: { obj_1: { id: 'obj_1', type: 'list', elements: [createPrimitiveValue('int', 1), createPrimitiveValue('int', 2)] } },
            },
        }),
    ];

    const trace = createExecutionTrace({ events });
    const reconstructor = new StateReconstructor({ uetTrace: trace });

    const stateFrame1 = reconstructor.reconstruct(1);
    const scene1 = builder.build(stateFrame1);
    assert(scene1.getNode('scene_obj_1').value.elementsCount === 1, 'Scene at frame 1 shows 1 element');

    const stateFrame2 = reconstructor.reconstruct(2);
    const scene2 = builder.build(stateFrame2);
    const bVarNode = scene2.getAllNodes().find(n => n.type === NODE_TYPES.VARIABLE && n.semanticId === 'b');
    assert(bVarNode !== undefined, 'Variable node for b exists');
    const bRefs = scene2.getRelationshipsFrom(bVarNode.id);
    assert(bRefs.length === 1 && bRefs[0].toId === 'scene_obj_1', 'Variable b still references mutated scene_obj_1');
}

// ─────────────────────────────────────────────────────────────────────────────
// Test 5: Nested Structures (a = [[1, 2], [3, 4]])
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n5. Testing Nested Structures (a = [[1, 2], [3, 4]])...');
{
    const state = new RuntimeState();
    const inner1 = new HeapObject({
        id: 'obj_inner1',
        type: 'list',
        elements: [createPrimitiveValue('int', 1), createPrimitiveValue('int', 2)],
    });
    const inner2 = new HeapObject({
        id: 'obj_inner2',
        type: 'list',
        elements: [createPrimitiveValue('int', 3), createPrimitiveValue('int', 4)],
    });
    const outer = new HeapObject({
        id: 'obj_outer',
        type: 'list',
        elements: [createReferenceValue('obj_inner1'), createReferenceValue('obj_inner2')],
    });

    state.heap.setObject('obj_inner1', inner1);
    state.heap.setObject('obj_inner2', inner2);
    state.heap.setObject('obj_outer', outer);

    const frame = new CallFrame({ frameId: 'frame_0', functionName: '<module>' });
    frame.scope.setBinding('a', createReferenceValue('obj_outer'));
    state.callStack.push(frame);

    const scene = builder.build(state);

    assert(scene.hasNode('scene_obj_outer'), 'Scene has outer list node');
    assert(scene.hasNode('scene_obj_inner1'), 'Scene has inner1 list node');
    assert(scene.hasNode('scene_obj_inner2'), 'Scene has inner2 list node');

    const outerEdges = scene.getRelationshipsFrom('scene_obj_outer');
    assert(outerEdges.length === 2, 'Outer list has 2 outbound reference relationships');
    assert(outerEdges.some(e => e.toId === 'scene_obj_inner1' && e.label === '[0]'), 'Outer[0] points to scene_obj_inner1');
    assert(outerEdges.some(e => e.toId === 'scene_obj_inner2' && e.label === '[1]'), 'Outer[1] points to scene_obj_inner2');
}

// ─────────────────────────────────────────────────────────────────────────────
// Test 6: Dictionary Key/Value Relationships
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n6. Testing Dictionary Key/Value Relationships...');
{
    const state = new RuntimeState();
    const valObj = new HeapObject({
        id: 'obj_val',
        type: 'list',
        elements: [createPrimitiveValue('int', 42)],
    });
    const dictObj = new HeapObject({
        id: 'obj_dict',
        type: 'dict',
        entries: [
            { key: createPrimitiveValue('str', 'count'), value: createPrimitiveValue('int', 100) },
            { key: createPrimitiveValue('str', 'items'), value: createReferenceValue('obj_val') },
        ],
    });

    state.heap.setObject('obj_val', valObj);
    state.heap.setObject('obj_dict', dictObj);

    const frame = new CallFrame({ frameId: 'frame_0', functionName: '<module>' });
    frame.scope.setBinding('d', createReferenceValue('obj_dict'));
    state.callStack.push(frame);

    const scene = builder.build(state);

    assert(scene.hasNode('scene_obj_dict'), 'Scene contains dict object node');
    assert(scene.hasNode('scene_obj_val'), 'Scene contains referenced list object node');

    const dictEdges = scene.getRelationshipsFrom('scene_obj_dict');
    assert(dictEdges.length === 1, 'Dict has 1 reference relationship (for reference value "items")');
    assert(dictEdges[0].toId === 'scene_obj_val', 'Dict references scene_obj_val');
    assert(dictEdges[0].label === '"items"', 'Relationship is labeled with dict key');
}

// ─────────────────────────────────────────────────────────────────────────────
// Test 7: Custom Object Attributes & References
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n7. Testing Custom Object Attributes & References...');
{
    const state = new RuntimeState();
    const childObj = new HeapObject({
        id: 'obj_node_2',
        type: 'custom',
        className: 'TreeNode',
        fields: { val: createPrimitiveValue('int', 20), left: null, right: null },
    });
    const rootObj = new HeapObject({
        id: 'obj_node_1',
        type: 'custom',
        className: 'TreeNode',
        fields: { val: createPrimitiveValue('int', 10), left: createReferenceValue('obj_node_2'), right: null },
    });

    state.heap.setObject('obj_node_2', childObj);
    state.heap.setObject('obj_node_1', rootObj);

    const frame = new CallFrame({ frameId: 'frame_0', functionName: '<module>' });
    frame.scope.setBinding('root', createReferenceValue('obj_node_1'));
    state.callStack.push(frame);

    const scene = builder.build(state);

    assert(scene.hasNode('scene_obj_node_1'), 'Scene has root TreeNode node');
    assert(scene.hasNode('scene_obj_node_2'), 'Scene has child TreeNode node');

    const rootNode = scene.getNode('scene_obj_node_1');
    assert(rootNode.label.includes('TreeNode'), 'Node label includes class name');

    const rootEdges = scene.getRelationshipsFrom('scene_obj_node_1');
    assert(rootEdges.length === 1, 'Root has 1 reference relationship');
    assert(rootEdges[0].toId === 'scene_obj_node_2', 'Root points to scene_obj_node_2');
    assert(rootEdges[0].label === 'left', 'Relationship label is "left"');
}

// ─────────────────────────────────────────────────────────────────────────────
// Test 8: Cyclic Structures & Finite Construction (a = []; a.append(a))
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n8. Testing Cyclic Structures (a = []; a.append(a))...');
{
    const state = new RuntimeState();
    const cyclicList = new HeapObject({
        id: 'obj_self',
        type: 'list',
        elements: [createReferenceValue('obj_self')],
    });
    state.heap.setObject('obj_self', cyclicList);

    const frame = new CallFrame({ frameId: 'frame_0', functionName: '<module>' });
    frame.scope.setBinding('a', createReferenceValue('obj_self'));
    state.callStack.push(frame);

    const startTime = Date.now();
    const scene = builder.build(state);
    const duration = Date.now() - startTime;

    assert(duration < 50, `Cyclic scene construction completed quickly without infinite recursion (${duration}ms)`);
    assert(scene.hasNode('scene_obj_self'), 'Cyclic node scene_obj_self exists in SceneGraph');

    const cyclicEdges = scene.getRelationshipsFrom('scene_obj_self');
    assert(cyclicEdges.length === 1, 'Self-reference produces 1 relationship edge');
    assert(cyclicEdges[0].fromId === 'scene_obj_self' && cyclicEdges[0].toId === 'scene_obj_self', 'Self-reference edge points from node to itself');
}

// ─────────────────────────────────────────────────────────────────────────────
// Test 9: Call Stack & Scopes (Recursive Frames)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n9. Testing Call Stack & Scopes (Recursive Frames)...');
{
    const state = new RuntimeState();

    const frame0 = new CallFrame({ frameId: 'frame_0', functionName: '<module>', depth: 0 });
    frame0.scope.setBinding('target', createPrimitiveValue('int', 3));

    const frame1 = new CallFrame({ frameId: 'frame_1', functionName: 'factorial', depth: 1 });
    frame1.scope.setBinding('n', createPrimitiveValue('int', 3));

    const frame2 = new CallFrame({ frameId: 'frame_2', functionName: 'factorial', depth: 2 });
    frame2.scope.setBinding('n', createPrimitiveValue('int', 2));

    const frame3 = new CallFrame({ frameId: 'frame_3', functionName: 'factorial', depth: 3 });
    frame3.scope.setBinding('n', createPrimitiveValue('int', 1));

    state.callStack.push(frame0);
    state.callStack.push(frame1);
    state.callStack.push(frame2);
    state.callStack.push(frame3);

    const scene = builder.build(state);

    const frameNodes = scene.getAllNodes().filter(n => n.type === NODE_TYPES.CALL_FRAME);
    assert(frameNodes.length === 4, 'SceneGraph contains 4 CALL_FRAME nodes');

    const topFrameNode = scene.getNode('scene_frame_frame_3');
    assert(topFrameNode.style.emphasis === 'active', 'Active top-of-stack frame has style.emphasis "active"');

    const lowerFrameNode = scene.getNode('scene_frame_frame_1');
    assert(lowerFrameNode.style.emphasis === 'default', 'Lower call frame has style.emphasis "default"');

    assert(scene.hasNode('scene_var_frame_1_n'), 'Frame 1 has variable n');
    assert(scene.hasNode('scene_var_frame_2_n'), 'Frame 2 has independent variable n');
    assert(scene.hasNode('scene_var_frame_3_n'), 'Frame 3 has independent variable n');
    assert(scene.getNode('scene_var_frame_3_n').value.value === 1, 'Frame 3 variable n value is 1');
    assert(scene.getNode('scene_var_frame_1_n').value.value === 3, 'Frame 1 variable n value is 3');
}

// ─────────────────────────────────────────────────────────────────────────────
// Test 10: Graph Determinism
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n10. Testing Graph Determinism...');
{
    const state1 = new RuntimeState();
    const list1 = new HeapObject({
        id: 'obj_10',
        type: 'list',
        elements: [createPrimitiveValue('int', 99)],
    });
    state1.heap.setObject('obj_10', list1);
    const frameA = new CallFrame({ frameId: 'frame_0', functionName: 'main' });
    frameA.scope.setBinding('data', createReferenceValue('obj_10'));
    state1.callStack.push(frameA);

    const state2 = state1.clone();

    const sceneA = builder.build(state1);
    const sceneB = builder.build(state2);

    assert(sceneA.equals(sceneB), 'sceneA.equals(sceneB) is true for cloned states');
    assert(sceneB.equals(sceneA), 'Symmetric equality holds');

    const jsonA = JSON.stringify(sceneA.toJSON());
    const jsonB = JSON.stringify(sceneB.toJSON());
    assert(jsonA === jsonB, 'JSON serialization of both scenes is byte-for-byte identical');
}

// ─────────────────────────────────────────────────────────────────────────────
// Test 11: Playback Non-Linear Navigation Independence
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n11. Testing Playback Non-Linear Navigation Independence (0 -> 10 -> 25 -> 5 -> 40)...');
{
    const events = [];
    for (let i = 0; i < 50; i++) {
        events.push(createTraceEvent({
            id: i,
            type: EVENT_TYPES.LINE,
            source: { line: i + 1 },
            data: {
                locals: {
                    step: createPrimitiveValue('int', i),
                    arr: createReferenceValue('obj_arr'),
                },
                heap: {
                    obj_arr: {
                        id: 'obj_arr',
                        type: 'list',
                        elements: [createPrimitiveValue('int', i * 2)],
                    },
                },
            },
        }));
    }

    const trace = createExecutionTrace({ events });
    const playback = new PlaybackEngine();
    playback.setFrames(trace);

    // Jump non-linearly: 0 -> 10 -> 25 -> 5 -> 40
    playback.jumpTo(0);
    const sceneAt0 = playback.getCurrentScene();

    playback.jumpTo(10);
    const sceneAt10 = playback.getCurrentScene();

    playback.jumpTo(25);
    const sceneAt25 = playback.getCurrentScene();

    playback.jumpTo(5);
    const sceneAt5 = playback.getCurrentScene();

    playback.jumpTo(40);
    const sceneAt40 = playback.getCurrentScene();

    // Now jump directly back to 10 and 25 from 40
    playback.jumpTo(10);
    const sceneAt10Again = playback.getCurrentScene();

    playback.jumpTo(25);
    const sceneAt25Again = playback.getCurrentScene();

    assert(sceneAt10.equals(sceneAt10Again), 'Scene at step 10 is identical regardless of navigation history');
    assert(sceneAt25.equals(sceneAt25Again), 'Scene at step 25 is identical regardless of navigation history');
    const stepNode5 = sceneAt5.getAllNodes().find(n => n.type === NODE_TYPES.VARIABLE && n.semanticId === 'step');
    const stepNode40 = sceneAt40.getAllNodes().find(n => n.type === NODE_TYPES.VARIABLE && n.semanticId === 'step');
    assert(stepNode5 && stepNode5.value.value === 5, 'Scene at step 5 has correct step value (5)');
    assert(stepNode40 && stepNode40.value.value === 40, 'Scene at step 40 has correct step value (40)');

    // Test getSceneAt(idx) static querying
    const sceneDirect5 = playback.getSceneAt(5);
    assert(sceneAt5.equals(sceneDirect5), 'getSceneAt(5) produces identical scene without changing playback pointer');
}

// ─────────────────────────────────────────────────────────────────────────────
// Test 12: Renderer Independence (Zero Three.js / WebGL / DOM imports)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n12. Testing Renderer Independence (No Three.js imports in src/scene/)...');
{
    const sceneFiles = [
        '../src/scene/SceneNode.js',
        '../src/scene/SceneRelationship.js',
        '../src/scene/SceneGraph.js',
        '../src/scene/SceneBuilder.js',
    ];

    let hasForbiddenImport = false;
    for (const relPath of sceneFiles) {
        const fullPath = path.resolve(__dirname, relPath);
        const code = fs.readFileSync(fullPath, 'utf8');

        if (/from\s+['"]three['"]/i.test(code) || /import\s+.*THREE/i.test(code) || /THREE\./.test(code)) {
            hasForbiddenImport = true;
            console.error(`  Forbidden Three.js import found in ${relPath}`);
        }
    }

    assert(!hasForbiddenImport, 'All modules in src/scene/ are 100% free of Three.js / WebGL dependencies');
}

// ─────────────────────────────────────────────────────────────────────────────
// Test 13: SceneGraph & SceneNode Methods (clone, equals, toJSON)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n13. Testing SceneGraph & SceneNode container methods...');
{
    const node1 = new SceneNode({
        id: 'node_1',
        type: NODE_TYPES.OBJECT,
        semanticId: 'obj_1',
        label: 'My Object',
        transform: { position: { x: 1, y: 2, z: 3 } },
        style: { category: 'custom', emphasis: 'active' },
        metadata: { customField: 42 },
    });

    const node1Clone = node1.clone();
    assert(node1.equals(node1Clone), 'SceneNode.clone() produces an equal node');
    assert(node1 !== node1Clone, 'Cloned node is a distinct object reference');

    node1Clone.transform.position.x = 99;
    assert(!node1.equals(node1Clone), 'Modifying cloned node transform breaks equality');

    const rel = new SceneRelationship({
        fromId: 'node_1',
        toId: 'node_2',
        type: RELATIONSHIP_TYPES.REFERENCES,
        label: 'points_to',
    });
    const relClone = rel.clone();
    assert(rel.equals(relClone), 'SceneRelationship.clone() produces equal relationship');

    const graph = new SceneGraph();
    graph.addNode(node1);
    graph.addRelationship(rel);

    const graphClone = graph.clone();
    assert(graph.equals(graphClone), 'SceneGraph.clone() produces equal SceneGraph');

    graph.removeNode('node_1');
    assert(!graph.hasNode('node_1'), 'removeNode removes node from graph');
    assert(graph.getRelationshipsFrom('node_1').length === 0, 'removeNode cleans up attached relationships');
}

// ─────────────────────────────────────────────────────────────────────────────
// Test 14: SceneRenderer Boundary Mock
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n14. Testing SceneRenderer Boundary...');
{
    const spawned = [];
    const updated = [];
    const removed = [];

    const mockBaseVisualizer = {
        async spawn(id, label, color, x, y, z) {
            spawned.push({ id, label, color, x, y, z });
        },
        async update(id, label, color) {
            updated.push({ id, label, color });
        },
        async remove(id) {
            removed.push(id);
        },
        clearAll() {
            spawned.length = 0;
            updated.length = 0;
            removed.length = 0;
        },
    };

    const renderer = new SceneRenderer({ baseVisualizer: mockBaseVisualizer });

    const graphA = new SceneGraph();
    graphA.addNode(new SceneNode({ id: 'scene_obj_1', label: 'Object #1', transform: { position: { x: 0, y: 0, z: 0 } } }));
    graphA.addNode(new SceneNode({ id: 'scene_obj_2', label: 'Object #2', transform: { position: { x: 2, y: 0, z: 0 } } }));

    await renderer.render(graphA);
    assert(spawned.length === 2, 'SceneRenderer spawned 2 visualizer blocks');
    assert(renderer.renderedNodes.has('scene_obj_1'), 'Renderer tracks scene_obj_1');

    // Render updated graph with obj_1 label changed and obj_2 removed
    const graphB = new SceneGraph();
    graphB.addNode(new SceneNode({ id: 'scene_obj_1', label: 'Object #1 Modified', transform: { position: { x: 0, y: 0, z: 0 } } }));

    await renderer.render(graphB);
    assert(updated.length === 1, 'SceneRenderer updated scene_obj_1');
    assert(removed.length === 1 && removed[0] === 'vis_scene_obj_2', 'SceneRenderer removed scene_obj_2');
}

// ─────────────────────────────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n================================================================');
console.log(`Stage 4 Test Results: ${passedTests}/${totalTests} passed, ${failedTests} failed.`);
console.log('================================================================');

if (failedTests > 0) {
    process.exit(1);
}
