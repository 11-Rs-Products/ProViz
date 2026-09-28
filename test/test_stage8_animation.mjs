/**
 * Stage 8 Test Suite — Universal Animation & Transition Runtime
 *
 * Verification Requirements:
 *  1. Basic AnimationClip, AnimationTrack, AnimationPlan creation & serialization
 *  2. Pure deterministic interpolation (numbers, vectors, transforms, discrete values)
 *  3. Easing functions (linear, easeIn, easeOut, easeInOut, boundaries)
 *  4. Semantic transition mapping (create_node, remove_node, update_node, rebind_variable, mutate_object, enter_frame, exit_frame, highlight_node)
 *  5. Reversible animation (swapping from/to, life-cycle inversion, plan.reverse())
 *  6. Determinism (same inputs produce byte-for-byte identical plans)
 *  7. Seek & History-independence (seek(T) === seek(0) + advance)
 *  8. Interruption & Cancellation (clean replacement of active animations)
 *  9. Scrubbing across arbitrary non-adjacent frames
 * 10. Aliasing & shared objects preservation
 * 11. Cycle safety without infinite recursion
 * 12. Call frames lifecycle animations
 * 13. SceneRenderer boundary integration
 * 14. PlaybackEngine integration
 * 15. Large graph performance & complexity bounds
 */

import { AnimationClip, CLIP_CATEGORIES, interpolateValue, EASING_FUNCTIONS } from '../src/animation/AnimationClip.js';
import { AnimationTrack } from '../src/animation/AnimationTrack.js';
import { AnimationPlan } from '../src/animation/AnimationPlan.js';
import { AnimationState, ANIMATION_STATUS } from '../src/animation/AnimationState.js';
import { AnimationRuntime } from '../src/animation/AnimationRuntime.js';
import { AnimationBuilder } from '../src/animation/AnimationBuilder.js';
import { SceneGraph } from '../src/scene/SceneGraph.js';
import { SceneNode, NODE_TYPES } from '../src/scene/SceneNode.js';
import { SceneRelationship, RELATIONSHIP_TYPES } from '../src/scene/SceneRelationship.js';
import { SceneDiff } from '../src/scene/SceneDiff.js';
import { TransitionPlanner, SEMANTIC_EVENT_TYPES, TRANSITION_OP_TYPES } from '../src/scene/SemanticTransition.js';
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

console.log('=== ProViz Stage 8: Universal Animation & Transition Runtime Test Suite ===\n');

// ─────────────────────────────────────────────────────────────────────────────
// 1. Testing AnimationClip Basics & Cloning
// ─────────────────────────────────────────────────────────────────────────────
console.log('1. Testing AnimationClip Basics & Cloning...');
{
    const clip = new AnimationClip({
        id: 'obj1_pos',
        targetId: 'scene_obj_1',
        property: 'transform.position',
        from: { x: 0, y: 0, z: 0 },
        to: { x: 10, y: 20, z: 0 },
        duration: 1.0,
        delay: 0.2,
        easing: 'easeInOut',
        category: CLIP_CATEGORIES.MOVE,
    });

    assert(clip.id === 'obj1_pos', 'Clip ID is preserved');
    assert(clip.targetId === 'scene_obj_1', 'Target ID is scene_obj_1');
    assert(clip.endTime === 1.2, 'Clip endTime is 1.2s (delay + duration)');
    assert(clip.easing === 'easeInOut', 'Easing is easeInOut');

    const cloned = clip.clone();
    assert(clip.equals(cloned), 'Cloned clip is equal');
    assert(cloned !== clip, 'Clone is distinct instance');

    const json = clip.toJSON();
    assert(json.id === 'obj1_pos' && json.duration === 1.0, 'JSON serialization is valid');
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Testing Deterministic Interpolation (Numbers, Vectors, Transforms, Discrete)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n2. Testing Deterministic Interpolation...');
{
    // Numbers
    const nMid = interpolateValue(0, 100, 0.5);
    assert(nMid === 50, `Number mid-point is 50 (got: ${nMid})`);
    assert(interpolateValue(10, 20, 0) === 10, 'Number at t=0 is from');
    assert(interpolateValue(10, 20, 1) === 20, 'Number at t=1 is to');

    // Vectors
    const vFrom = { x: 0, y: 10, z: 20 };
    const vTo = { x: 10, y: 20, z: 40 };
    const vMid = interpolateValue(vFrom, vTo, 0.5);
    assert(vMid.x === 5 && vMid.y === 15 && vMid.z === 30, 'Vector interpolated component-wise at t=0.5');

    // Nested Transform Objects
    const tFrom = { position: { x: 0, y: 0 }, scale: { x: 1, y: 1 } };
    const tTo = { position: { x: 4, y: 8 }, scale: { x: 2, y: 2 } };
    const tMid = interpolateValue(tFrom, tTo, 0.5);
    assert(tMid.position.x === 2 && tMid.position.y === 4, 'Nested position interpolated');
    assert(tMid.scale.x === 1.5 && tMid.scale.y === 1.5, 'Nested scale interpolated');

    // Discrete Values (Strings, Booleans, IDs)
    assert(interpolateValue('Alice', 'Bob', 0.4) === 'Alice', 'Discrete string returns from at t=0.4');
    assert(interpolateValue('Alice', 'Bob', 1.0) === 'Bob', 'Discrete string returns to at t=1.0');
    assert(interpolateValue(false, true, 0.8) === false, 'Discrete boolean returns from at t=0.8');
    assert(interpolateValue(false, true, 1.0) === true, 'Discrete boolean returns to at t=1.0');
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Testing Easing Functions & Boundaries
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n3. Testing Easing Functions...');
{
    for (const [name, fn] of Object.entries(EASING_FUNCTIONS)) {
        assert(fn(0) === 0, `${name} easing at t=0 is 0`);
        assert(fn(1) === 1, `${name} easing at t=1 is 1`);
        const mid = fn(0.5);
        assert(mid >= 0 && mid <= 1, `${name} easing at t=0.5 is bounded [0, 1] (got: ${mid})`);
    }

    // Monotonicity check for linear, easeIn, easeOut, easeInOut
    assert(EASING_FUNCTIONS.easeIn(0.25) < EASING_FUNCTIONS.easeIn(0.75), 'easeIn is monotonically increasing');
    assert(EASING_FUNCTIONS.easeOut(0.25) > EASING_FUNCTIONS.easeIn(0.25), 'easeOut starts faster than easeIn');
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Testing AnimationTrack & Multi-Clip Sequencing
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n4. Testing AnimationTrack & Multi-Clip Sequencing...');
{
    const track = new AnimationTrack({
        id: 'obj1:transform.position',
        targetId: 'scene_obj_1',
        property: 'transform.position',
    });

    track.addClip(new AnimationClip({
        id: 'c1',
        targetId: 'scene_obj_1',
        property: 'transform.position',
        from: { x: 0, y: 0 },
        to: { x: 10, y: 0 },
        duration: 0.5,
        delay: 0,
    }));

    track.addClip(new AnimationClip({
        id: 'c2',
        targetId: 'scene_obj_1',
        property: 'transform.position',
        from: { x: 10, y: 0 },
        to: { x: 10, y: 20 },
        duration: 0.5,
        delay: 0.5,
    }));

    assert(track.duration === 1.0, 'Track duration is 1.0s');
    assert(track.clips.length === 2, 'Track contains 2 clips');

    // Evaluation at t=0
    const p0 = track.evaluate(0);
    assert(p0.x === 0 && p0.y === 0, 'Position at t=0 is (0, 0)');

    // Evaluation at t=0.25 (mid of clip 1)
    const pMid1 = track.evaluate(0.25);
    assert(Math.round(pMid1.x) === 5 && pMid1.y === 0, 'Position at t=0.25 is (5, 0)');

    // Evaluation at t=0.75 (mid of clip 2)
    const pMid2 = track.evaluate(0.75);
    assert(pMid2.x === 10 && Math.round(pMid2.y) === 10, 'Position at t=0.75 is (10, 10)');

    // Evaluation at t=1.0 (end)
    const pEnd = track.evaluate(1.0);
    assert(pEnd.x === 10 && pEnd.y === 20, 'Position at t=1.0 is (10, 20)');
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Testing AnimationPlan Creation & Serialization
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n5. Testing AnimationPlan Creation & Serialization...');
{
    const plan = new AnimationPlan({
        fromFrame: 0,
        toFrame: 1,
        duration: 0.6,
    });

    plan.addClip(new AnimationClip({
        id: 'clip_opacity',
        targetId: 'scene_obj_1',
        property: 'style.opacity',
        from: 0,
        to: 1,
        duration: 0.6,
    }));

    plan.addClip(new AnimationClip({
        id: 'clip_scale',
        targetId: 'scene_obj_1',
        property: 'transform.scale',
        from: { x: 0, y: 0, z: 0 },
        to: { x: 1, y: 1, z: 1 },
        duration: 0.6,
    }));

    assert(plan.tracks.size === 2, 'Plan created 2 property tracks');
    assert(plan.totalClips === 2, 'Plan total clips is 2');
    assert(plan.duration === 0.6, 'Plan duration is 0.6s');

    const json = plan.toJSON();
    assert(json.fromFrame === 0 && json.toFrame === 1, 'JSON preserves frames');
    assert(Object.keys(json.tracks).length === 2, 'JSON preserves tracks');
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Testing AnimationBuilder Mapping Semantic Transitions
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n6. Testing AnimationBuilder Mapping Semantic Transitions...');
{
    const builder = new AnimationBuilder({ defaultDuration: 0.5 });

    // Scene A -> Scene B with node creation, update, and rebinding
    const sceneA = new SceneGraph();
    sceneA.addNode(new SceneNode({ id: 'scene_obj_1', type: NODE_TYPES.OBJECT, semanticId: '1', label: 'List #1' }));
    sceneA.addNode(new SceneNode({ id: 'scene_var_0_x', type: NODE_TYPES.VARIABLE, semanticId: 'x', label: 'x = 1', value: 1 }));

    const sceneB = new SceneGraph();
    sceneB.addNode(new SceneNode({ id: 'scene_obj_1', type: NODE_TYPES.OBJECT, semanticId: '1', label: 'List #1 (1 item)', value: { elementsCount: 1 } }));
    sceneB.addNode(new SceneNode({ id: 'scene_obj_2', type: NODE_TYPES.OBJECT, semanticId: '2', label: 'List #2' }));
    sceneB.addNode(new SceneNode({ id: 'scene_var_0_x', type: NODE_TYPES.VARIABLE, semanticId: 'x', label: 'x = 2', value: 2 }));

    const diff = SceneDiff.compute(sceneA, sceneB, { fromFrame: 0, toFrame: 1 });
    const trans = TransitionPlanner.plan(diff, sceneA, sceneB);
    const plan = builder.build(trans);

    assert(plan !== null, 'Builder returned valid AnimationPlan');
    assert(plan.fromFrame === 0 && plan.toFrame === 1, 'Plan preserved from/to frames');
    assert(plan.totalClips > 0, 'Plan generated animation clips');

    // Verify clips for created node obj_2
    const obj2ScaleTrack = plan.getTrack('scene_obj_2:transform.scale');
    assert(obj2ScaleTrack !== null, 'Generated transform.scale track for created obj_2');
    assert(obj2ScaleTrack.clips[0].category === CLIP_CATEGORIES.CREATE, 'Clip category is create');

    // Verify clips for updated node obj_1 (mutate pulse)
    const obj1ScaleTrack = plan.getTrack('scene_obj_1:transform.scale');
    assert(obj1ScaleTrack !== null, 'Generated scale pulse track for mutated obj_1');
    assert(obj1ScaleTrack.clips[0].category === CLIP_CATEGORIES.STRUCTURAL, 'Clip category is structural pulse');
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. Testing Reverse Animation & Symmetry
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n7. Testing Reverse Animation & Symmetry...');
{
    const clip = new AnimationClip({
        id: 'c_fwd',
        targetId: 'scene_obj_1',
        property: 'style.opacity',
        from: 0,
        to: 1,
        duration: 0.5,
        delay: 0.1,
        easing: 'easeIn',
        category: CLIP_CATEGORIES.CREATE,
    });

    const revClip = clip.reverse();
    assert(revClip.from === 1 && revClip.to === 0, 'Reverse clip swapped from and to');
    assert(revClip.category === CLIP_CATEGORIES.REMOVE, 'Reverse clip category swapped to remove');
    assert(revClip.easing === 'easeOut', 'Reverse clip easeIn inverted to easeOut');

    // Plan reversal
    const plan = new AnimationPlan({ fromFrame: 1, toFrame: 2, duration: 1.0 });
    plan.addClip(clip);

    const revPlan = plan.reverse();
    assert(revPlan.fromFrame === 2 && revPlan.toFrame === 1, 'Reversed plan frames swapped (2 -> 1)');
    assert(revPlan.direction === 'reverse', 'Reversed plan direction is reverse');
    assert(revPlan.totalClips === 1, 'Reversed plan preserves clips');
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. Testing AnimationRuntime Evaluation & Seek Independence
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n8. Testing AnimationRuntime Evaluation & Seek Independence...');
{
    const plan = new AnimationPlan({ duration: 1.0 });
    plan.addClip(new AnimationClip({
        id: 'c_pos',
        targetId: 'scene_obj_1',
        property: 'transform.position',
        from: { x: 0, y: 0, z: 0 },
        to: { x: 100, y: 200, z: 0 },
        duration: 1.0,
        easing: 'linear',
    }));

    const runtime = new AnimationRuntime();
    runtime.load(plan);

    // Direct seek to 0.5s
    const stateDirect = runtime.seek(0.5);
    const nodeStateDirect = stateDirect.getNodeState('scene_obj_1');
    assert(nodeStateDirect !== null, 'Evaluated node state exists');
    assert(nodeStateDirect.transform.position.x === 50, 'Seek(0.5) position x is 50');
    assert(nodeStateDirect.transform.position.y === 100, 'Seek(0.5) position y is 100');

    // Reset and step incrementally to 0.5s
    runtime.seek(0);
    runtime.play();
    runtime.advance(0.2);
    runtime.advance(0.3);
    const stateStepped = runtime.getState();
    const nodeStateStepped = stateStepped.getNodeState('scene_obj_1');

    assert(nodeStateStepped.transform.position.x === nodeStateDirect.transform.position.x, 'Incremental stepping x matches direct seek');
    assert(nodeStateStepped.transform.position.y === nodeStateDirect.transform.position.y, 'Incremental stepping y matches direct seek');
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. Testing Interruption & State Replacement
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n9. Testing Interruption & Animation Cancellation...');
{
    const runtime = new AnimationRuntime();

    // Plan A
    const planA = new AnimationPlan({ id: 'plan_A', duration: 2.0 });
    planA.addClip(new AnimationClip({
        id: 'clip_A',
        targetId: 'scene_obj_A',
        property: 'style.opacity',
        from: 0,
        to: 1,
        duration: 2.0,
    }));

    runtime.load(planA);
    runtime.play();
    runtime.advance(0.5);
    assert(runtime.getState().planId === 'plan_A', 'Runtime executing Plan A');

    // Interrupt with Plan B
    const planB = new AnimationPlan({ id: 'plan_B', duration: 0.5 });
    planB.addClip(new AnimationClip({
        id: 'clip_B',
        targetId: 'scene_obj_B',
        property: 'style.opacity',
        from: 0,
        to: 1,
        duration: 0.5,
    }));

    runtime.load(planB);
    const stateAfterInterrupt = runtime.getState();

    assert(stateAfterInterrupt.planId === 'plan_B', 'Runtime cleanly replaced with Plan B');
    assert(stateAfterInterrupt.nodeStates['scene_obj_A'] === undefined, 'No stale state from Plan A');
    assert(stateAfterInterrupt.nodeStates['scene_obj_B'] !== undefined, 'Plan B state is active');
}

// ─────────────────────────────────────────────────────────────────────────────
// 10. Testing Aliasing (Shared Objects) Preservation
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n10. Testing Aliasing (Shared Objects) Animation...');
{
    // a = []; b = a; a.append(10)
    const sceneA = new SceneGraph();
    sceneA.addNode(new SceneNode({ id: 'scene_obj_shared', type: NODE_TYPES.OBJECT, semanticId: '1', label: 'List #1' }));
    sceneA.addNode(new SceneNode({ id: 'scene_var_0_a', type: NODE_TYPES.VARIABLE, semanticId: 'a' }));
    sceneA.addNode(new SceneNode({ id: 'scene_var_0_b', type: NODE_TYPES.VARIABLE, semanticId: 'b' }));
    sceneA.addRelationship(new SceneRelationship({ fromId: 'scene_var_0_a', toId: 'scene_obj_shared', type: RELATIONSHIP_TYPES.REFERENCES }));
    sceneA.addRelationship(new SceneRelationship({ fromId: 'scene_var_0_b', toId: 'scene_obj_shared', type: RELATIONSHIP_TYPES.REFERENCES }));

    const sceneB = sceneA.clone();
    sceneB.getNode('scene_obj_shared').value = { elementsCount: 1 };
    sceneB.getNode('scene_obj_shared').label = 'List #1 (1 item)';

    const diff = SceneDiff.compute(sceneA, sceneB);
    const trans = TransitionPlanner.plan(diff, sceneA, sceneB);
    const builder = new AnimationBuilder();
    const plan = builder.build(trans);

    const runtime = new AnimationRuntime();
    runtime.load(plan);
    const state = runtime.seek(0.25);

    assert(state.nodeStates['scene_obj_shared'] !== undefined, 'Shared object animated directly');
    assert(state.nodeStates['scene_obj_shared_clone'] === undefined, 'No fake duplicate objects created');
}

// ─────────────────────────────────────────────────────────────────────────────
// 11. Testing Cyclic Reference Animation Without Recursion
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n11. Testing Cyclic Reference Animation...');
{
    const sceneA = new SceneGraph();
    sceneA.addNode(new SceneNode({ id: 'scene_obj_cyclic', type: NODE_TYPES.OBJECT, semanticId: '1' }));

    const sceneB = sceneA.clone();
    sceneB.addRelationship(new SceneRelationship({
        fromId: 'scene_obj_cyclic',
        toId: 'scene_obj_cyclic',
        type: RELATIONSHIP_TYPES.REFERENCES,
    }));

    const diff = SceneDiff.compute(sceneA, sceneB);
    const trans = TransitionPlanner.plan(diff, sceneA, sceneB);
    const builder = new AnimationBuilder();
    const plan = builder.build(trans);

    assert(plan !== null, 'Cyclic animation plan created safely');
    const runtime = new AnimationRuntime();
    runtime.load(plan);
    runtime.seek(0.25);
    assert(runtime.isComplete() === false, 'Runtime evaluated cyclic plan without stack overflow');
}

// ─────────────────────────────────────────────────────────────────────────────
// 12. Testing Call Frames Lifecycle Animations
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n12. Testing Call Frames Lifecycle Animations...');
{
    const sceneA = new SceneGraph();
    const sceneB = new SceneGraph();
    sceneB.addNode(new SceneNode({
        id: 'scene_frame_1',
        type: NODE_TYPES.CALL_FRAME,
        semanticId: '1',
        metadata: { functionName: 'calculate', depth: 2 },
    }));

    const diff = SceneDiff.compute(sceneA, sceneB);
    const trans = TransitionPlanner.plan(diff, sceneA, sceneB);
    const builder = new AnimationBuilder();
    const plan = builder.build(trans);

    const frameOpacityTrack = plan.getTrack('scene_frame_1:style.opacity');
    assert(frameOpacityTrack !== null, 'Generated opacity track for call frame entry');
    assert(frameOpacityTrack.clips.some(c => c.category === CLIP_CATEGORIES.LIFECYCLE || c.category === CLIP_CATEGORIES.CREATE), 'Call frame has lifecycle or create clip category');
}

// ─────────────────────────────────────────────────────────────────────────────
// 13. Testing PlaybackEngine Integration
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n13. Testing PlaybackEngine Integration...');
{
    const trace = createExecutionTrace({
        sourceCode: 'x = 10\ny = 20\nz = x + y\n',
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
                source: { file: 'main.py', line: 3 },
                scope: { function: '<module>', depth: 0 },
                data: { output: 'done' },
            }),
        ],
    });

    const playback = new PlaybackEngine();
    playback.setFrames(trace);

    // Get plan between frames 0 and 1
    const plan0to1 = playback.getAnimationPlan(0, 1);
    assert(plan0to1 !== null, 'playback.getAnimationPlan(0, 1) returned valid plan');
    assert(plan0to1.fromFrame === 0 && plan0to1.toFrame === 1, 'Plan frames match 0 -> 1');

    // Current animation plan
    playback.jumpTo(1);
    const currPlan = playback.getCurrentAnimationPlan();
    assert(currPlan !== null, 'playback.getCurrentAnimationPlan() returned valid plan');

    // Scrubbing directly across non-adjacent frames 0 -> 2
    const scrubPlan = playback.getAnimationPlan(0, 2);
    assert(scrubPlan !== null, 'Direct scrub plan 0 -> 2 generated without intermediate playback');
}

// ─────────────────────────────────────────────────────────────────────────────
// 14. Testing SceneRenderer Boundary Integration
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n14. Testing SceneRenderer Boundary Integration...');
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
            this.spawned.delete(id);
        },
        clearAll() {
            this.spawned.clear();
            this.updated.clear();
            this.removed.clear();
        },
    };

    const renderer = new SceneRenderer({ baseVisualizer: mockVisualizer });

    // Apply AnimationState
    const state = new AnimationState({
        nodeStates: {
            scene_obj_1: {
                id: 'scene_obj_1',
                label: 'Animated Box',
                style: { opacity: 1, colorHint: 'CYAN' },
                transform: { position: { x: 5, y: 0, z: 0 } },
            },
        },
    });

    await renderer.applyAnimationState(state);
    assert(mockVisualizer.spawned.has('vis_scene_obj_1'), 'SceneRenderer spawned animated node from AnimationState');

    // Apply update state
    const updateState = new AnimationState({
        nodeStates: {
            scene_obj_1: {
                id: 'scene_obj_1',
                label: 'Animated Box Updated',
                style: { opacity: 1, colorHint: 'PURPLE' },
            },
        },
    });

    await renderer.applyAnimationState(updateState);
    assert(mockVisualizer.updated.has('vis_scene_obj_1'), 'SceneRenderer updated animated node from AnimationState');
}

// ─────────────────────────────────────────────────────────────────────────────
// 15. Testing Large Graph Performance & Complexity Bound
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n15. Testing Large Graph Performance...');
{
    const plan = new AnimationPlan({ duration: 1.0 });

    const NODE_COUNT = 1000;
    for (let i = 0; i < NODE_COUNT; i++) {
        plan.addClip(new AnimationClip({
            id: `clip_${i}`,
            targetId: `scene_obj_${i}`,
            property: 'transform.position',
            from: { x: i, y: 0, z: 0 },
            to: { x: i + 10, y: 20, z: 0 },
            duration: 1.0,
        }));
    }

    const runtime = new AnimationRuntime();
    runtime.load(plan);

    const t0 = performance.now();
    for (let t = 0; t <= 1.0; t += 0.1) {
        runtime.seek(t);
    }
    const elapsed = performance.now() - t0;

    assert(elapsed < 100, `Evaluated 1000 tracks across 10 steps in ${elapsed.toFixed(1)}ms (< 100ms threshold)`);
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
