/**
 * Stage 7 Test Suite — Universal Scene Diff & Semantic Transition Engine
 *
 * Verification Requirements:
 *  1. Empty scene → empty scene
 *  2. Node creation
 *  3. Node deletion
 *  4. Node update (value, label, transform, style, metadata)
 *  5. Variable creation
 *  6. Variable deletion
 *  7. Variable rebinding
 *  8. Primitive value change
 *  9. Collection mutation
 * 10. Relationship creation
 * 11. Relationship deletion
 * 12. Relationship target change
 * 13. Alias creation
 * 14. Alias removal
 * 15. Object creation
 * 16. Object disappearance
 * 17. Scope entry
 * 18. Scope exit
 * 19. Call frame entry
 * 20. Call frame exit
 * 21. Nested objects
 * 22. Shared objects
 * 23. Cycles
 * 24. Dictionaries
 * 25. Sets
 * 26. Custom instances
 * 27. Forward transition
 * 28. Reverse transition
 * 29. Arbitrary non-adjacent frames
 * 30. Deterministic output
 * 31. Large graph performance/bounded behavior
 * 32. SceneRenderer boundary
 * 33. PlaybackEngine integration
 */

import { SceneDiff, getRelationshipKey } from '../src/scene/SceneDiff.js';
import {
    SemanticTransitionPlan,
    TransitionPlanner,
    SEMANTIC_EVENT_TYPES,
    TRANSITION_OP_TYPES,
} from '../src/scene/SemanticTransition.js';
import { SceneGraph } from '../src/scene/SceneGraph.js';
import { SceneNode, NODE_TYPES } from '../src/scene/SceneNode.js';
import { SceneRelationship, RELATIONSHIP_TYPES } from '../src/scene/SceneRelationship.js';
import { SceneBuilder } from '../src/scene/SceneBuilder.js';
import { SceneRenderer } from '../src/rendering/SceneRenderer.js';
import { PlaybackEngine } from '../src/PlaybackEngine.js';
import { RuntimeState } from '../src/runtime/RuntimeState.js';
import { Heap } from '../src/runtime/Heap.js';
import { HeapObject } from '../src/runtime/HeapObject.js';
import { CallFrame } from '../src/runtime/CallFrame.js';
import { createPrimitiveValue, createReferenceValue } from '../src/runtime/Value.js';
import { TRACE_SCHEMA_VERSION, EVENT_TYPES, createTraceEvent, createExecutionTrace } from '../src/trace/TraceSchema.js';

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

console.log('=== ProViz Stage 7: Universal Scene Diff & Semantic Transition Test Suite ===\n');

// ─────────────────────────────────────────────────────────────────────────────
// 1. Testing Empty Scene → Empty Scene
// ─────────────────────────────────────────────────────────────────────────────
console.log('1. Testing Empty Scene → Empty Scene...');
{
    const sceneA = new SceneGraph();
    const sceneB = new SceneGraph();

    const diff = SceneDiff.compute(sceneA, sceneB, { fromFrame: 0, toFrame: 1 });
    assert(diff.isEmpty === true, 'Empty scene diff isEmpty is true');
    assert(diff.totalChanges === 0, 'Total changes is 0');
    assert(diff.addedNodes.length === 0, 'No added nodes');
    assert(diff.removedNodes.length === 0, 'No removed nodes');
    assert(diff.updatedNodes.length === 0, 'No updated nodes');

    const plan = TransitionPlanner.plan(diff, sceneA, sceneB);
    assert(plan.isNoOp === true, 'Empty transition plan isNoOp is true');
    assert(plan.events.length === 0, 'Zero events in empty transition');
    assert(plan.operations.length === 0, 'Zero operations in empty transition');
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Testing Node Creation & Deletion
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n2. Testing Node Creation & Deletion...');
{
    const sceneA = new SceneGraph();
    const sceneB = new SceneGraph();

    const node1 = new SceneNode({
        id: 'scene_obj_1',
        type: NODE_TYPES.OBJECT,
        semanticId: '1',
        label: 'List #1',
        value: { type: 'list', elementsCount: 0 },
    });
    sceneB.addNode(node1);

    // Forward (Creation)
    const diffForward = SceneDiff.compute(sceneA, sceneB);
    assert(diffForward.addedNodes.length === 1, 'Added 1 node forward');
    assert(diffForward.addedNodes[0].id === 'scene_obj_1', 'Added node is scene_obj_1');
    assert(diffForward.removedNodes.length === 0, 'No removed nodes forward');

    const planForward = TransitionPlanner.plan(diffForward, sceneA, sceneB);
    assert(planForward.hasEventType(SEMANTIC_EVENT_TYPES.NODE_ADDED), 'Emitted NODE_ADDED event');
    assert(planForward.hasEventType(SEMANTIC_EVENT_TYPES.OBJECT_CREATED), 'Emitted OBJECT_CREATED event');
    assert(planForward.getOperationsByType(TRANSITION_OP_TYPES.CREATE_NODE).length === 1, 'Emitted CREATE_NODE operation');

    // Reverse (Deletion)
    const diffReverse = SceneDiff.compute(sceneB, sceneA);
    assert(diffReverse.removedNodes.length === 1, 'Removed 1 node reverse');
    assert(diffReverse.removedNodes[0].id === 'scene_obj_1', 'Removed node is scene_obj_1');
    assert(diffReverse.addedNodes.length === 0, 'No added nodes reverse');

    const planReverse = TransitionPlanner.plan(diffReverse, sceneB, sceneA);
    assert(planReverse.hasEventType(SEMANTIC_EVENT_TYPES.NODE_REMOVED), 'Emitted NODE_REMOVED event');
    assert(planReverse.hasEventType(SEMANTIC_EVENT_TYPES.OBJECT_REMOVED), 'Emitted OBJECT_REMOVED event');
    assert(planReverse.getOperationsByType(TRANSITION_OP_TYPES.REMOVE_NODE).length === 1, 'Emitted REMOVE_NODE operation');
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Testing Node Updates (Value, Label, Transform, Style, Metadata)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n3. Testing Node Updates...');
{
    const sceneA = new SceneGraph();
    const nodeA = new SceneNode({
        id: 'scene_obj_1',
        type: NODE_TYPES.OBJECT,
        semanticId: '1',
        label: 'List #1 (0 items)',
        value: { elementsCount: 0 },
        transform: { position: { x: 0, y: 0, z: 0 } },
        style: { emphasis: 'default', colorHint: 'BLUE' },
        metadata: { tag: 'initial' },
    });
    sceneA.addNode(nodeA);

    const sceneB = new SceneGraph();
    const nodeB = new SceneNode({
        id: 'scene_obj_1',
        type: NODE_TYPES.OBJECT,
        semanticId: '1',
        label: 'List #1 (1 items)',
        value: { elementsCount: 1 },
        transform: { position: { x: 2, y: 0, z: 0 } },
        style: { emphasis: 'active', colorHint: 'GREEN' },
        metadata: { tag: 'mutated' },
    });
    sceneB.addNode(nodeB);

    const diff = SceneDiff.compute(sceneA, sceneB);
    assert(diff.updatedNodes.length === 1, 'Updated 1 node');
    assert(diff.updatedNodes[0].changes.value !== undefined, 'Detected value change');
    assert(diff.updatedNodes[0].changes.label !== undefined, 'Detected label change');
    assert(diff.updatedNodes[0].changes.transform !== undefined, 'Detected transform change');
    assert(diff.updatedNodes[0].changes.style !== undefined, 'Detected style change');
    assert(diff.updatedNodes[0].changes.metadata !== undefined, 'Detected metadata change');

    const plan = TransitionPlanner.plan(diff, sceneA, sceneB);
    assert(plan.hasEventType(SEMANTIC_EVENT_TYPES.OBJECT_MUTATED), 'Emitted OBJECT_MUTATED event');
    assert(plan.hasEventType(SEMANTIC_EVENT_TYPES.NODE_TRANSFORM_CHANGED), 'Emitted NODE_TRANSFORM_CHANGED event');
    assert(plan.hasEventType(SEMANTIC_EVENT_TYPES.NODE_STYLE_CHANGED), 'Emitted NODE_STYLE_CHANGED event');
    assert(plan.getOperationsByType(TRANSITION_OP_TYPES.UPDATE_NODE).length === 1, 'Emitted UPDATE_NODE operation');
    assert(plan.getOperationsByType(TRANSITION_OP_TYPES.MUTATE_OBJECT).length === 1, 'Emitted MUTATE_OBJECT operation');
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Testing Variable Creation, Deletion & Value Changes (x = 1 -> x = 2)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n4. Testing Variable Lifecycle & Primitive Value Changes...');
{
    const sceneA = new SceneGraph();
    const varNodeA = new SceneNode({
        id: 'scene_var_0_x',
        type: NODE_TYPES.VARIABLE,
        semanticId: 'x',
        label: 'x = 1',
        value: createPrimitiveValue('int', 1),
        metadata: { varName: 'x', scope: 'main' },
    });
    sceneA.addNode(varNodeA);

    const sceneB = new SceneGraph();
    const varNodeB = new SceneNode({
        id: 'scene_var_0_x',
        type: NODE_TYPES.VARIABLE,
        semanticId: 'x',
        label: 'x = 2',
        value: createPrimitiveValue('int', 2),
        metadata: { varName: 'x', scope: 'main' },
    });
    sceneB.addNode(varNodeB);

    const diff = SceneDiff.compute(sceneA, sceneB);
    assert(diff.updatedNodes.length === 1, 'Variable node updated');
    assert(diff.addedNodes.length === 0, 'No variable re-created');
    assert(diff.removedNodes.length === 0, 'No variable deleted');

    const plan = TransitionPlanner.plan(diff, sceneA, sceneB);
    assert(plan.hasEventType(SEMANTIC_EVENT_TYPES.VARIABLE_VALUE_CHANGED), 'Emitted VARIABLE_VALUE_CHANGED event');
    const valEvent = plan.getEventsByType(SEMANTIC_EVENT_TYPES.VARIABLE_VALUE_CHANGED)[0];
    assert(valEvent.varName === 'x', 'Event varName is x');
    assert(valEvent.fromValue.value === 1, 'fromValue is 1');
    assert(valEvent.toValue.value === 2, 'toValue is 2');
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Testing Variable Rebinding (b = a -> b = [])
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n5. Testing Variable Rebinding...');
{
    // Scene A: a and b both point to obj_1
    const sceneA = new SceneGraph();
    sceneA.addNode(new SceneNode({ id: 'scene_obj_1', type: NODE_TYPES.OBJECT, semanticId: '1', label: 'List #1' }));
    sceneA.addNode(new SceneNode({ id: 'scene_var_0_a', type: NODE_TYPES.VARIABLE, semanticId: 'a', label: 'a = list' }));
    sceneA.addNode(new SceneNode({ id: 'scene_var_0_b', type: NODE_TYPES.VARIABLE, semanticId: 'b', label: 'b = list' }));
    sceneA.addRelationship(new SceneRelationship({ fromId: 'scene_var_0_a', toId: 'scene_obj_1', type: RELATIONSHIP_TYPES.REFERENCES, label: 'a' }));
    sceneA.addRelationship(new SceneRelationship({ fromId: 'scene_var_0_b', toId: 'scene_obj_1', type: RELATIONSHIP_TYPES.REFERENCES, label: 'b' }));

    // Scene B: b rebound to obj_2
    const sceneB = new SceneGraph();
    sceneB.addNode(new SceneNode({ id: 'scene_obj_1', type: NODE_TYPES.OBJECT, semanticId: '1', label: 'List #1' }));
    sceneB.addNode(new SceneNode({ id: 'scene_obj_2', type: NODE_TYPES.OBJECT, semanticId: '2', label: 'List #2' }));
    sceneB.addNode(new SceneNode({ id: 'scene_var_0_a', type: NODE_TYPES.VARIABLE, semanticId: 'a', label: 'a = list' }));
    sceneB.addNode(new SceneNode({ id: 'scene_var_0_b', type: NODE_TYPES.VARIABLE, semanticId: 'b', label: 'b = list' }));
    sceneB.addRelationship(new SceneRelationship({ fromId: 'scene_var_0_a', toId: 'scene_obj_1', type: RELATIONSHIP_TYPES.REFERENCES, label: 'a' }));
    sceneB.addRelationship(new SceneRelationship({ fromId: 'scene_var_0_b', toId: 'scene_obj_2', type: RELATIONSHIP_TYPES.REFERENCES, label: 'b' }));

    const diff = SceneDiff.compute(sceneA, sceneB);
    assert(diff.addedNodes.length === 1 && diff.addedNodes[0].id === 'scene_obj_2', 'Detected new object obj_2');
    assert(diff.updatedRelationships.length === 1, 'Detected 1 updated relationship');
    assert(diff.updatedRelationships[0].targetChanged === true, 'Target changed is true');
    assert(diff.updatedRelationships[0].changes.toId.from === 'scene_obj_1', 'from target is scene_obj_1');
    assert(diff.updatedRelationships[0].changes.toId.to === 'scene_obj_2', 'to target is scene_obj_2');

    const plan = TransitionPlanner.plan(diff, sceneA, sceneB);
    assert(plan.hasEventType(SEMANTIC_EVENT_TYPES.VARIABLE_REBOUND), 'Emitted VARIABLE_REBOUND event');
    const rebindEvent = plan.getEventsByType(SEMANTIC_EVENT_TYPES.VARIABLE_REBOUND)[0];
    assert(rebindEvent.nodeId === 'scene_var_0_b', 'Rebound variable is scene_var_0_b');
    assert(rebindEvent.fromTarget === 'scene_obj_1', 'fromTarget is scene_obj_1');
    assert(rebindEvent.toTarget === 'scene_obj_2', 'toTarget is scene_obj_2');
    assert(plan.getOperationsByType(TRANSITION_OP_TYPES.REBIND_VARIABLE).length === 1, 'Emitted REBIND_VARIABLE op');
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Testing Aliasing Detection (Creation & Removal)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n6. Testing Aliasing Transitions...');
{
    // Scene 0: only 'a' references obj_1
    const scene0 = new SceneGraph();
    scene0.addNode(new SceneNode({ id: 'scene_obj_1', type: NODE_TYPES.OBJECT, semanticId: '1' }));
    scene0.addNode(new SceneNode({ id: 'scene_var_0_a', type: NODE_TYPES.VARIABLE, semanticId: 'a' }));
    scene0.addRelationship(new SceneRelationship({ fromId: 'scene_var_0_a', toId: 'scene_obj_1', type: RELATIONSHIP_TYPES.REFERENCES }));

    // Scene 1: 'b = a' added -> b also references obj_1
    const scene1 = scene0.clone();
    scene1.addNode(new SceneNode({ id: 'scene_var_0_b', type: NODE_TYPES.VARIABLE, semanticId: 'b' }));
    scene1.addRelationship(new SceneRelationship({ fromId: 'scene_var_0_b', toId: 'scene_obj_1', type: RELATIONSHIP_TYPES.REFERENCES }));

    // Scene 0 -> Scene 1: Alias Created
    const diffAliasCreate = SceneDiff.compute(scene0, scene1);
    const planAliasCreate = TransitionPlanner.plan(diffAliasCreate, scene0, scene1);
    assert(planAliasCreate.hasEventType(SEMANTIC_EVENT_TYPES.ALIAS_CREATED), 'Emitted ALIAS_CREATED');
    const aliasCreateEvent = planAliasCreate.getEventsByType(SEMANTIC_EVENT_TYPES.ALIAS_CREATED)[0];
    assert(aliasCreateEvent.targetObjectId === 'scene_obj_1', 'Target is scene_obj_1');
    assert(aliasCreateEvent.referrers.length === 2, 'Has 2 referrers');

    // Scene 1 -> Scene 0: Alias Removed
    const diffAliasRemove = SceneDiff.compute(scene1, scene0);
    const planAliasRemove = TransitionPlanner.plan(diffAliasRemove, scene1, scene0);
    assert(planAliasRemove.hasEventType(SEMANTIC_EVENT_TYPES.ALIAS_REMOVED), 'Emitted ALIAS_REMOVED');
    const aliasRemoveEvent = planAliasRemove.getEventsByType(SEMANTIC_EVENT_TYPES.ALIAS_REMOVED)[0];
    assert(aliasRemoveEvent.targetObjectId === 'scene_obj_1', 'Target is scene_obj_1');
    assert(aliasRemoveEvent.remainingReferrers.length === 1, '1 remaining referrer');
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. Testing Collection Mutations & Relationships (List append, pop, element ref)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n7. Testing Collection Mutations & Relationships...');
{
    const sceneA = new SceneGraph();
    sceneA.addNode(new SceneNode({ id: 'scene_obj_list', type: NODE_TYPES.OBJECT, semanticId: '1', value: { elementsCount: 1 } }));
    sceneA.addNode(new SceneNode({ id: 'scene_obj_item1', type: NODE_TYPES.OBJECT, semanticId: '2' }));
    sceneA.addRelationship(new SceneRelationship({ fromId: 'scene_obj_list', toId: 'scene_obj_item1', type: RELATIONSHIP_TYPES.REFERENCES, label: '[0]', metadata: { index: 0 } }));

    // Scene B: append item2 at index 1
    const sceneB = sceneA.clone();
    sceneB.getNode('scene_obj_list').value = { elementsCount: 2 };
    sceneB.addNode(new SceneNode({ id: 'scene_obj_item2', type: NODE_TYPES.OBJECT, semanticId: '3' }));
    sceneB.addRelationship(new SceneRelationship({ fromId: 'scene_obj_list', toId: 'scene_obj_item2', type: RELATIONSHIP_TYPES.REFERENCES, label: '[1]', metadata: { index: 1 } }));

    const diff = SceneDiff.compute(sceneA, sceneB);
    assert(diff.addedRelationships.length === 1, 'Added 1 relationship');
    assert(diff.addedRelationships[0].metadata.index === 1, 'Added relationship at index 1');

    const plan = TransitionPlanner.plan(diff, sceneA, sceneB);
    assert(plan.hasEventType(SEMANTIC_EVENT_TYPES.COLLECTION_ELEMENT_ADDED), 'Emitted COLLECTION_ELEMENT_ADDED');
    const elemEvent = plan.getEventsByType(SEMANTIC_EVENT_TYPES.COLLECTION_ELEMENT_ADDED)[0];
    assert(elemEvent.index === 1, 'Element event index is 1');
    assert(elemEvent.targetId === 'scene_obj_item2', 'Element target is scene_obj_item2');
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. Testing Dictionaries & Dict Entry Target Updates
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n8. Testing Dictionaries & Dict Mutations...');
{
    const sceneA = new SceneGraph();
    sceneA.addNode(new SceneNode({ id: 'scene_obj_dict', type: NODE_TYPES.OBJECT, semanticId: 'd', value: { entriesCount: 1 } }));
    sceneA.addNode(new SceneNode({ id: 'scene_obj_valA', type: NODE_TYPES.OBJECT, semanticId: 'va' }));
    sceneA.addNode(new SceneNode({ id: 'scene_obj_valB', type: NODE_TYPES.OBJECT, semanticId: 'vb' }));
    sceneA.addRelationship(new SceneRelationship({ fromId: 'scene_obj_dict', toId: 'scene_obj_valA', type: RELATIONSHIP_TYPES.REFERENCES, label: "'x'", metadata: { key: "'x'" } }));

    // Scene B: d["x"] changed to valB
    const sceneB = new SceneGraph();
    sceneB.addNode(new SceneNode({ id: 'scene_obj_dict', type: NODE_TYPES.OBJECT, semanticId: 'd', value: { entriesCount: 1 } }));
    sceneB.addNode(new SceneNode({ id: 'scene_obj_valA', type: NODE_TYPES.OBJECT, semanticId: 'va' }));
    sceneB.addNode(new SceneNode({ id: 'scene_obj_valB', type: NODE_TYPES.OBJECT, semanticId: 'vb' }));
    sceneB.addRelationship(new SceneRelationship({ fromId: 'scene_obj_dict', toId: 'scene_obj_valB', type: RELATIONSHIP_TYPES.REFERENCES, label: "'x'", metadata: { key: "'x'" } }));

    const diff = SceneDiff.compute(sceneA, sceneB);
    assert(diff.updatedRelationships.length === 1, 'Updated dict relationship');
    assert(diff.updatedRelationships[0].targetChanged === true, 'Dict target changed');

    const plan = TransitionPlanner.plan(diff, sceneA, sceneB);
    assert(plan.hasEventType(SEMANTIC_EVENT_TYPES.COLLECTION_ELEMENT_CHANGED), 'Emitted COLLECTION_ELEMENT_CHANGED for dict');
    const changeEvent = plan.getEventsByType(SEMANTIC_EVENT_TYPES.COLLECTION_ELEMENT_CHANGED)[0];
    assert(changeEvent.key === "'x'", 'Key is "x"');
    assert(changeEvent.fromTargetId === 'scene_obj_valA', 'From target is valA');
    assert(changeEvent.toTargetId === 'scene_obj_valB', 'To target is valB');
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. Testing Custom Class Instances & Attributes
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n9. Testing Custom Class Instances & Attributes...');
{
    const sceneA = new SceneGraph();
    sceneA.addNode(new SceneNode({ id: 'scene_obj_node', type: NODE_TYPES.OBJECT, semanticId: 'node1', value: { className: 'Node', fieldsCount: 1 } }));
    sceneA.addNode(new SceneNode({ id: 'scene_obj_childA', type: NODE_TYPES.OBJECT, semanticId: 'c1' }));
    sceneA.addNode(new SceneNode({ id: 'scene_obj_childB', type: NODE_TYPES.OBJECT, semanticId: 'c2' }));
    sceneA.addRelationship(new SceneRelationship({ fromId: 'scene_obj_node', toId: 'scene_obj_childA', type: RELATIONSHIP_TYPES.REFERENCES, label: 'next', metadata: { field: 'next' } }));

    const sceneB = new SceneGraph();
    sceneB.addNode(new SceneNode({ id: 'scene_obj_node', type: NODE_TYPES.OBJECT, semanticId: 'node1', value: { className: 'Node', fieldsCount: 1 } }));
    sceneB.addNode(new SceneNode({ id: 'scene_obj_childA', type: NODE_TYPES.OBJECT, semanticId: 'c1' }));
    sceneB.addNode(new SceneNode({ id: 'scene_obj_childB', type: NODE_TYPES.OBJECT, semanticId: 'c2' }));
    sceneB.addRelationship(new SceneRelationship({ fromId: 'scene_obj_node', toId: 'scene_obj_childB', type: RELATIONSHIP_TYPES.REFERENCES, label: 'next', metadata: { field: 'next' } }));

    const diff = SceneDiff.compute(sceneA, sceneB);
    assert(diff.updatedRelationships.length === 1, 'Updated field relationship');

    const plan = TransitionPlanner.plan(diff, sceneA, sceneB);
    assert(plan.hasEventType(SEMANTIC_EVENT_TYPES.OBJECT_FIELD_CHANGED), 'Emitted OBJECT_FIELD_CHANGED');
    const fieldEvent = plan.getEventsByType(SEMANTIC_EVENT_TYPES.OBJECT_FIELD_CHANGED)[0];
    assert(fieldEvent.field === 'next', 'Field name is next');
    assert(fieldEvent.fromTargetId === 'scene_obj_childA', 'fromTarget is childA');
    assert(fieldEvent.toTargetId === 'scene_obj_childB', 'toTarget is childB');
}

// ─────────────────────────────────────────────────────────────────────────────
// 10. Testing Call Frame & Scope Transitions (Function call & return)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n10. Testing Call Frame & Scope Transitions...');
{
    const sceneA = new SceneGraph();
    sceneA.addNode(new SceneNode({ id: 'scene_frame_0', type: NODE_TYPES.CALL_FRAME, semanticId: '0', metadata: { functionName: '<module>', depth: 1 } }));

    // Scene B: f() called -> frame_1 entered
    const sceneB = sceneA.clone();
    sceneB.addNode(new SceneNode({ id: 'scene_frame_1', type: NODE_TYPES.CALL_FRAME, semanticId: '1', metadata: { functionName: 'calc', depth: 2 } }));
    sceneB.addNode(new SceneNode({ id: 'scene_var_1_y', type: NODE_TYPES.VARIABLE, semanticId: 'y', metadata: { varName: 'y', scope: 'calc' } }));

    const diffEnter = SceneDiff.compute(sceneA, sceneB);
    assert(diffEnter.addedNodes.length === 2, 'Added frame and variable');

    const planEnter = TransitionPlanner.plan(diffEnter, sceneA, sceneB);
    assert(planEnter.hasEventType(SEMANTIC_EVENT_TYPES.CALL_FRAME_ENTERED), 'Emitted CALL_FRAME_ENTERED');
    assert(planEnter.hasEventType(SEMANTIC_EVENT_TYPES.SCOPE_ENTERED), 'Emitted SCOPE_ENTERED');
    assert(planEnter.getOperationsByType(TRANSITION_OP_TYPES.ENTER_FRAME).length === 1, 'Emitted ENTER_FRAME op');

    // Return (Exit)
    const diffExit = SceneDiff.compute(sceneB, sceneA);
    const planExit = TransitionPlanner.plan(diffExit, sceneB, sceneA);
    assert(planExit.hasEventType(SEMANTIC_EVENT_TYPES.CALL_FRAME_EXITED), 'Emitted CALL_FRAME_EXITED');
    assert(planExit.hasEventType(SEMANTIC_EVENT_TYPES.SCOPE_EXITED), 'Emitted SCOPE_EXITED');
    assert(planExit.getOperationsByType(TRANSITION_OP_TYPES.EXIT_FRAME).length === 1, 'Emitted EXIT_FRAME op');
}

// ─────────────────────────────────────────────────────────────────────────────
// 11. Testing Cyclic Reference Diffing Without Recursion (a.append(a))
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n11. Testing Cyclic Reference Graph Diffing...');
{
    const sceneA = new SceneGraph();
    sceneA.addNode(new SceneNode({ id: 'scene_obj_1', type: NODE_TYPES.OBJECT, semanticId: '1', label: 'List #1' }));

    // Scene B has self cycle: scene_obj_1 -> scene_obj_1
    const sceneB = sceneA.clone();
    sceneB.addRelationship(new SceneRelationship({
        fromId: 'scene_obj_1',
        toId: 'scene_obj_1',
        type: RELATIONSHIP_TYPES.REFERENCES,
        label: '[0]',
        metadata: { index: 0 },
    }));

    const diff = SceneDiff.compute(sceneA, sceneB);
    assert(diff.addedRelationships.length === 1, 'Diffed self-referential cycle edge');
    assert(diff.addedRelationships[0].fromId === 'scene_obj_1', 'fromId is scene_obj_1');
    assert(diff.addedRelationships[0].toId === 'scene_obj_1', 'toId is scene_obj_1');

    const plan = TransitionPlanner.plan(diff, sceneA, sceneB);
    assert(plan.hasEventType(SEMANTIC_EVENT_TYPES.COLLECTION_ELEMENT_ADDED), 'Handled cyclic element addition safely');
}

// ─────────────────────────────────────────────────────────────────────────────
// 12. Testing Shared Objects & Multi-Referrer Consistency
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n12. Testing Shared Objects Handling...');
{
    // x = []; a = [x]; b = [x]
    const sceneA = new SceneGraph();
    sceneA.addNode(new SceneNode({ id: 'scene_obj_x', type: NODE_TYPES.OBJECT, semanticId: 'x' }));
    sceneA.addNode(new SceneNode({ id: 'scene_obj_a', type: NODE_TYPES.OBJECT, semanticId: 'a' }));
    sceneA.addNode(new SceneNode({ id: 'scene_obj_b', type: NODE_TYPES.OBJECT, semanticId: 'b' }));
    sceneA.addRelationship(new SceneRelationship({ fromId: 'scene_obj_a', toId: 'scene_obj_x', type: RELATIONSHIP_TYPES.REFERENCES, label: '[0]', metadata: { index: 0 } }));
    sceneA.addRelationship(new SceneRelationship({ fromId: 'scene_obj_b', toId: 'scene_obj_x', type: RELATIONSHIP_TYPES.REFERENCES, label: '[0]', metadata: { index: 0 } }));

    // Mutation on b: b.append(1) -> obj_x remains untouched and shared
    const sceneB = sceneA.clone();
    sceneB.getNode('scene_obj_b').value = { elementsCount: 2 };

    const diff = SceneDiff.compute(sceneA, sceneB);
    assert(diff.updatedNodes.length === 1 && diff.updatedNodes[0].node.id === 'scene_obj_b', 'Only obj_b was updated');
    assert(diff.getNodeChange('scene_obj_x') === null, 'Shared obj_x remained unchanged');
}

// ─────────────────────────────────────────────────────────────────────────────
// 13. Testing Determinism Guarantee
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n13. Testing Determinism Guarantee...');
{
    const sceneA = new SceneGraph();
    sceneA.addNode(new SceneNode({ id: 'scene_obj_2', type: NODE_TYPES.OBJECT, semanticId: '2' }));
    sceneA.addNode(new SceneNode({ id: 'scene_obj_1', type: NODE_TYPES.OBJECT, semanticId: '1' }));
    sceneA.addRelationship(new SceneRelationship({ fromId: 'scene_obj_1', toId: 'scene_obj_2', type: RELATIONSHIP_TYPES.REFERENCES }));

    const sceneB = new SceneGraph();
    sceneB.addNode(new SceneNode({ id: 'scene_obj_1', type: NODE_TYPES.OBJECT, semanticId: '1', value: { updated: true } }));
    sceneB.addNode(new SceneNode({ id: 'scene_obj_3', type: NODE_TYPES.OBJECT, semanticId: '3' }));
    sceneB.addRelationship(new SceneRelationship({ fromId: 'scene_obj_1', toId: 'scene_obj_3', type: RELATIONSHIP_TYPES.REFERENCES }));

    const baselineJson = JSON.stringify(SceneDiff.compute(sceneA, sceneB).toJSON());
    let allIdentical = true;

    for (let i = 0; i < 20; i++) {
        const runJson = JSON.stringify(SceneDiff.compute(sceneA, sceneB).toJSON());
        if (runJson !== baselineJson) {
            allIdentical = false;
            break;
        }
    }
    assert(allIdentical === true, 'Repeated SceneDiff runs produce byte-for-byte identical output');
}

// ─────────────────────────────────────────────────────────────────────────────
// 14. Testing Sets & Tuples Handling
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n14. Testing Sets & Tuples Handling...');
{
    // Set: s = set(); s.add(1); s.add(2); s.remove(1)
    const sceneA = new SceneGraph();
    sceneA.addNode(new SceneNode({ id: 'scene_obj_set', type: NODE_TYPES.OBJECT, semanticId: 's', value: { type: 'set', elementsCount: 2 } }));
    sceneA.addNode(new SceneNode({ id: 'scene_obj_e1', type: NODE_TYPES.OBJECT, semanticId: 'e1' }));
    sceneA.addNode(new SceneNode({ id: 'scene_obj_e2', type: NODE_TYPES.OBJECT, semanticId: 'e2' }));
    sceneA.addRelationship(new SceneRelationship({ fromId: 'scene_obj_set', toId: 'scene_obj_e1', type: RELATIONSHIP_TYPES.REFERENCES, label: 'member', metadata: { key: 'e1' } }));
    sceneA.addRelationship(new SceneRelationship({ fromId: 'scene_obj_set', toId: 'scene_obj_e2', type: RELATIONSHIP_TYPES.REFERENCES, label: 'member', metadata: { key: 'e2' } }));

    // Scene B: removed e1
    const sceneB = new SceneGraph();
    sceneB.addNode(new SceneNode({ id: 'scene_obj_set', type: NODE_TYPES.OBJECT, semanticId: 's', value: { type: 'set', elementsCount: 1 } }));
    sceneB.addNode(new SceneNode({ id: 'scene_obj_e2', type: NODE_TYPES.OBJECT, semanticId: 'e2' }));
    sceneB.addRelationship(new SceneRelationship({ fromId: 'scene_obj_set', toId: 'scene_obj_e2', type: RELATIONSHIP_TYPES.REFERENCES, label: 'member', metadata: { key: 'e2' } }));

    const diff = SceneDiff.compute(sceneA, sceneB);
    assert(diff.removedRelationships.length === 1, 'Removed 1 set member relationship');
    assert(diff.removedNodes.length === 1 && diff.removedNodes[0].id === 'scene_obj_e1', 'Removed e1 node');

    const plan = TransitionPlanner.plan(diff, sceneA, sceneB);
    assert(plan.hasEventType(SEMANTIC_EVENT_TYPES.COLLECTION_ELEMENT_REMOVED), 'Emitted COLLECTION_ELEMENT_REMOVED for set member');
    assert(plan.hasEventType(SEMANTIC_EVENT_TYPES.OBJECT_MUTATED), 'Emitted OBJECT_MUTATED for set');
}

// ─────────────────────────────────────────────────────────────────────────────
// 15. Testing Arbitrary Non-Adjacent Frames & Reverse Playback
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n15. Testing Arbitrary Non-Adjacent Frames & Reverse Playback...');
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
                type: EVENT_TYPES.LINE,
                source: { file: 'main.py', line: 3 },
                scope: { function: '<module>', depth: 1 },
                data: { locals: { x: '10', y: '20', z: '30' } },
            }),
            createTraceEvent({
                id: 3,
                type: EVENT_TYPES.PROGRAM_END,
                source: { file: 'main.py', line: 3 },
                scope: { function: '<module>', depth: 0 },
                data: { output: 'done' },
            }),
        ],
    });

    const playback = new PlaybackEngine();
    playback.setFrames(trace);

    assert(playback.totalFrames === 4, 'Playback loaded 4 execution frames');

    // Frame 0 -> 2 (Non-adjacent forward)
    const diff0to2 = playback.getSceneDiff(0, 2);
    assert(diff0to2 !== null, 'getSceneDiff(0, 2) returned valid diff');
    assert(diff0to2.fromFrame === 0 && diff0to2.toFrame === 2, 'Diff metadata preserved frame indices');

    const trans0to2 = playback.getTransition(0, 2);
    assert(trans0to2 !== null, 'getTransition(0, 2) returned valid transition plan');

    // Frame 2 -> 0 (Non-adjacent reverse)
    const diff2to0 = playback.getSceneDiff(2, 0);
    assert(diff2to0 !== null, 'getSceneDiff(2, 0) returned valid diff');
    assert(diff2to0.fromFrame === 2 && diff2to0.toFrame === 0, 'Reverse frame metadata preserved');

    // Jump and current transition test
    playback.jumpTo(2);
    const currTrans = playback.getCurrentTransition();
    assert(currTrans !== null, 'getCurrentTransition() returns valid plan');
    assert(currTrans.fromFrame === 1 && currTrans.toFrame === 2, 'Current transition spans frame 1 -> 2');
}

// ─────────────────────────────────────────────────────────────────────────────
// 16. Testing Large Graph Performance & Complexity Bound
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n16. Testing Large Graph Bounded Performance...');
{
    const sceneA = new SceneGraph();
    const sceneB = new SceneGraph();

    const NODE_COUNT = 1000;
    for (let i = 0; i < NODE_COUNT; i++) {
        sceneA.addNode(new SceneNode({
            id: `scene_obj_${i}`,
            type: NODE_TYPES.OBJECT,
            semanticId: `${i}`,
            value: { count: i },
        }));

        sceneB.addNode(new SceneNode({
            id: `scene_obj_${i}`,
            type: NODE_TYPES.OBJECT,
            semanticId: `${i}`,
            value: { count: i % 2 === 0 ? i + 1 : i }, // 500 mutated nodes
        }));
    }

    const t0 = performance.now();
    const diff = SceneDiff.compute(sceneA, sceneB);
    const plan = TransitionPlanner.plan(diff, sceneA, sceneB);
    const elapsed = performance.now() - t0;

    assert(diff.updatedNodes.length === 500, 'Correctly detected 500 mutated nodes in large graph');
    assert(elapsed < 100, `Large graph diff & plan completed in ${elapsed.toFixed(1)}ms (< 100ms threshold)`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 17. Testing Object Disappearance & del Variable
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n17. Testing Object Disappearance & Variable Deletion (del a)...');
{
    const sceneA = new SceneGraph();
    sceneA.addNode(new SceneNode({ id: 'scene_obj_1', type: NODE_TYPES.OBJECT, semanticId: '1', label: 'List #1' }));
    sceneA.addNode(new SceneNode({ id: 'scene_var_0_a', type: NODE_TYPES.VARIABLE, semanticId: 'a', label: 'a = list' }));
    sceneA.addRelationship(new SceneRelationship({ fromId: 'scene_var_0_a', toId: 'scene_obj_1', type: RELATIONSHIP_TYPES.REFERENCES, label: 'a' }));

    // Scene B: 'del a' executed -> both variable and heap object disappear from SceneGraph
    const sceneB = new SceneGraph();

    const diff = SceneDiff.compute(sceneA, sceneB);
    assert(diff.removedNodes.length === 2, 'Detected 2 removed nodes');
    assert(diff.removedRelationships.length === 1, 'Detected 1 removed relationship');

    const plan = TransitionPlanner.plan(diff, sceneA, sceneB);
    assert(plan.hasEventType(SEMANTIC_EVENT_TYPES.VARIABLE_REMOVED), 'Emitted VARIABLE_REMOVED');
    assert(plan.hasEventType(SEMANTIC_EVENT_TYPES.OBJECT_REMOVED), 'Emitted OBJECT_REMOVED');
    assert(plan.hasEventType(SEMANTIC_EVENT_TYPES.RELATIONSHIP_REMOVED), 'Emitted RELATIONSHIP_REMOVED');
    assert(plan.getOperationsByType(TRANSITION_OP_TYPES.REMOVE_NODE).length === 2, 'Emitted 2 REMOVE_NODE operations');
}

// ─────────────────────────────────────────────────────────────────────────────
// 18. Testing JSON Serialization
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n18. Testing JSON Serialization...');
{
    const sceneA = new SceneGraph();
    sceneA.addNode(new SceneNode({ id: 'scene_obj_1', type: NODE_TYPES.OBJECT, semanticId: '1' }));

    const sceneB = new SceneGraph();
    sceneB.addNode(new SceneNode({ id: 'scene_obj_2', type: NODE_TYPES.OBJECT, semanticId: '2' }));

    const diff = SceneDiff.compute(sceneA, sceneB, { fromFrame: 1, toFrame: 2 });
    const diffJson = diff.toJSON();
    assert(diffJson.fromFrame === 1 && diffJson.toFrame === 2, 'Serialized diff contains frame metadata');
    assert(Array.isArray(diffJson.addedNodes) && diffJson.addedNodes.length === 1, 'Serialized diff has addedNodes array');

    const plan = TransitionPlanner.plan(diff, sceneA, sceneB);
    const planJson = plan.toJSON();
    assert(Array.isArray(planJson.events) && planJson.events.length > 0, 'Serialized plan has events array');
    assert(Array.isArray(planJson.operations) && planJson.operations.length > 0, 'Serialized plan has operations array');
    assert(typeof planJson.summary === 'string', 'Serialized plan has summary string');
}

// ─────────────────────────────────────────────────────────────────────────────
// 19. Testing SceneRenderer Boundary Integration
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n19. Testing SceneRenderer Boundary Integration...');
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

    // Transition 1: Create node
    const scene1 = new SceneGraph();
    scene1.addNode(new SceneNode({ id: 'scene_obj_1', type: NODE_TYPES.OBJECT, label: 'Block 1', style: { colorHint: 'BLUE' } }));
    const diff1 = SceneDiff.compute(new SceneGraph(), scene1);
    const plan1 = TransitionPlanner.plan(diff1, new SceneGraph(), scene1);

    await renderer.applyTransitionPlan(plan1);
    assert(mockVisualizer.spawned.has('vis_scene_obj_1'), 'SceneRenderer spawned block via transition plan');

    // Transition 2: Update node
    const scene2 = new SceneGraph();
    scene2.addNode(new SceneNode({ id: 'scene_obj_1', type: NODE_TYPES.OBJECT, label: 'Block 1 Updated', style: { colorHint: 'GREEN' } }));
    const diff2 = SceneDiff.compute(scene1, scene2);
    const plan2 = TransitionPlanner.plan(diff2, scene1, scene2);

    await renderer.applyTransitionPlan(plan2);
    assert(mockVisualizer.updated.has('vis_scene_obj_1'), 'SceneRenderer updated block via transition plan');

    // Transition 3: Remove node
    const diff3 = SceneDiff.compute(scene2, new SceneGraph());
    const plan3 = TransitionPlanner.plan(diff3, scene2, new SceneGraph());

    await renderer.applyTransitionPlan(plan3);
    assert(mockVisualizer.removed.has('vis_scene_obj_1'), 'SceneRenderer removed block via transition plan');
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
