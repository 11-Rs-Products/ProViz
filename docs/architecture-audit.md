# ProViz Architecture Audit

## 1. Executive Summary

ProViz is currently structured as an educational Python DSA visualizer running entirely client-side via Pyodide (WASM) and Three.js / GSAP.

While it successfully demonstrates client-side Python execution with `sys.settrace`, animated 3D block updates, and natural language explanations, the current codebase exhibits significant architectural coupling:
- **Execution & Tracing** serialize runtime values immediately to truncated string representations (`repr(v)` up to 80 characters), discarding object identity (`id(v)`), memory addresses, and structured nested references (heap graph).
- **Visualization** is divided between Three.js 3D blocks (`BaseVisualizer`, `VariableVisualizer`, `ArrayVisualizer`) and DOM elements (`CallStackVisualizer`), heavily reliant on hardcoded variable naming conventions (`i`, `j`, `left`, `right`), manual problem initialization hooks (`initial_scene(ctx)`), and hardcoded 3D grid layouts.
- **Problem Coupling**: The orchestrator (`main.js`) requires a selected question (`currentQuestion`) to initiate execution and bind tracked variable pointers; it cannot currently serve as an open, universal Python IDE canvas out of the box.
- **Playback & State Replay**: Playback steps forward and backward through pre-computed frame snapshots; however, backward stepping does not reliably undo 3D mutations because Three.js visualizer animations (`consumeFrame`) mutate local mesh state destructively during forward playback without full inverse reconstruction.

---

## 2. Current Architecture Diagram

```mermaid
flowchart TD
    subgraph UI_Layer [User Interface & Presentation]
        HTML[index.html / style.css]
        Landing[src/landing.js (Hero 3D Canvas)]
        Editor[CodeMirror 6 Editor]
        Controls[Playback Controls & Speed Slider]
        DOMStack[CallStack DOM Panel]
        ExplPanel[Explanation & Badges Panel]
    end

    subgraph Orchestration [App Orchestrator]
        Main[main.js]
    end

    subgraph Execution_Engine [Execution & Tracing Engine]
        PyExec[PythonExecutor.js]
        Pyodide[Pyodide WASM Runtime]
        SysTrace[Python sys.settrace Hook]
    end

    subgraph Trace_Transformation [Trace Processing]
        Transformer[TraceTransformer.js]
        Frames[VisualizationFrame Array]
    end

    subgraph Playback_Subsystem [Playback Controller]
        Playback[PlaybackEngine.js]
    end

    subgraph Explanation_Subsystem [Explanation Engine]
        Explainer[ExplanationEngine.js]
    end

    subgraph Visualizers_3D [3D Scene & Visualizers]
        ThreeScene[Three.js Scene / Camera / OrbitControls]
        BaseVis[BaseVisualizer.js (GSAP + RoundedBox)]
        VarVis[VariableVisualizer.js]
        ArrVis[ArrayVisualizer.js]
    end

    subgraph Content_Auth [External Services & Question Catalog]
        Sanity[Sanity CMS / Questions API]
        Firebase[Firebase Auth (IITM Domain)]
        Registry[src/questions/registry.js]
    end

    HTML --> Main
    Landing --> Main
    Firebase --> Main
    Sanity --> Main
    Registry --> Main
    Editor --> Main

    Main -->|1. Run Code| PyExec
    PyExec -->|2. Run with Tracer| Pyodide
    Pyodide -->|3. sys.settrace Events| SysTrace
    SysTrace -->|4. JSON Payload| PyExec
    PyExec -->|5. ExecutionTrace| Main

    Main -->|6. Transform Trace + Question Config| Transformer
    Transformer -->|7. VisualizationFrame[]| Frames
    Frames -->|8. setFrames()| Playback

    Playback -->|9. onFrameChange(frame)| Main
    Main -->|10. Highlight Line| Editor
    Main -->|11. explain(frame)| Explainer --> ExplPanel
    Main -->|12. consumeFrame(frame)| DOMStack
    Main -->|13. consumeFrame(frame)| VarVis --> BaseVis --> ThreeScene
    Main -->|14. consumeFrame(frame)| ArrVis --> BaseVis --> ThreeScene
```

---

## 3. Execution Flow

The real execution pipeline from user interaction to screen update is as follows:

```text
[User clicks '▶ Run Code' (btnRun)]
       ↓
main.js: runCode()
       │
       ├─► Validates currentQuestion exists (fails silently if null)
       ├─► Calls setupScene(currentQuestion)
       │     └─► Resets baseVis, varViz, arrayViz, callStackViz
       │     └─► Invokes currentQuestion.visualization.initial_scene({baseVis, varViz, arrayViz})
       ├─► Reads Python code string from CodeMirror: editor.state.doc.toString()
       ├─► Invokes PythonExecutor.execute(code)
       │     │
       │     ├─► Sets Pyodide global: _user_code_to_run = code
       │     ├─► Executes Python helper: _run_user_code(_user_code_to_run)
       │     │     ├─► Redirects sys.stdout to StringIO buffer
       │     │     ├─► Installs _ProVizTracer.trace on sys.settrace
       │     │     ├─► exec(compile(code_str, '<user_code>', 'exec'), user_globals)
       │     │     ├─► Captures line, call, return, exception events (up to 50,000 events)
       │     │     ├─► Strips private/excluded globals and truncates values with repr(v)[:80]
       │     │     └─► Returns JSON string with events, stdout output, success flag, and error info
       │     └─► Parses JSON to produce ExecutionTrace object
       │
       ├─► Invokes TraceTransformer.transform(trace, questionConfig)
       │     ├─► Iterates over raw events, discarding non-actionable types
       │     ├─► Builds variable snapshots: variables[name] = { value, changed, is_new, old_value }
       │     ├─► Infers high-level operations: variable_create, variable_update, function_call, etc.
       │     ├─► Generates template-based description strings
       │     ├─► Appends optional 'output' frame
       │     └─► Returns VisualizationFrame[]
       │
       ├─► Loads frames into PlaybackEngine: playback.setFrames(frames)
       ├─► Displays playback controls and shows call stack panel if recursion/calls detected
       └─► Initiates playback.play() (auto-play by default)
             │
             ├─► PlaybackEngine advances index and triggers onFrameChange listener
             └─► main.js: renderFrame(frame)
                   ├─► Editor: highlightLine(frame.current_line) via CodeMirror StateEffect
                   ├─► Explanation: updateUI(frame) -> explainer.explain(frame)
                   ├─► Call Stack: callStackViz.consumeFrame(frame) (DOM updates)
                   └─► 3D Scene:
                         ├─► varViz.consumeFrame(frame) (Three.js blocks spawned/updated via GSAP)
                         └─► arrayViz.consumeFrame(frame, pointerVars) (tracks pointer variables i, j, etc.)
```

---

## 4. Current Trace Model

### 4.1 Raw Trace Event Schema (`PythonExecutor.js`)

```typescript
interface RawTraceEvent {
  event_id: number;
  type: 'line' | 'call' | 'return' | 'exception';
  line: number;
  function: string;
  locals: Record<string, string>; // Values serialized via repr(v)[:80]
  changed_variables: Array<{
    name: string;
    old_value: string | null;
    new_value: string;
    is_new: boolean;
  }>;
  stack: Array<{
    function: string;
    line: number;
  }>;
  stack_depth: number;
  return_value?: string;          // On 'return'
  exception_type?: string;        // On 'exception'
  exception_message?: string;     // On 'exception'
}

interface ExecutionTrace {
  metadata: {
    language: 'python';
    version: '3.x (Pyodide)';
    timestamp: number;
    duration_ms: number;
    event_count: number;
  };
  initial_state: Record<string, any>;
  events: RawTraceEvent[];
  final_state: {
    output: string;
  };
  result: {
    success: boolean;
    output: string;
  };
  error: null | {
    type: string;
    message: string;
    line: number | null;
    traceback: string;
  };
}
```

### 4.2 Transformed Frame Schema (`TraceTransformer.js`)

```typescript
interface VisualizationFrame {
  frame_id: number;
  source_event_ids: number[];
  current_line: number | null;
  current_function: string | null;
  event_type: 'line' | 'call' | 'return' | 'exception' | 'output';
  description: string;
  variables: Record<string, {
    value: string;
    changed: boolean;
    is_new: boolean;
    old_value?: string;
  }>;
  call_stack: Array<{ function: string; line: number }>;
  stack_depth: number;
  changed_variables: Array<{
    name: string;
    old_value: string | null;
    new_value: string;
    is_new: boolean;
  }>;
  return_value: string | null;
  exception: { type: string; message: string } | null;
  operation: {
    type: 'function_call' | 'function_return' | 'exception' | 'variable_create' | 'variable_update' | 'multi_variable_update' | 'program_end';
    [key: string]: any;
  } | null;
  output_so_far: string;
}
```

### 4.3 Model Classification
The current trace format is a **hybrid snapshot + delta** model:
- `variables` contains full local snapshot strings at every step.
- `changed_variables` and `operation` contain delta markers computed by comparing previous locals in the Python tracer loop.
- Visualization-specific information is not embedded in the raw tracer, but `TraceTransformer` accepts a `questionConfig` object to filter variables.

---

## 5. Runtime State Model

### What currently exists:
- Shallow string snapshots of local frame variables (`f_locals`).
- Call stack frames with function names and current line numbers.
- Delta flags indicating variable creation or value string changes.
- Standard output text accumulation.

### What is missing:
1. **Object Identity & Memory Addresses**: No memory addresses (`id(v)`), object UUIDs, or reference tracking. If two variables reference the same list or object, the system treats them as independent strings.
2. **Heap Graph**: No representation of mutable heap objects (lists, dicts, instances) separate from stack bindings.
3. **Deep Structural Representation**: Complex structures (nested lists, trees, graphs, custom classes) are flattened into truncated strings like `"[1, [2, 3], ...]"`.
4. **Globals & Non-locals**: Globals are stripped out by the tracer (`_ProVizTracer.EXCLUDED_NAMES`), and closures / non-locals are ignored.
5. **Collection Mutation Tracking**: Mutations like `list.append()`, `dict[k] = v`, or in-place sorting are detected only as whole-string changes to the variable name, not indexed collection operations.

---

## 6. Visualization Architecture

The visualizer hierarchy is divided into Three.js 3D meshes and DOM overlays:

```text
BaseVisualizer (Three.js group manager, canvas texture generator, GSAP tweens)
   │
   ├── VariableVisualizer (3D cubes arranged in horizontal rows; spawns/flashes variables)
   └── ArrayVisualizer (3D horizontal blocks with index labels below and pointer labels above)

CallStackVisualizer (Independent DOM card container, CSS-based push/pop animations)
```

### Visualizer Audit Details:
1. **`BaseVisualizer`**:
   - Manages a dictionary `blocks: { [id]: { mesh, label, colorKey } }`.
   - Generates dynamic canvas textures for block faces using HTML5 2D Canvas rendering text in Inter font.
   - Creates `RoundedBoxGeometry` with wireframe outlines and subtle tilt.
   - Provides GSAP animations for `spawn`, `update`, `remove`, `move`, `highlight`.
2. **`VariableVisualizer`**:
   - Extends `BaseVisualizer`.
   - Places blocks on a fixed grid: `x = -5.2 + col * 3.0`, `y = -3.0 - row * 2.0`.
   - Assumes all locals can be rendered as scalar `"name=value"` boxes.
3. **`ArrayVisualizer`**:
   - Extends `BaseVisualizer`.
   - Expects manual initialization via `initialize(arrayName, values)`.
   - Assumes hardcoded pointer variable names: `['i', 'j', 'left', 'right', 'mid', 'idx']`.
   - Expects integer pointer values; fails gracefully on non-integer or out-of-bounds indices.
4. **`CallStackVisualizer`**:
   - Pure DOM-based renderer.
   - Injects HTML cards showing function call frames and top-frame locals.

---

## 7. Playback Architecture

- `PlaybackEngine` stores an array of `VisualizationFrame` objects and a pointer `_currentIdx`.
- Supports `nextFrame()`, `prevFrame()`, `jumpTo(idx)`, `restart()`, `play()`, `pause()`, and `setSpeed(ms)`.
- Playback triggers an `onFrameChange` callback.
- **Flaw in Backward Stepping**: While `PlaybackEngine` tracks the index correctly, visualizers (`BaseVisualizer`, `ArrayVisualizer`) perform forward animations with persistent in-memory mesh mutations (`this.blocks`). Backward stepping invokes `consumeFrame(frame)` which attempts to apply the past frame as a forward delta, often leading to visual desynchronization unless a complete `clearAll()` / reset is performed.

---

## 8. Explanation Architecture

- `ExplanationEngine.js` inspects `frame.operation` and `frame.event_type`.
- Outputs:
  - `primary`: Main description (e.g. `Entering function foo(x = 10)`).
  - `secondary`: Sub-text / diff details (e.g. `Stack depth: 2` or `0 → 1`).
  - `badges`: Categorization tag (e.g. `📞 Function Call`, `✨ New Variable`, `🔄 Updated`, `⚠️ Error`).
- Highly template-based; falls back to generic `"Executing line X in function Y"` for unhandled statement types.

---

## 9. Problem / DSA Architecture

- Problems are registered in `src/questions/registry.js` or fetched dynamically from Sanity CMS.
- **Can the current application execute arbitrary user-written Python code without a registered problem?**
  - **No.**
  - `main.js:runCode()` contains an explicit guard: `if (!currentQuestion) return;`.
  - Scene initialization relies on `currentQuestion.visualization.initial_scene(ctx)`.
  - Array tracking relies on `currentQuestion.visualization.tracked_variables`.
  - The UI does not expose an unconstrained "Blank Canvas / Scratchpad" mode.

---

## 10. UI Architecture

- **Landing Page (`src/landing.js`, `#landing-page`)**: Full marketing page with Three.js background, interactive sandbox demo, FAQ accordion, and Google Auth launch triggers.
- **Auth Overlay (`#login-overlay`)**: Restricts access via Firebase Auth to allowed institutional email domains (`@*.study.iitm.ac.in`, etc.).
- **Workspace Layout (`#layout-container`)**:
  - Left pane: Three.js WebGL canvas (`#canvas-container`, OrbitControls).
  - Right sidebar (`#ui-sidebar`): Problem selector, CodeMirror editor, Explanation card, Call Stack panel, Playback controls, Run/Reset buttons.
- State is managed via top-level variables inside `main.js` without a centralized state store.

---

## 11. External Services

| Service / Library | Role | Classification | Replacement / Isolation Plan |
|---|---|---|---|
| **Pyodide CDN** (`v0.25.0`) | In-browser Python WASM execution | Core Runtime | Keep as primary Python runtime adapter |
| **Three.js & OrbitControls** | 3D rendering engine | Core Runtime | Keep as primary visual rendering backend |
| **GSAP** (`v3.15.0`) | Tweening & micro-animations | Core Runtime | Keep for smooth 3D object interpolation |
| **CodeMirror 6** | Code editor & line highlighting | Core Runtime | Keep; expand language extensions |
| **Firebase Auth** | User authentication & email domain lock | Product / Content | Isolate behind optional auth boundary |
| **Sanity CMS** | Cloud question repository | Product / Content | Decouple completely from core visual IDE |

---

## 12. Testing Architecture

- **Current Tests**:
  - `test_run.cjs`: Puppeteer script launching browser on `http://localhost:5174`, waiting for Pyodide, clicking Run.
  - `test_solution.cjs`: Puppeteer script testing "Show Solution" mode and checking button visibility.
  - `test_screenshot.cjs` / `test_screenshot.js`: Captures visual canvas screenshot.
- **Test Coverage Gaps**:
  - Zero unit tests for `PythonExecutor`, `TraceTransformer`, `PlaybackEngine`, or `ExplanationEngine`.
  - Zero tests for complex Python language constructs (classes, comprehensions, nested objects, exceptions, infinite loops).
  - No automated validation of 3D scene graph state or visualizer memory leaks.

---

## 13. Architectural Coupling

| Area | Current Coupling | Problem | Future Direction (Stage 1+) |
|---|---|---|---|
| **PythonExecutor** | Inlines Python string tracer script directly in JS class; serializes with `repr()[:80]`. | Loses object identity, heap references, and type metadata; cannot support non-Python languages. | Abstract into a **Language Adapter** interface outputting a standard raw trace. |
| **TraceTransformer** | Inspects problem-specific config (`questionConfig.tracked_variables`) and creates fixed frame formats. | Tightly couples trace generation to the DSA question schema. | Universal **Trace Normalizer** converting language traces into a **Universal Execution Trace (UET)**. |
| **ArrayVisualizer** | Hardcodes pointer names (`i`, `j`, `left`, `right`) and expects pre-seeded array via `initialize()`. | Cannot visualize general collections or arbitrary data structures automatically. | Generic **Collection View / Memory Inspector Plugin** driven by heap object IDs. |
| **VariableVisualizer** | Hardcodes 2D grid coordinates and scalar `"name=value"` strings. | Breaks with nested objects, references, or many variables. | Universal **Scope & Environment Inspector / Graph Layout**. |
| **PlaybackEngine** | Relies on forward state mutation; backward stepping has no inverse transaction log or immutable scene tree. | Stepping backward causes visual anomalies in 3D scene. | Pure **State-Time Indexer** driving immutable scene state snapshots. |
| **Questions / Content** | `main.js` requires `currentQuestion` to run code; scene setup calls custom problem functions. | App cannot be used as an open general-purpose Python visual IDE. | Move Questions into an **Educational Content Module** layered on top of the open IDE. |
| **ExplanationEngine** | Uses hardcoded string pattern matching on basic operations. | Uninformative for arbitrary code logic or complex expressions. | **Semantic Event Explainer** deriving explanations from universal trace events. |

---

## 14. Technical Debt

### Critical (Blockers for Universal Vision)
1. **Lack of Heap & Object Identity**: Tracing values via `repr(v)` destroys memory graph topology.
2. **Mandatory Question Coupling**: `runCode()` and `setupScene()` require a registered question object.
3. **Destructive 3D Mutation**: 3D visualizers maintain mutable state that breaks on scrub / reverse stepping.

### High (Impediments to Scalability)
1. **Monolithic `main.js`**: Orchestration, DOM handling, Three.js setup, auth, and state are in one 568-line file.
2. **Hardcoded Visualizer Heuristics**: Pointers restricted to hardcoded variable names (`i`, `j`, `left`, etc.).
3. **No Execution Timeout / Worker Isolation**: Pyodide runs on the main thread; long loops block the UI.

### Medium (Quality & Maintainability)
1. **No Unit Test Suite**: Testing relies entirely on end-to-end Puppeteer scripts against live dev server.
2. **Mixed Rendering Paradigms**: Call stack is DOM-based while variables/arrays are WebGL, with no unified coordinate/layout manager.
3. **Sanity Schema Fragility**: `setupSceneJson` parser assumes exact JSON structure without schema validation.

### Low (Cleanup)
1. Unused files (`counter.js`, redundant screenshot scripts).
2. Hardcoded layout magic numbers in `VariableVisualizer` and `ArrayVisualizer`.

---

## 15. Gaps Against Target Architecture

```text
Target Dimension       Current State                         Target Universal State
──────────────────────────────────────────────────────────────────────────────────────────
Source Language        Python only                           Universal Language Adapters (Python first)
Trace Protocol         Custom ad-hoc JSON                     Universal Execution Trace (UET) Specification
Runtime State          Shallow string locals                 Full Environment Frame + Heap Object Graph
Object Identity        Lost (repr strings)                   Preserved (unique Object ID / Memory Address)
References             None                                  Explicit pointer edges (Var -> Heap Object)
Visual Representation  Ad-hoc 3D Blocks + Hardcoded Layout   Scene Graph with Generic & Specialized Views
Playback Engine        Frame array stepping                  Bi-directional timeline with snapshot tree
Problem Dependency     Required question context             Zero dependency; standalone Visual IDE first
```

---

## 16. Recommended Migration Boundaries

```text
┌────────────────────────────────────────────────────────┐
│ 1. Language Adapter Boundary                           │
│    PythonRuntimeAdapter (Pyodide + sys.settrace)       │
│    ──► Output: Raw Language Trace                      │
└──────────────────────────┬─────────────────────────────┘
                           ▼
┌────────────────────────────────────────────────────────┐
│ 2. Universal Trace Normalizer                          │
│    UET Normalizer (Frames, Scopes, Heap, Mutations)    │
│    ──► Output: Universal Execution Trace (UET)         │
└──────────────────────────┬─────────────────────────────┘
                           ▼
┌────────────────────────────────────────────────────────┐
│ 3. State & Scene Graph Model                           │
│    RuntimeStateStore (Time-travel state reconstructor)  │
│    ──► Output: Immutable Scene Description             │
└──────────────────────────┬─────────────────────────────┘
                           ▼
┌────────────────────────────────────────────────────────┐
│ 4. Visual Scene Renderer                               │
│    Renderer Manager (Generic Views + Custom Plugins)   │
└────────────────────────────────────────────────────────┘
```

---

## 17. Stage 1 Readiness

### Stage 1 Can Begin When:
- [x] Full architectural baseline and dependency pathways are mapped.
- [x] All coupling points between question metadata, Python tracing, and visualizers are identified.
- [x] Technical debt and migration risks are cataloged.
- [x] Universal Execution Trace (UET) schema requirements are defined.

---

## 18. Files That Should Eventually Change (Stage 1+)

- **Execution**: `src/engine/PythonExecutor.js` (extract tracer into dedicated Python script, capture object IDs/heap).
- **Trace**: `src/engine/TraceTransformer.js` (refactor into UET Normalizer).
- **State & Playback**: `src/PlaybackEngine.js` (add state snapshot reconstruction).
- **Visualization**: `src/visualizers/BaseVisualizer.js`, `src/visualizers/VariableVisualizer.js`, `src/visualizers/ArrayVisualizer.js`, `src/visualizers/CallStackVisualizer.js` (decouple from question metadata, accept generic scene descriptors).
- **UI & Orchestrator**: `main.js`, `index.html` (support scratchpad/free-code mode, decouple problem selector).
- **Problems**: `src/questions/registry.js`, `src/sanity.js` (wrap as optional problem pack plugin).
- **Testing**: Add Vitest / Jest unit tests for trace normalizer and state engine.
