# Universal Animation & Transition Runtime (Stage 8)

## 1. Architecture Overview

The **Universal Animation & Transition Runtime** converts Stage 7's renderer-independent `SemanticTransitionPlan` into deterministic, reversible, and interruptible `AnimationPlan`s.

```text
Source Code
    ↓
Universal Execution Trace (UET)
    ↓
RuntimeState
    ↓
SceneGraph_N ──────┐
                   ↓
                SceneDiff
                   ↓
          SemanticTransitionPlan
                   ↓
               AnimationPlan
                   ↓
            AnimationRuntime
                   ↓
             AnimationState
                   ↓
             SceneRenderer
                   ↓
        Three.js / DOM / WebGPU
                   ↑
          SceneGraph_N+1
```

### Core Architectural Axioms
1. **Semantic Authority:** `RuntimeState` and `SceneGraph` define ground truth. Animation is strictly a temporal presentation projection.
2. **Deterministic Evaluation:** For any animation plan, `seek(t)` yields identical `AnimationState` regardless of frame rate, playback speed, or prior scrubbing trajectory.
3. **Renderer Independence:** `AnimationClip`, `AnimationTrack`, `AnimationPlan`, and `AnimationRuntime` contain zero Three.js, WebGL, or DOM dependencies.
4. **Symmetry & Reversibility:** Any transition $A \rightarrow B$ can be reversed into $B \rightarrow A$ deterministically.

---

## 2. Animation Data Model

### 2.1 `AnimationClip` (`src/animation/AnimationClip.js`)
An immutable property transition for a specific semantic entity.

```typescript
interface AnimationClip {
    id: string;
    targetId: string;      // e.g. 'scene_obj_1', 'scene_var_0_x'
    property: string;      // e.g. 'transform.position', 'style.opacity', 'value'
    from: any;             // Initial value
    to: any;               // Final value
    duration: number;      // Duration in seconds
    delay: number;         // Start offset in seconds
    easing: string;        // 'linear' | 'easeIn' | 'easeOut' | 'easeInOut'
    category: string;      // 'create' | 'remove' | 'move' | 'transform' | 'style' | 'value' | 'structural' | 'lifecycle'
    metadata: Record<string, any>;
}
```

### 2.2 `AnimationTrack` (`src/animation/AnimationTrack.js`)
A sequenced channel of ordered `AnimationClip`s for a single `targetId:property` pair.
- Sorts clips deterministically by `delay` and `duration`.
- Computes track duration: $\max(\text{clip.endTime})$.
- Provides continuous evaluation across clip boundaries.

### 2.3 `AnimationPlan` (`src/animation/AnimationPlan.js`)
A complete, serializable animation specification for a transition step:
- Holds all property `AnimationTrack`s keyed by stable ID (`targetId:property`).
- Supports bidirectional reversal via `plan.reverse()`.
- Deterministically serializable to JSON.

### 2.4 `AnimationState` (`src/animation/AnimationState.js`)
An evaluated temporal snapshot at time $t$:
- `nodeStates`: Evaluated property values (transforms, styles, values, visibility) per node.
- `relationshipStates`: Evaluated states for edges and pointers.
- `progress`: Normalized progress in $[0, 1]$.
- `status`: `'idle'` | `'running'` | `'paused'` | `'completed'` | `'cancelled'`.

---

## 3. AnimationBuilder (`src/animation/AnimationBuilder.js`)

`AnimationBuilder` maps high-level semantic transition operations to animation clips:

| Semantic Operation | Animated Properties | Category | Easing |
| :--- | :--- | :--- | :--- |
| `CREATE_NODE` | `scale: 0 → target`, `opacity: 0 → 1` | `create` | `easeOut` |
| `REMOVE_NODE` | `scale: 1 → 0`, `opacity: 1 → 0` | `remove` | `easeIn` |
| `UPDATE_NODE` | `transform.position`, `style.colorHint`, `value` | `move` / `style` | `easeInOut` |
| `REBIND_VARIABLE` | `relationship.target: from → to`, `style.emphasis` pulse | `relationship` | `easeInOut` |
| `MUTATE_OBJECT` | `transform.scale: 1 → 1.15 → 1`, `label` | `structural` | `easeOut` + `easeIn` |
| `ENTER_FRAME` | `style.opacity: 0 → 1`, slide in | `lifecycle` | `easeOut` |
| `EXIT_FRAME` | `style.opacity: 1 → 0` | `lifecycle` | `easeIn` |
| `HIGHLIGHT_NODE` | `style.emphasis: active → default` | `highlight` | `linear` |

---

## 4. AnimationRuntime (`src/animation/AnimationRuntime.js`)

Provides pure, deterministic timeline control:

```javascript
const runtime = new AnimationRuntime({ speed: 1.0 });
runtime.load(plan);
runtime.play();
runtime.advance(0.016); // step 16ms
const snapshot = runtime.getState();
```

### Deterministic Seek Invariant
$$\text{seek}(t) \equiv \text{seek}(0) + \sum \Delta t_i \quad \text{where } \sum \Delta t_i = t$$
Seeking directly to time $t$ produces the identical `AnimationState` without floating-point delta accumulation drift.

---

## 5. Reversal, Scrubbing & Interruption

### 5.1 Reversal
Reversing a plan swaps `fromFrame` and `toFrame`, inverts clip directions ($A \rightarrow B \implies B \rightarrow A$), shifts delay offsets ($\text{delay}_{\text{rev}} = \text{duration} - \text{clip.endTime}$), and flips lifecycle operations.

### 5.2 Scrubbing Across Non-Adjacent Frames
Scrubbing between arbitrary historical frames (e.g. Frame 10 to Frame 500) directly constructs the net transition:
$$\text{SceneGraph}_{10} \oplus \text{SceneGraph}_{500} \longrightarrow \text{SceneDiff}(10, 500) \longrightarrow \text{AnimationPlan}(10, 500)$$
No intermediate execution replay is required.

### 5.3 Interruption & State Replacement
When a user scrubs or triggers a debugger step while an animation is active:
1. Active `AnimationPlan` is immediately cancelled.
2. The newly reconstructed `SceneGraph` becomes ground truth.
3. A new `AnimationPlan` is loaded, completely discarding previous transient animation state.

---

## 6. Renderer Boundary & Three.js/GSAP Isolation

```text
┌───────────────────────────┐
│     AnimationRuntime      │ (Renderer-Independent Math & Interpolation)
└─────────────┬─────────────┘
              │ AnimationState (plain JSON-like structure)
              ▼
┌───────────────────────────┐
│       SceneRenderer       │ (Renderer Bridge)
└─────────────┬─────────────┘
              │ Three.js / WebGL / GSAP / DOM Commands
              ▼
┌───────────────────────────┐
│      3D / UI Viewport     │
└───────────────────────────┘
```

`SceneRenderer.js` exposes:
- `applyAnimationState(state)`
- `applyAnimationPlan(plan)`
- `clearAnimation()`

Neither Three.js meshes nor GSAP timelines leak into the semantic or animation planning layers.

---

## 7. Aliasing, Cycles & Identity Preservation

- **Identity Stability:** Entities retain stable IDs (`scene_obj_1`, `scene_var_0_x`). Animations target existing nodes rather than destroying and respawning meshes.
- **Aliasing:** Shared objects referenced by multiple variables undergo mutations in-place without duplicating nodes.
- **Cycle Safety:** Self-referencing collections (`a = []; a.append(a)`) are evaluated as discrete property/relationship tracks with zero recursive graph traversals.

---

## 8. PlaybackEngine Integration

`PlaybackEngine.js` provides first-class animation accessors:

```javascript
const playback = new PlaybackEngine();
playback.setFrames(uetTrace);

// Get animation plan between arbitrary frames
const plan = playback.getAnimationPlan(0, 1);

// Get animation plan for current playback step
const currentPlan = playback.getCurrentAnimationPlan();
```

---

## 9. Performance & Complexity

- **Plan Construction:** $O(U)$ where $U$ is the number of semantic operations.
- **Timeline Evaluation:** $O(T)$ where $T$ is the number of active property tracks ($< 20\text{ms}$ for 1,000 tracks).
- **Memory Footprint:** Zero duplicate scene copies during interpolation.
