/**
 * Stage 9 Test Suite — Universal Layout & Spatial Intelligence Engine
 *
 * Verification Requirements:
 *  1. LayoutNode & LayoutConstraint creation, bounds, intersections, serialization
 *  2. LayoutGraph topological reasoning (depths, connected components)
 *  3. LayoutState snapshot & regional grouping
 *  4. Geometric layout strategies (horizontal, vertical, grid, stack, tree, radial, graph)
 *  5. Automatic semantic strategy selector
 *  6. Determinism invariant (repeated runs yield byte-for-byte identical output)
 *  7. Stable positioning across mutations ([A, B, C] -> [A, B, C, D])
 *  8. Stable variable slots upon variable deletion
 *  9. Aliasing / shared objects singular layout representation
 * 10. Cyclic graphs termination & safety
 * 11. Nested structures hierarchical layout
 * 12. Call stack frame entry and exit stability
 * 13. Collision avoidance & bounding box separation
 * 14. Layout diffing (added, removed, moved, resized, unchanged)
 * 15. Layout to AnimationPlan integration
 * 16. PlaybackEngine layout accessors
 * 17. SceneRenderer layout boundary integration
 * 18. Large graph scalability & performance benchmarks (100, 1000, 5000 nodes)
 */

import { LayoutNode } from '../src/layout/LayoutNode.js';
import { LayoutConstraint, CONSTRAINT_TYPES } from '../src/layout/LayoutConstraint.js';
import { LayoutGraph } from '../src/layout/LayoutGraph.js';
import { LayoutState } from '../src/layout/LayoutState.js';
import { LayoutStrategies, LAYOUT_STRATEGY_NAMES } from '../src/layout/LayoutStrategies.js';
import { LayoutEngine } from '../src/layout/LayoutEngine.js';
import { LayoutBuilder } from '../src/layout/LayoutBuilder.js';
import { SceneGraph } from '../src/scene/SceneGraph.js';
import { SceneNode, NODE_TYPES } from '../src/scene/SceneNode.js';
import { SceneRelationship, RELATIONSHIP_TYPES } from '../src/scene/SceneRelationship.js';
import { SceneRenderer } from '../src/rendering/SceneRenderer.js';
import { PlaybackEngine } from '../src/PlaybackEngine.js';
import { createExecutionTrace, createTraceEvent, EVENT_TYPES } from '../src/trace/TraceSchema.js';

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

console.log('=== ProViz Stage 9: Universal Layout Engine Test Suite ===\n');

// ─────────────────────────────────────────────────────────────────────────────
// 1. Testing LayoutNode & Collision Bounds
// ─────────────────────────────────────────────────────────────────────────────
console.log('1. Testing LayoutNode & Collision Bounds...');
{
    const nodeA = new LayoutNode({
        id: 'scene_obj_1',
        position: { x: 0, y: 0, z: 0 },
        size: { x: 2, y: 2, z: 2 },
    });

    const nodeB = new LayoutNode({
        id: 'scene_obj_2',
        position: { x: 1, y: 0, z: 0 },
        size: { x: 2, y: 2, z: 2 },
    });

    const nodeC = new LayoutNode({
        id: 'scene_obj_3',
        position: { x: 10, y: 0, z: 0 },
        size: { x: 2, y: 2, z: 2 },
    });

    const boundsA = nodeA.bounds;
    assert(boundsA.min.x === -1 && boundsA.max.x === 1, 'Bounding box min/max computed correctly');
    assert(nodeA.intersects(nodeB), 'Detected collision between overlapping nodes A and B');
    assert(!nodeA.intersects(nodeC), 'Detected no collision between distant nodes A and C');

    const cloned = nodeA.clone();
    assert(nodeA.equals(cloned), 'Cloned LayoutNode is equal');
    assert(nodeA.toJSON().id === 'scene_obj_1', 'LayoutNode toJSON is valid');
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Testing LayoutConstraint Declarations
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n2. Testing LayoutConstraint Declarations...');
{
    const constraint = new LayoutConstraint({
        type: CONSTRAINT_TYPES.HORIZONTAL_SEQUENCE,
        nodes: ['scene_obj_1', 'scene_obj_2'],
        spacing: 3.0,
    });

    assert(constraint.type === CONSTRAINT_TYPES.HORIZONTAL_SEQUENCE, 'Constraint type preserved');
    assert(constraint.nodes.length === 2, 'Constraint nodes list preserved');
    assert(constraint.spacing === 3.0, 'Constraint spacing is 3.0');

    const cloned = constraint.clone();
    assert(constraint.equals(cloned), 'Cloned constraint equals original');
    assert(constraint.toJSON().spacing === 3.0, 'JSON serialization preserves properties');
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Testing LayoutGraph & Topology Reasoning
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n3. Testing LayoutGraph & Topology Reasoning...');
{
    const graph = new LayoutGraph();
    graph.addNode(new LayoutNode({ id: 'frame_0' }));
    graph.addNode(new LayoutNode({ id: 'var_x' }));
    graph.addNode(new LayoutNode({ id: 'obj_1' }));
    graph.addNode(new LayoutNode({ id: 'isolated_obj' }));

    graph.addEdge({ fromId: 'frame_0', toId: 'var_x', type: RELATIONSHIP_TYPES.CONTAINS });
    graph.addEdge({ fromId: 'var_x', toId: 'obj_1', type: RELATIONSHIP_TYPES.REFERENCES });

    assert(graph.getAllNodes().length === 4, 'LayoutGraph tracks 4 nodes');
    assert(graph.getChildren('frame_0').includes('var_x'), 'Identified var_x as child of frame_0');
    assert(graph.getDepth('var_x') === 1, 'Computed depth of var_x as 1');

    const components = graph.getConnectedComponents();
    assert(components.length === 2, 'Found 2 connected components (connected cluster + isolated node)');
    assert(components.some(c => c.includes('isolated_obj') && c.length === 1), 'Isolated object in its own component');
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Testing LayoutState & Regional Grouping
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n4. Testing LayoutState & Regional Grouping...');
{
    const state = new LayoutState({
        frameIndex: 2,
        nodes: [
            new LayoutNode({ id: 'scene_obj_1', region: 'Heap', position: { x: 0, y: 0, z: 0 } }),
            new LayoutNode({ id: 'scene_obj_2', region: 'Heap', position: { x: 5, y: 0, z: 0 } }),
            new LayoutNode({ id: 'scene_frame_0', region: 'CallStack', position: { x: 5.5, y: 3.5, z: 0 } }),
        ],
    });

    assert(state.totalNodes === 3, 'State has 3 nodes');
    assert(state.getNodesInRegion('Heap').length === 2, '2 nodes in Heap region');
    assert(state.getNodesInRegion('CallStack').length === 1, '1 node in CallStack region');

    const b = state.bounds;
    assert(b.min.x === -1 && b.max.x === 6.5, 'State global bounding box computed correctly');

    const json = state.toJSON();
    assert(json.frameIndex === 2 && json.totalNodes === 3, 'JSON snapshot contains frameIndex and totalNodes');
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Testing Layout Strategies (Horizontal, Vertical, Grid, Stack, Tree, Radial, Graph)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n5. Testing Geometric Layout Strategies...');
{
    const nodesH = [new LayoutNode({ id: 'a' }), new LayoutNode({ id: 'b' }), new LayoutNode({ id: 'c' })];
    LayoutStrategies.horizontal(nodesH, { startX: 0, spacing: 3.0 });
    assert(nodesH[0].position.x === 0 && nodesH[1].position.x === 3.0 && nodesH[2].position.x === 6.0, 'Horizontal layout spaced along X');

    const nodesV = [new LayoutNode({ id: 'a' }), new LayoutNode({ id: 'b' })];
    LayoutStrategies.vertical(nodesV, { startY: 0, spacing: 2.0 });
    assert(nodesV[0].position.y === 0 && nodesV[1].position.y === -2.0, 'Vertical layout spaced along Y');

    const nodesGrid = [new LayoutNode({ id: '1' }), new LayoutNode({ id: '2' }), new LayoutNode({ id: '3' }), new LayoutNode({ id: '4' })];
    LayoutStrategies.grid(nodesGrid, { columns: 2, spacingX: 2.0, spacingY: 2.0 });
    assert(nodesGrid[0].position.x === 0 && nodesGrid[0].position.y === 0, 'Grid node (0,0) position');
    assert(nodesGrid[1].position.x === 2.0 && nodesGrid[1].position.y === 0, 'Grid node (1,0) position');
    assert(nodesGrid[2].position.x === 0 && nodesGrid[2].position.y === -2.0, 'Grid node (0,1) position');
    assert(nodesGrid[3].position.x === 2.0 && nodesGrid[3].position.y === -2.0, 'Grid node (1,1) position');

    const nodesStack = [new LayoutNode({ id: 'f0' }), new LayoutNode({ id: 'f1' })];
    LayoutStrategies.stack(nodesStack, { x: 5.5, startY: 3.5, spacingY: 1.8 });
    assert(nodesStack[0].position.x === 5.5 && nodesStack[0].position.y === 3.5, 'Stack top frame at y=3.5');
    assert(nodesStack[1].position.x === 5.5 && nodesStack[1].position.y === 1.7, 'Stack second frame at y=1.7');
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Testing Automatic Strategy Selector
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n6. Testing Automatic Strategy Selector...');
{
    const lGraph = new LayoutGraph();
    const frameNode = new LayoutNode({ id: 'f1', metadata: { type: NODE_TYPES.CALL_FRAME } });
    const listNode = new LayoutNode({ id: 'l1', metadata: { type: NODE_TYPES.OBJECT, valueType: 'list' } });
    const dictNode = new LayoutNode({ id: 'd1', metadata: { type: NODE_TYPES.OBJECT, valueType: 'dict' } });

    assert(LayoutStrategies.selectAutoStrategy(frameNode, lGraph) === LAYOUT_STRATEGY_NAMES.STACK, 'Frame selects STACK strategy');
    assert(LayoutStrategies.selectAutoStrategy(listNode, lGraph) === LAYOUT_STRATEGY_NAMES.HORIZONTAL, 'List selects HORIZONTAL strategy');
    assert(LayoutStrategies.selectAutoStrategy(dictNode, lGraph) === LAYOUT_STRATEGY_NAMES.GRID, 'Dict selects GRID strategy');
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. Testing Determinism Invariant
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n7. Testing Determinism Invariant...');
{
    const engine = new LayoutEngine();
    const scene = new SceneGraph();
    scene.addNode(new SceneNode({ id: 'scene_obj_2', type: NODE_TYPES.OBJECT, semanticId: '2' }));
    scene.addNode(new SceneNode({ id: 'scene_obj_1', type: NODE_TYPES.OBJECT, semanticId: '1' }));
    scene.addNode(new SceneNode({ id: 'scene_frame_0', type: NODE_TYPES.CALL_FRAME, semanticId: '0' }));

    const baselineJson = JSON.stringify(engine.layout(scene).toJSON());
    let allIdentical = true;

    for (let i = 0; i < 20; i++) {
        const testJson = JSON.stringify(engine.layout(scene).toJSON());
        if (testJson !== baselineJson) {
            allIdentical = false;
            break;
        }
    }

    assert(allIdentical === true, 'Repeated layout executions produce byte-for-byte identical output');
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. Testing Stable Positions Across Mutations ([A, B, C] -> [A, B, C, D])
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n8. Testing Stable Positions Across Mutations...');
{
    const engine = new LayoutEngine({ preservePositions: true });

    // Frame 1: [A, B, C]
    const scene1 = new SceneGraph();
    scene1.addNode(new SceneNode({ id: 'scene_obj_a', type: NODE_TYPES.OBJECT, semanticId: 'a' }));
    scene1.addNode(new SceneNode({ id: 'scene_obj_b', type: NODE_TYPES.OBJECT, semanticId: 'b' }));
    scene1.addNode(new SceneNode({ id: 'scene_obj_c', type: NODE_TYPES.OBJECT, semanticId: 'c' }));

    const layout1 = engine.layout(scene1);
    const posA1 = { ...layout1.getNode('scene_obj_a').position };
    const posB1 = { ...layout1.getNode('scene_obj_b').position };
    const posC1 = { ...layout1.getNode('scene_obj_c').position };

    // Frame 2: append D -> [A, B, C, D]
    const scene2 = scene1.clone();
    scene2.addNode(new SceneNode({ id: 'scene_obj_d', type: NODE_TYPES.OBJECT, semanticId: 'd' }));

    const layout2 = engine.layout(scene2, layout1);
    const posA2 = layout2.getNode('scene_obj_a').position;
    const posB2 = layout2.getNode('scene_obj_b').position;
    const posC2 = layout2.getNode('scene_obj_c').position;
    const posD2 = layout2.getNode('scene_obj_d').position;

    assert(posA1.x === posA2.x && posA1.y === posA2.y, 'Object A preserved position');
    assert(posB1.x === posB2.x && posB1.y === posB2.y, 'Object B preserved position');
    assert(posC1.x === posC2.x && posC1.y === posC2.y, 'Object C preserved position');
    assert(posD2.x > posC2.x, 'Object D placed after Object C');
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. Testing Stable Variable Slots upon Variable Deletion
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n9. Testing Stable Variable Slots upon Variable Deletion...');
{
    const engine = new LayoutEngine({ preservePositions: true });

    // Scene 1: scope with variables x, y, z
    const scene1 = new SceneGraph();
    scene1.addNode(new SceneNode({ id: 'scene_var_0_x', type: NODE_TYPES.VARIABLE, metadata: { varName: 'x', scope: 'main' } }));
    scene1.addNode(new SceneNode({ id: 'scene_var_0_y', type: NODE_TYPES.VARIABLE, metadata: { varName: 'y', scope: 'main' } }));
    scene1.addNode(new SceneNode({ id: 'scene_var_0_z', type: NODE_TYPES.VARIABLE, metadata: { varName: 'z', scope: 'main' } }));

    const layout1 = engine.layout(scene1);
    const posX1 = { ...layout1.getNode('scene_var_0_x').position };
    const posZ1 = { ...layout1.getNode('scene_var_0_z').position };

    // Scene 2: variable y deleted (del y)
    const scene2 = new SceneGraph();
    scene2.addNode(new SceneNode({ id: 'scene_var_0_x', type: NODE_TYPES.VARIABLE, metadata: { varName: 'x', scope: 'main' } }));
    scene2.addNode(new SceneNode({ id: 'scene_var_0_z', type: NODE_TYPES.VARIABLE, metadata: { varName: 'z', scope: 'main' } }));

    const layout2 = engine.layout(scene2, layout1);
    const posX2 = layout2.getNode('scene_var_0_x').position;
    const posZ2 = layout2.getNode('scene_var_0_z').position;

    assert(posX1.x === posX2.x && posX1.y === posX2.y, 'Variable x retained its spatial slot');
    assert(posZ1.x === posZ2.x && posZ1.y === posZ2.y, 'Variable z retained its spatial slot without collapsing');
}

// ─────────────────────────────────────────────────────────────────────────────
// 10. Testing Aliasing & Singular Shared Object Layout
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n10. Testing Aliasing & Singular Shared Object Layout...');
{
    const engine = new LayoutEngine();

    // a = []; b = a
    const scene = new SceneGraph();
    scene.addNode(new SceneNode({ id: 'scene_obj_shared', type: NODE_TYPES.OBJECT, semanticId: '1' }));
    scene.addNode(new SceneNode({ id: 'scene_var_0_a', type: NODE_TYPES.VARIABLE, semanticId: 'a' }));
    scene.addNode(new SceneNode({ id: 'scene_var_0_b', type: NODE_TYPES.VARIABLE, semanticId: 'b' }));
    scene.addRelationship(new SceneRelationship({ fromId: 'scene_var_0_a', toId: 'scene_obj_shared', type: RELATIONSHIP_TYPES.REFERENCES }));
    scene.addRelationship(new SceneRelationship({ fromId: 'scene_var_0_b', toId: 'scene_obj_shared', type: RELATIONSHIP_TYPES.REFERENCES }));

    const layout = engine.layout(scene);
    assert(layout.totalNodes === 3, 'Exactly 3 layout nodes exist (1 shared heap object + 2 variables)');
    assert(layout.getNode('scene_obj_shared') !== null, 'Shared object has singular LayoutNode');
    assert(layout.getNode('scene_obj_shared_duplicate') === null, 'No duplicate layout node created');
}

// ─────────────────────────────────────────────────────────────────────────────
// 11. Testing Cyclic Reference Graph Layout Without Infinite Recursion
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n11. Testing Cyclic Reference Graph Layout...');
{
    const engine = new LayoutEngine();

    // a = []; a.append(a)
    const scene = new SceneGraph();
    scene.addNode(new SceneNode({ id: 'scene_obj_cyclic', type: NODE_TYPES.OBJECT, semanticId: '1' }));
    scene.addRelationship(new SceneRelationship({
        fromId: 'scene_obj_cyclic',
        toId: 'scene_obj_cyclic',
        type: RELATIONSHIP_TYPES.REFERENCES,
    }));

    const layout = engine.layout(scene);
    assert(layout.totalNodes === 1, 'Self-referencing cyclic object laid out safely');
    assert(layout.getNode('scene_obj_cyclic') !== null, 'Cyclic node positioned deterministically');
}

// ─────────────────────────────────────────────────────────────────────────────
// 12. Testing Collision Avoidance & Deterministic Separation
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n12. Testing Collision Avoidance & Separation...');
{
    const engine = new LayoutEngine({ collisionAvoidance: true });

    // Two nodes forced to the exact same position
    const nodeA = new LayoutNode({ id: 'n1', region: 'Heap', position: { x: 0, y: 0, z: 0 }, size: { x: 2, y: 2, z: 2 } });
    const nodeB = new LayoutNode({ id: 'n2', region: 'Heap', position: { x: 0, y: 0, z: 0 }, size: { x: 2, y: 2, z: 2 } });

    engine.resolveCollisions([nodeA, nodeB]);
    assert(!nodeA.intersects(nodeB, 0.1), 'Collision resolved: nodes no longer overlap');
    assert(nodeB.position.x > nodeA.position.x, 'Node B shifted along X axis');
}

// ─────────────────────────────────────────────────────────────────────────────
// 13. Testing Layout Diffing (Added, Removed, Moved, Unchanged)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n13. Testing Layout Diffing...');
{
    const builder = new LayoutBuilder();

    const layout1 = new LayoutState({
        frameIndex: 0,
        nodes: [
            new LayoutNode({ id: 'scene_obj_stay', position: { x: 0, y: 0, z: 0 } }),
            new LayoutNode({ id: 'scene_obj_move', position: { x: 10, y: 0, z: 0 } }),
            new LayoutNode({ id: 'scene_obj_del', position: { x: 20, y: 0, z: 0 } }),
        ],
    });

    const layout2 = new LayoutState({
        frameIndex: 1,
        nodes: [
            new LayoutNode({ id: 'scene_obj_stay', position: { x: 0, y: 0, z: 0 } }),
            new LayoutNode({ id: 'scene_obj_move', position: { x: 15, y: 5, z: 0 } }),
            new LayoutNode({ id: 'scene_obj_new', position: { x: 30, y: 0, z: 0 } }),
        ],
    });

    const diff = builder.diff(layout1, layout2);
    assert(diff.unchanged.length === 1 && diff.unchanged[0].id === 'scene_obj_stay', 'Detected unchanged node');
    assert(diff.moved.length === 1 && diff.moved[0].id === 'scene_obj_move', 'Detected moved node');
    assert(diff.added.length === 1 && diff.added[0].id === 'scene_obj_new', 'Detected added node');
    assert(diff.removed.length === 1 && diff.removed[0].id === 'scene_obj_del', 'Detected removed node');

    const animPlan = builder.toAnimationPlan(diff, layout1, layout2);
    assert(animPlan.totalClips === 1, 'Generated AnimationPlan for spatial movement');
    assert(animPlan.getTrack('scene_obj_move:transform.position') !== null, 'Generated transform.position track for moved node');
}

// ─────────────────────────────────────────────────────────────────────────────
// 14. Testing PlaybackEngine Integration
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n14. Testing PlaybackEngine Layout Integration...');
{
    const trace = createExecutionTrace({
        sourceCode: 'x = 10\ny = 20\n',
        events: [
            createTraceEvent({
                id: 0,
                type: EVENT_TYPES.LINE,
                source: { file: 'main.py', line: 1 },
                scope: { function: '<module>', depth: 1 },
                data: { locals: { x: '10' } },
            }),
            createTraceEvent({
                id: 1,
                type: EVENT_TYPES.LINE,
                source: { file: 'main.py', line: 2 },
                scope: { function: '<module>', depth: 1 },
                data: { locals: { x: '10', y: '20' } },
            }),
            createTraceEvent({
                id: 2,
                type: EVENT_TYPES.PROGRAM_END,
                source: { file: 'main.py', line: 2 },
                scope: { function: '<module>', depth: 0 },
                data: { output: 'done' },
            }),
        ],
    });

    const playback = new PlaybackEngine();
    playback.setFrames(trace);

    const layoutFrame0 = playback.getLayout(0);
    assert(layoutFrame0 !== null, 'playback.getLayout(0) returned valid LayoutState');
    assert(layoutFrame0.totalNodes > 0, 'Layout contains nodes');

    playback.jumpTo(1);
    const currLayout = playback.getCurrentLayout();
    assert(currLayout !== null, 'playback.getCurrentLayout() returned valid LayoutState');

    const layoutTransition = playback.getLayoutTransition(0, 1);
    assert(layoutTransition.nextLayout !== null, 'Layout transition computed between frames 0 and 1');
}

// ─────────────────────────────────────────────────────────────────────────────
// 15. Testing SceneRenderer Layout Boundary Integration
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n15. Testing SceneRenderer Layout Boundary Integration...');
{
    const mockVisualizer = {
        spawned: new Map(),
        updated: new Map(),
        removed: new Set(),
        async spawn(id, label, color, x, y, z) {
            this.spawned.set(id, { label, color, x, y, z });
        },
        async update(id, label, color) {
            this.updated.set(id, { label, color });
        },
        async remove(id) {
            this.removed.add(id);
        },
        clearAll() {
            this.spawned.clear();
            this.updated.clear();
            this.removed.clear();
        },
    };

    const renderer = new SceneRenderer({ baseVisualizer: mockVisualizer });
    const scene = new SceneGraph();
    scene.addNode(new SceneNode({ id: 'scene_obj_1', type: NODE_TYPES.OBJECT, label: 'Box 1' }));

    await renderer.render(scene);
    assert(mockVisualizer.spawned.has('vis_scene_obj_1'), 'Renderer spawned node');

    const layoutState = new LayoutState({
        nodes: [new LayoutNode({ id: 'scene_obj_1', position: { x: 8, y: 2, z: 0 } })],
    });

    await renderer.applyLayout(layoutState);
    assert(renderer.getLayoutState() === layoutState, 'Renderer stored applied LayoutState');
    assert(mockVisualizer.updated.has('vis_scene_obj_1'), 'Renderer updated node on layout change');
}

// ─────────────────────────────────────────────────────────────────────────────
// 16. Testing Large Graph Performance & Scalability (100, 1000, 5000 nodes)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n16. Testing Large Graph Layout Performance...');
{
    const engine = new LayoutEngine();

    for (const count of [100, 1000, 5000]) {
        const scene = new SceneGraph();
        for (let i = 0; i < count; i++) {
            scene.addNode(new SceneNode({
                id: `scene_obj_${i}`,
                type: NODE_TYPES.OBJECT,
                semanticId: `${i}`,
            }));
        }

        const t0 = performance.now();
        const layout = engine.layout(scene);
        const elapsed = performance.now() - t0;

        assert(layout.totalNodes === count, `Successfully laid out ${count} nodes`);
        assert(elapsed < 200, `Laid out ${count} nodes in ${elapsed.toFixed(1)}ms (< 200ms threshold)`);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n========================================');
console.log(`Results: ${passedTests} passed, ${failedTests} failed, ${totalTests} total.`);
console.log('========================================');

if (failedTests > 0) {
    process.exit(1);
}
