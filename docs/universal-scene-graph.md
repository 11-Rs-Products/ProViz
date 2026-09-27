# Universal Scene Graph & Runtime Visualization Layer (Stage 4)

## 1. Why SceneGraph Exists

In prior stages of ProViz, visualizers (`ArrayVisualizer`, `VariableVisualizer`, `CallStackVisualizer`) were directly coupled to the playback engine and execution traces. They directly spawned, animated, and mutated Three.js meshes and groups.

This created several architectural liabilities:
- **Renderer Coupling:** Program semantics were entangled with WebGL, Three.js `Object3D` hierarchies, materials, and camera vectors.
- **State Drift:** If a visualizer mutated a 3D mesh, navigating backward or jumping across time risked out-of-sync visual representations.
- **Non-Extensibility:** Adding support for non-array data structures, non-Python runtimes, or alternative renderers (2D canvas, WebAssembly, headless testing) required modifying 3D visualizer internals.

The **Universal Scene Graph** (`src/scene/`) introduces a renderer-independent semantic presentation layer between runtime state and Three.js rendering:

> **Core Principle:** RuntimeState is truth. SceneGraph is presentation intent. Three.js is rendering.

---

## 2. Architecture Overview

```text
                    ┌──────────────────┐
                    │   RuntimeState   │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │   SceneBuilder   │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │    SceneGraph    │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │  SceneRenderer   │
                    └────────┬─────────┘
                             │
                             ▼
                       Three.js World
```

### End-to-End Execution Flow
```text
                    Python Program
                          │
                          ▼
                 Python Language Adapter
                          │
                          ▼
              Universal Execution Trace (UET)
                          │
                          ▼
                    RuntimeState
                          │
                          ▼
               Timeline / StateReconstructor
                          │
                          ▼
                    SceneBuilder
                          │
                          ▼
                     SceneGraph
                          │
                          ▼
                   SceneRenderer
                          │
                          ▼
                      Three.js
```

---

## 3. RuntimeState vs SceneGraph

| Aspect | `RuntimeState` (`src/runtime/`) | `SceneGraph` (`src/scene/`) |
| :--- | :--- | :--- |
| **Purpose** | Authoritative truth of program memory, heap, scopes, frames, and variables | Pure, declarative presentation intent for visualization |
| **Entities** | `HeapObject`, `Scope`, `CallFrame`, `Value` descriptors | `SceneNode`, `SceneRelationship` |
| **Identity** | Semantic runtime IDs (`obj_1`, variable names, frame IDs) | Scene IDs (`scene_obj_1`, `scene_var_frame_1_x`) |
| **Spatial Data** | None (pure semantic state) | Relative 3D positions, rotations, scales |
| **Styling** | None | Semantic emphasis (`active`, `default`), categories, color hints |
| **Dependencies** | Pure JS logic | Pure JS data models (Zero Three.js / WebGL / DOM) |

---

## 4. Semantic Identity vs Scene Identity vs Renderer Identity

A central invariant of Stage 4 is the rigorous separation of three identities:

```text
Runtime Identity
      obj_7
        │
        ▼
 Scene Identity
   scene_obj_7
  (semanticId: "obj_7")
        │
        ▼
Renderer Identity
THREE.Object3D.uuid
```

1. **Runtime Identity (`obj_7`):** The persistent, deterministic identity of an object allocated on the Python heap or stack across execution frames.
2. **Scene Identity (`scene_obj_7`):** The deterministic identifier of the semantic scene node. Retains a reference to `semanticId: "obj_7"`.
3. **Renderer Identity (`THREE.Object3D.uuid`):** Ephemeral 3D engine identifier. The renderer may create, destroy, or recycle Three.js meshes without affecting runtime or scene identity.

---

## 5. References and Relationships

Relationships between entities are represented explicitly via `SceneRelationship` edges rather than nested object duplication:

### Aliasing Example
```python
a = [1, 2]
b = a
```

In the SceneGraph:
```text
variable a ─────┐
                ↓
              scene_obj_1 (elements: [1, 2])
                ↑
variable b ─────┘
```

Both variable nodes contain outbound `SceneRelationship` edges with `type: 'references'` targeting `scene_obj_1`. Exactly one heap object node exists.

### Supported Relationship Types
- `references`: Variable or object pointing to another heap object.
- `contains`: Frame/scope containing a variable or collection containing elements.
- `element_of`: Collection element membership.
- `points_to`: Index or pointer reference.
- `calls`: Call frame invocation.
- `owns`: Scope or instance ownership.

---

## 6. Cycle Safety and Large Structures

Self-referential and cyclic structures (such as `a = []; a.append(a)`) are safely represented because:
1. `SceneBuilder` iterates over discrete heap objects from `RuntimeState.heap`.
2. References are emitted as directed relationship descriptors (`fromId: 'scene_obj_1'`, `toId: 'scene_obj_1'`).
3. Traversal does not recursively duplicate child graphs.
4. Bounded limits (`maxDepth`, `maxItems`) prevent memory exhaustion on large collections.

---

## 7. Scopes and Call Stack Representation

Call frames and local scopes are first-class nodes in the `SceneGraph`:
- **Active Call Frame:** Rendered with `style.emphasis = 'active'`.
- **Parent/Previous Frames:** Rendered with `style.emphasis = 'default'`.
- **Frame-to-Variable Ownership:** Frames contain `CONTAINS` relationships to their respective local variables.

---

## 8. SceneBuilder Implementation

The `SceneBuilder` (`src/scene/SceneBuilder.js`) performs a single, pure conversion pass:

```js
const builder = new SceneBuilder();
const sceneGraph = builder.build(runtimeState);
```

### Determinism Invariant
Given identical `RuntimeState` instances, `SceneBuilder.build()` produces an identical `SceneGraph` (`sceneA.equals(sceneB) === true`), regardless of navigation history, stepping order, or UI state.

---

## 9. Renderer Boundary (`SceneRenderer`)

The renderer boundary (`src/rendering/SceneRenderer.js`) translates `SceneGraph` nodes into downstream rendering commands:
- Inspects `SceneNode` spatial transforms (`position`, `rotation`, `scale`).
- Applies semantic style hints (`colorHint`, `emphasis`) to materials.
- Operates strictly on `SceneGraph` data with **zero knowledge** of Python AST, trace events, or `RuntimeState`.

---

## 10. Current Migration Architecture & Coexistence

During the Stage 4 transition, both the new semantic pipeline and legacy visualizers coexist without regression:

```text
                               Universal Execution Trace (UET)
                                      │               │
                     ┌────────────────┘               └────────────────┐
                     ▼                                                 ▼
             RuntimeState                                      LegacyFrameAdapter
                     │                                                 │
                     ▼                                                 ▼
             StateReconstructor                               Existing Playback
                     │                                                 │
                     ▼                                                 ▼
                SceneBuilder                                  Legacy 3D Visualizers
                     │                                      (ArrayVis, VarVis, CallStackVis)
                     ▼
                 SceneGraph
                     │
                     ▼
               SceneRenderer
                     │
                     ▼
                Three.js World
```

### PlaybackEngine Integration
`PlaybackEngine` provides clean accessors for the reconstructed scene at any frame:
```js
const currentScene = playback.getCurrentScene();
const specificScene = playback.getSceneAt(frameIndex);
```

---

## 11. What Remains Legacy

The following remain untouched to ensure 100% backward compatibility:
- `src/visualizers/ArrayVisualizer.js`
- `src/visualizers/VariableVisualizer.js`
- `src/visualizers/CallStackVisualizer.js`
- `src/visualizers/BaseVisualizer.js`
- `src/trace/LegacyFrameAdapter.js`
- DSA Question System & Explanation Engine

---

## 12. Future SceneDiff Architecture (Stage 5+)

In future stages, incremental rendering will be introduced via `SceneDiff`:
```text
SceneGraph (t) + SceneGraph (t+1) ──► SceneDiff ──► Animated Three.js Transitions
```
The `SceneGraph.equals()` and structural node representations created in Stage 4 provide the foundation for computing created, deleted, moved, and modified nodes.
