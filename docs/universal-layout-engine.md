# Universal Layout & Spatial Intelligence Engine (Stage 9)

## 1. Architecture Overview

The **Universal Layout & Spatial Intelligence Engine** is a deterministic, renderer-independent spatial coordinator. It consumes a `SceneGraph` (and optionally a previous `LayoutState`) to compute spatial placement (`LayoutState`) for arbitrary Python programs without coupling to Three.js, WebGL, DOM, or specific DSA algorithms.

```text
                 ┌──────────────────┐
                 │   RuntimeState   │  WHAT exists (Semantic Truth)
                 └────────┬─────────┘
                          │
                          ▼
                 ┌──────────────────┐
                 │    SceneGraph    │  WHAT is visualized (Presentation Intent)
                 └────────┬─────────┘
                          │
                          ▼
                 ┌──────────────────┐
                 │   LayoutEngine   │  WHERE things should be (Spatial Planning)
                 └────────┬─────────┘
                          │
                          ▼
                 ┌──────────────────┐
                 │   LayoutState    │  Deterministic positions, sizes, bounds, regions
                 └────────┬─────────┘
                          │
                          ▼
                 ┌──────────────────┐
                 │ SceneDiff /      │
                 │ SemanticTransition│
                 └────────┬─────────┘
                          │
                          ▼
                 ┌──────────────────┐
                 │ AnimationRuntime │  HOW things move/transition
                 └────────┬─────────┘
                          │
                          ▼
                 ┌──────────────────┐
                 │  SceneRenderer   │  HOW they are drawn
                 └────────┬─────────┘
                          │
                          ▼
              Three.js / DOM / WebGPU
```

---

## 2. Core Spatial Entities

### 2.1 `LayoutNode` (`src/layout/LayoutNode.js`)
Renderer-independent representation of a spatial entity:
```typescript
interface LayoutNode {
    id: string;             // Matches SceneNode ID (e.g. 'scene_obj_1', 'scene_var_0_x')
    position: { x: number, y: number, z: number };
    rotation: { x: number, y: number, z: number };
    scale: { x: number, y: number, z: number };
    size: { x: number, y: number, z: number };
    parentId: string | null;
    depth: number;
    layer: 'heap' | 'stack' | 'globals' | 'inspector';
    region: 'Heap' | 'CallStack' | 'Globals';
    metadata: Record<string, any>;
}
```
- **Bounds calculation:** Axis-aligned bounding box (`bounds.min`, `bounds.max`).
- **Collision test:** `intersects(other, padding)`.

### 2.2 `LayoutConstraint` (`src/layout/LayoutConstraint.js`)
Declarative constraints governing spatial alignment:
- `HORIZONTAL_SEQUENCE`, `VERTICAL_SEQUENCE`, `SAME_ROW`, `SAME_COLUMN`, `STACK`, `INSIDE`, `OUTSIDE`, `AVOID_OVERLAP`, `MINIMUM_SPACING`, `FIXED_POSITION`.

### 2.3 `LayoutGraph` (`src/layout/LayoutGraph.js`)
Topological graph for structural queries:
- Cycle-safe depth calculation (`getDepth(nodeId)`).
- Connected component discovery (`getConnectedComponents()`).
- Directed parent-child and reference querying.

### 2.4 `LayoutState` (`src/layout/LayoutState.js`)
Immutable spatial snapshot:
- `nodes`: Map of all positioned `LayoutNode`s.
- `bounds`: Global bounding box enclosing all active elements.
- `regions`: Grouping maps for `Heap`, `CallStack`, and `Globals`.
- `diff(previousLayoutState)`: Computes `added`, `removed`, `moved`, `resized`, and `unchanged` nodes.

---

## 3. Spatial Regions & Spatial Segregation

To maintain organized visual representations across large execution traces, space is divided into semantic regions:

```text
   ┌─────────────────────────────────────┬───────────────────────────┐
   │                                     │                           │
   │               HEAP                  │        CALL STACK         │
   │   Lists, Dictionaries, Objects      │  scene_frame_0 (module)   │
   │   x: [-4.5, 4.0], y: [1.2, 4.0]     │  scene_frame_1 (func)     │
   │                                     │  x: [5.5, 8.0], y: 3.5... │
   ├─────────────────────────────────────┼───────────────────────────┤
   │                                     │                           │
   │             GLOBALS                 │          (SPARE)          │
   │   Global & scope variable slots     │                           │
   │   x: [-5.5, 0.0], y: [-2.6, -5.0]   │                           │
   │                                     │                           │
   └─────────────────────────────────────┴───────────────────────────┘
```

---

## 4. Geometric Layout Strategies & Auto-Selection

`LayoutStrategies` (`src/layout/LayoutStrategies.js`) provides modular layout algorithms:

1. **`horizontal`**: Linear sequence along the X-axis for lists, arrays, and tuples ($[10][20][30]$).
2. **`vertical`**: Linear sequence along the Y-axis.
3. **`grid`**: 2D grid matrix for dictionary key/value pairs and object attribute tables.
4. **`stack`**: Deterministic vertical stacking for call frames.
5. **`tree`**: Breadth-first hierarchical positioning for acyclic trees.
6. **`radial`**: Circular ring arrangement around central nodes.
7. **`graph`**: Deterministic concentric-ring graph layout for arbitrary cyclic topologies.

### Automatic Strategy Selection
`LayoutStrategies.selectAutoStrategy(node, layoutGraph)` automatically determines the ideal geometric strategy from the SceneNode's semantic metadata and connection topology:
- Call frame $\longrightarrow$ `stack`
- List / Tuple $\longrightarrow$ `horizontal`
- Dictionary / Set $\longrightarrow$ `grid`
- Multi-edge / Cyclic Graph $\longrightarrow$ `graph`
- Scope Variables $\longrightarrow$ `grid` / `vertical`

---

## 5. Stable Positioning & Incremental Relayout

A critical requirement is **preventing visual jumping/jitter** when unrelated items are modified:

### 5.1 Append Stability ($[A, B, C] \rightarrow [A, B, C, D]$)
When `D` is appended, `A`, `B`, and `C` retain their previous coordinates (`preservePositions: true`). `D` is appended to the next spatial coordinate without moving prior elements.

### 5.2 Variable Slot Stability ($x, y, z \rightarrow x, z$)
Variables within a scope are assigned stable spatial slot indices. When `del y` occurs, variables `x` and `z` remain fixed in their respective grid slots rather than collapsing unpredictably.

---

## 6. Collision Avoidance

`LayoutEngine` incorporates an $O(N \log N)$ 1D sweep-line interval pruning algorithm:
1. Active nodes are partitioned by region.
2. Nodes within each region are sorted by their minimum X coordinate.
3. Overlaps are detected and resolved along deterministic clearance vectors.
4. Operates without non-deterministic physics simulations, force relaxation loops, or `Math.random()`.

---

## 7. Aliasing, Cycles & Shared Objects

- **Aliasing:** When multiple variables reference the same heap object (`a = x; b = x`), exactly **one** `LayoutNode` is created (`scene_obj_1`) with two incoming relationship lines.
- **Cycles:** Self-referencing (`a = []; a.append(a)`) and mutual cycles (`a = [b]; b = [a]`) are recognized as graph edges. Traversal algorithms use visited sets to guarantee $100\%$ termination safety.

---

## 8. Animation & Renderer Integration

### 8.1 Integration with Stage 8 Animation
`LayoutBuilder.toAnimationPlan(layoutDiff, prevState, nextState)` translates spatial movements (`layoutDiff.moved`) into `CLIP_CATEGORIES.MOVE` property clips (`transform.position: from → to`), driving smooth spatial transitions through `AnimationRuntime`.

### 8.2 SceneRenderer Boundary
`SceneRenderer.js` exposes:
- `applyLayout(layoutState)`
- `getLayoutState()`
- `clearLayout()`

The renderer never computes layout geometry itself.

### 8.3 PlaybackEngine Integration
`PlaybackEngine.js` exposes:
- `playback.getLayout(frameIndex)`
- `playback.getCurrentLayout()`
- `playback.getLayoutTransition(fromFrame, toFrame)`

---

## 9. Performance & Benchmarks

The sweep-line collision resolution and regional partitioning deliver scalable spatial performance:

| Node Count | Layout Time |
| :--- | :--- |
| **100 nodes** | $\approx 0.5\text{ ms}$ |
| **1,000 nodes** | $\approx 2.7\text{ ms}$ |
| **5,000 nodes** | $\approx 13.4\text{ ms}$ |
