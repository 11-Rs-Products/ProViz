# Universal Debugger & IDE Core (Stage 5)

## 1. Architecture Overview

In Stage 5, ProViz evolves its underlying execution, runtime state, timeline reconstruction, and scene graph layers into a **language-agnostic universal debugger model**.

The debugger serves as the central orchestration controller between code editing, execution traces, deterministic timeline reconstruction, variable inspection, call stack navigation, and 3D visualization.

```text
                                CodeMirror Editor
                                        │
                                        ▼
                                 ExecutionRequest
                                        │
                                        ▼
                                 Python Runtime
                                        │
                                        ▼
                        Universal Execution Trace (UET)
                                        │
                                        ▼
                                  RuntimeState
                                        │
                                        ▼
                                  PlaybackEngine
                                        │
                                        ▼
                                   Debugger
                  ┌─────────────────────┼─────────────────────┐
                  ▼                     ▼                     ▼
            Source State            Variables            Call Stack
                  │
                  └─────────────────────┬─────────────────────┘
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

## 2. DebuggerState Abstraction (`src/debugger/DebuggerState.js`)

`DebuggerState` is an immutable snapshot describing the user's observation point in program execution and derived runtime state views at a specific frame index:

```js
{
  status: "idle" | "running" | "paused" | "completed" | "error",
  frameIndex: 42,
  totalFrames: 100,

  sourceLocation: {
    file: "main.py",
    line: 17,
    column: null
  },

  runtimeState: RuntimeState,
  sceneGraph: SceneGraph,
  currentFrame: VisualizationFrame,

  callStack: [ CallFrame, CallFrame ],
  activeLocals: { x: Value, nums: Value },

  reason: "idle" | "step" | "breakpoint" | "exception" | "program_end" | "jump" | "restart" | "run" | "pause",
  exception: { type: "ZeroDivisionError", message: "division by zero", line: 17 } | null,
  breakpoints: [ Breakpoint, Breakpoint ]
}
```

### Separation of Responsibilities

* **`RuntimeState` answers:** *What exists in program memory?* (Heap objects, bindings, frames)
* **`DebuggerState` answers:** *Where is the user observing that program? Why is execution paused? Which source line corresponds to this point?*

---

## 3. Debugger Controller (`src/debugger/Debugger.js`)

The `Debugger` class is the central coordinator:

* **Composition:** Composes directly with `PlaybackEngine` rather than creating a competing timeline.
* **Lifecycle Management:** Tracks lifecycle state (`idle`, `running`, `paused`, `completed`, `error`).
* **Deterministic Navigation:** Coordinates forward stepping, backward stepping, arbitrary scrubbing, and continuing until breakpoints or exceptions.
* **Renderer & Editor Decoupling:** Contains zero Three.js, WebGL, CodeMirror, or DOM references.

### Public API

```js
debugger.loadExecution(uetTrace, problemConfig);
debugger.run();
debugger.pause();
debugger.continue();
debugger.stepForward();
debugger.stepBackward();
debugger.restart();
debugger.jumpTo(frameIndex);

debugger.addBreakpoint(file, line);
debugger.removeBreakpoint(file, line);
debugger.toggleBreakpoint(file, line);
debugger.hasBreakpoint(file, line);
debugger.getBreakpoints();

debugger.getSourceLocation();
debugger.getDebuggerState();
debugger.onStateChange(listenerFn);
```

---

## 4. Execution vs. Debugging Distinction

A fundamental invariant of the ProViz architecture is:

```text
Execution (Eager):
Code → ExecutionRequest → Runtime → Universal Trace
```

versus

```text
Debugging (Timeline Replay):
Trace → Timeline → StateReconstructor → DebuggerState → UI / 3D World
```

1. Program code executes **once eagerly** to produce the canonical Universal Execution Trace (UET).
2. Debugger operations (`stepForward`, `stepBackward`, `continue`, `jumpTo`) navigate the recorded timeline deterministically without re-executing Python code.

---

## 5. Source Location Mapping

Every timeline frame index `N` resolves deterministically to a source location:

```js
{
  file: "main.py",
  line: 12,
  column: null
}
```

Source locations derive directly from structured UET frame events (`current_line`, `source.file`). Column information defaults to `null` without fabricating false offsets.

---

## 6. Breakpoint Model (`src/debugger/Breakpoint.js`)

Breakpoints operate against source line numbers in the recorded timeline:

```js
{
  id: "main.py:17",
  file: "main.py",
  line: 17,
  enabled: true
}
```

### Semantics

* `continue()` advances frame-by-frame through the timeline until:
  1. An enabled breakpoint line matches the current frame's source line (`status: 'paused', reason: 'breakpoint'`).
  2. An exception frame is hit (`status: 'error', reason: 'exception'`).
  3. The end of the trace is reached (`status: 'completed', reason: 'program_end'`).
* When paused on a breakpoint, calling `continue()` steps off the current line first before continuing.

---

## 7. Variables Panel & Object Identity

The debugger exposes variables in the active scope via `RuntimeState.activeLocals` and `RuntimeState.heap`.

### Object Aliasing Preservation

For code such as:
```python
a = [1, 2]
b = a
```

The debugger UI renders identity badges:
```text
a → obj_1 (list)
b → obj_1 (list)
```

Both variables reference the exact same heap object (`obj_1`). The UI never presents aliased references as independent duplicate arrays.

### Object Expansion

References support expandable inspection for:
* **Lists / Tuples:** Indexed element array (`[0] 10, [1] 20`).
* **Dictionaries:** Key/value map bindings.
* **Sets:** Element membership sets.
* **Custom Objects:** Class name and instance attribute map.

---

## 8. Call Stack Panel

The call stack panel is driven directly by `RuntimeState.callStack` as the single source of truth:

```text
Call Stack

▾ bar() (line 5)
    x = 3

  foo() (line 12)
    y = obj_4

  <module> (line 20)
    numbers = obj_4
```

The active (topmost) frame is highlighted, while parent frames preserve independent local variable bindings.

---

## 9. Exception Handling

When execution produces a runtime exception:

```js
{
  status: "error",
  reason: "exception",
  exception: {
    type: "ZeroDivisionError",
    message: "division by zero",
    line: 5
  }
}
```

The debugger pauses at the exact exception source line, exposing the structured exception details without parsing console text.

---

## 10. Editor Integration (`src/debugger/EditorDebuggerAdapter.js`)

To keep `Debugger` core editor-independent, line highlighting and gutter interactions are bridged via `EditorDebuggerAdapter`:

```text
Debugger Core ◄───── onStateChange ───── EditorDebuggerAdapter ─────► CodeMirror 6 EditorView
```

---

## 11. Synchronization Invariant

When the user navigates to frame index `N`, all layers are guaranteed to agree:

```text
Debugger frame index (N)
        =
PlaybackEngine frame index (N)
        =
RuntimeState reconstructed at N
        =
SceneGraph derived from RuntimeState N
        =
Source location in UET frame N
```

---

## 12. Regression Test Results

```text
Stage 1 (UET & Schema):               31/31 passed
Stage 2 (RuntimeState & Heap):        51/51 passed
Stage 3 (Timeline & Reconstruction):  68/68 passed
Stage 4 (Universal Scene Graph):      73/73 passed
Stage 5 (Debugger & IDE Core):        88/88 passed

Total Assertion Count: 311/311 passed (0 failed, 0 regressions)
```
