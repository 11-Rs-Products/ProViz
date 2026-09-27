# ProViz Playback, Timeline & Deterministic State Reconstruction

> **Version:** 1.0 (Stage 3)  
> **Status:** Canonical Playback & State Reconstruction Contract  

---

## 1. Overview & Core Principle

In ProViz Stage 3, execution time is modeled as a **deterministic, reconstructable continuum** rather than a destructive sequence of forward animations.

> **Core Principle:**  
> Playback position selects runtime state; it never defines runtime state.  
> The runtime state at frame $N$ is purely a deterministic function of the trace and the frame index $N$:
> $$\text{RuntimeState}(N) = f(\text{Trace}, N)$$

Regardless of whether a user steps forward, steps backward, restarts, or scrubs across hundreds of frames, the system reconstructs the exact truth at frame $N$.

---

## 2. Timeline Architecture

```text
[ Canonical UET Trace ]
           │
           ▼
     [ Timeline ] ── (Indexed frames 0 .. N-1, duration, source events)
           │
     ┌─────┴─────────────────────────┐
     ▼                               ▼
[ Checkpoints ]               [ Frame Transitions ]
 (every K frames)             (calls, returns, line locals, mutations)
     │                               │
     └───────────────┬───────────────┘
                     ▼
           [ StateReconstructor ]
                     │
             reconstruct(frameIndex)
                     │
                     ▼
        [ Immutable RuntimeState @ N ]
                     │
                     ▼
           [ LegacyFrameAdapter ]
                     │
                     ▼
           [ Existing 3D Visualizers / UI ]
```

- **`Timeline` (`src/playback/Timeline.js`)**: Encapsulates frame indexing, duration, and access to source UET events.
- **`Checkpoint` (`src/playback/Checkpoint.js`)**: Encapsulates an immutable snapshot of `RuntimeState` recorded at regular frame intervals.
- **`StateReconstructor` (`src/playback/StateReconstructor.js`)**: Fast, pure state replayer recovering any frame $N$ starting from the nearest checkpoint $\le N$.
- **`PlaybackEngine` (`src/PlaybackEngine.js`)**: High-level controller exposing `nextFrame()`, `prevFrame()`, `jumpTo(idx)`, `restart()`, `play()`, `pause()`, and `getCurrentRuntimeState()`.

---

## 3. Checkpoints & Reconstruction Algorithm

To ensure fast time travel on long execution traces without storing full memory clones at every single frame, `StateReconstructor` establishes checkpoints at configurable intervals (e.g. every $K = 50$ frames).

### Reconstruction Algorithm:
1. **Find Nearest Checkpoint**: Identify checkpoint $C$ where $C.\text{index} \le \text{targetIndex}$.
2. **Clone Checkpoint State**: Extract `C.getStateClone()`. This guarantees complete isolation from external mutation.
3. **Replay Frame Transitions**: Replay frame deltas from $C.\text{index} + 1$ to $\text{targetIndex}$.
4. **Return State**: The resulting `RuntimeState` represents the ground truth at $\text{targetIndex}$.

```text
Example: Reconstruct Frame 237 (with Checkpoint Interval = 100)

[ Checkpoint 0 ] ──► [ Checkpoint 100 ] ──► [ Checkpoint 200 ]
                                                   │
                                                   ▼ (Clone state at 200)
                                            Replay frames 201..237
                                                   │
                                                   ▼
                                         RuntimeState @ 237
```

---

## 4. Bidirectional Playback & Scrubbing

### Forward Stepping (`nextFrame()`)
- Advances `_currentIdx` by 1.
- Obtains reconstructed `RuntimeState` and corresponding `VisualizationFrame`.
- Dispatches update to listeners.

### Backward Stepping (`prevFrame()`)
- Decrements `_currentIdx` by 1.
- Deterministically reconstructs `RuntimeState` at `_currentIdx`.
- Passes the reconstructed frame to visualizers. No destructive rollback logic is required.

### Scrubbing (`jumpTo(idx)`)
- Jumps directly to any arbitrary frame index $0 \le \text{idx} < \text{totalFrames}$.
- Reconstructs state in $\mathcal{O}(K)$ time where $K$ is the checkpoint interval.
- Eliminates visual corruption and accumulated animation drift.

---

## 5. Visualization Boundary & Separation of Concerns

ProViz enforces a strict boundary between truth and presentation:

```text
Runtime State (TRUTH)
        │
        ▼
   Render State
        │
        ▼
Three.js Scene (PRESENTATION)
```

1. **Logical state changes immediately** upon frame selection.
2. **3D visualizers visually interpolate** toward the new state without holding authoritative program data.
3. **Visualizer errors or animation delays never corrupt** the underlying execution timeline or state reconstructor.

---

## 6. Compatibility & Validation

- **Backward Compatibility**: Fully compatible with `LegacyFrameAdapter`, `BaseVisualizer`, `VariableVisualizer`, `ArrayVisualizer`, `CallStackVisualizer`, and `ExplanationEngine`.
- **Automated Verification**: Validated with 68 test assertions in [test/test_stage3_playback.mjs](file:///Users/reyanshmanta/Code%20and%20all/ProViz/test/test_stage3_playback.mjs) alongside Stage 1 and Stage 2 regression suites.
