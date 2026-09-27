# ProViz Dependency Map

This document details the module dependencies, data flow, state ownership, and coupling across the ProViz codebase.

---

## 1. System Dependency Graph (Mermaid)

```mermaid
graph TD
    subgraph Core_Entrypoint
        Main[main.js]
    end

    subgraph External_Libraries
        Three[three / RoundedBoxGeometry / OrbitControls]
        GSAP[gsap]
        CM[codemirror / @codemirror/*]
        PyodideJS[window.loadPyodide (CDN)]
        FirebaseSDK[firebase/app, firebase/auth]
        SanitySDK[@sanity/client]
    end

    subgraph Execution_Engine
        PyExec[src/engine/PythonExecutor.js]
        TracerPy[Embedded Python Tracer Script]
    end

    subgraph Trace_Engine
        TraceTrans[src/engine/TraceTransformer.js]
    end

    subgraph State_and_Playback
        Playback[src/PlaybackEngine.js]
        Explain[src/ExplanationEngine.js]
    end

    subgraph Visualizers
        BaseVis[src/visualizers/BaseVisualizer.js]
        VarVis[src/visualizers/VariableVisualizer.js]
        ArrVis[src/visualizers/ArrayVisualizer.js]
        CSVis[src/visualizers/CallStackVisualizer.js]
    end

    subgraph Content_and_Auth
        Registry[src/questions/registry.js]
        SanityMod[src/sanity.js]
        FirebaseMod[src/firebase.js]
        Landing[src/landing.js]
    end

    Main --> CM
    Main --> Three
    Main --> PyExec
    Main --> TraceTrans
    Main --> Playback
    Main --> Explain
    Main --> BaseVis
    Main --> VarVis
    Main --> ArrVis
    Main --> CSVis
    Main --> Registry
    Main --> SanityMod
    Main --> FirebaseMod
    Main --> Landing

    PyExec --> PyodideJS
    PyExec --> TracerPy

    VarVis --> BaseVis
    ArrVis --> BaseVis
    BaseVis --> Three
    BaseVis --> GSAP

    Landing --> Three
    Landing --> GSAP

    FirebaseMod --> FirebaseSDK
    SanityMod --> SanitySDK
```

---

## 2. Module Inventory & Inter-Module Analysis

### 2.1 `main.js` (App Orchestrator)
- **Imports**:
  - `three`, `OrbitControls`
  - `@codemirror/state`, `@codemirror/view`, `codemirror`, `@codemirror/lang-python`
  - `./src/engine/PythonExecutor.js`
  - `./src/engine/TraceTransformer.js`
  - `./src/PlaybackEngine.js`
  - `./src/ExplanationEngine.js`
  - `./src/visualizers/BaseVisualizer.js`
  - `./src/visualizers/VariableVisualizer.js`
  - `./src/visualizers/ArrayVisualizer.js`
  - `./src/visualizers/CallStackVisualizer.js`
  - `./src/questions/registry.js`
  - `./src/landing.js`
  - `./src/firebase.js`
  - `./src/sanity.js`
- **Called By**: Injected as main script in `index.html` (`<script type="module" src="/main.js">`).
- **State Owned**:
  - `currentQuestion`: Currently selected question schema object.
  - `activeMode`: `'user'` | `'solution'`.
  - `isAppInitialized`, `currentUser`, `lastAuthError`, `allQuestions`, `isPlayingBack`.
  - `_renderBusy`: Mutex flag for frame rendering.
  - Three.js instance objects: `scene`, `camera`, `renderer`, `controls`, `group`.
  - CodeMirror instance: `editor`.
- **Outputs**:
  - Direct DOM mutations (error messages, question titles, tabs, buttons, panels).
  - Canvas updates via WebGL renderer animation loop.

---

### 2.2 `src/engine/PythonExecutor.js`
- **Imports**: None (accesses `window.loadPyodide` from CDN script).
- **Called By**: `main.js` (`executor.init()`, `executor.execute(code)`).
- **State Owned**:
  - `pyodide`: Reference to loaded Pyodide instance.
  - `isReady`: Boolean status flag.
  - `_initPromise`: Idempotency promise for runtime loading.
- **Embedded Components**:
  - Inlines Python string: `_tracerPythonSource()` defining `_ProVizTracer` class with `sys.settrace`.
- **Outputs**:
  - `ExecutionTrace` object containing metadata, event array, final stdout output, and error payload.

---

### 2.3 `src/engine/TraceTransformer.js`
- **Imports**: None (pure JS transformation class).
- **Called By**: `main.js` (`transformer.transform(trace, questionConfig)`).
- **State Owned**: Stateless between calls (local `frames`, `outputAccum`, `frameId`).
- **Outputs**:
  - `VisualizationFrame[]` array ready for playback consumption.

---

### 2.4 `src/PlaybackEngine.js`
- **Imports**: None (pure JS timing/event class).
- **Called By**: `main.js` (`playback.setFrames()`, `playback.play()`, `playback.pause()`, `playback.nextFrame()`, `playback.prevFrame()`, `playback.restart()`, `playback.setSpeed()`).
- **State Owned**:
  - `_frames`: Array of frames.
  - `_currentIdx`: Current position index.
  - `_playing`: Auto-play boolean flag.
  - `_playTimer`: Timer reference for `setTimeout`.
  - `_listeners`: Subscriber callback functions (`fn(frame, event_type)`).
  - `speedMs`: Step duration in milliseconds.
- **Outputs**:
  - Notification dispatches to registered listeners with current `VisualizationFrame`.

---

### 2.5 `src/ExplanationEngine.js`
- **Imports**: None.
- **Called By**: `main.js` (`explainer.explain(frame)`).
- **State Owned**: Stateless helper methods.
- **Outputs**:
  - `{ primary: string, secondary: string, badges: string[] }`.

---

### 2.6 `src/visualizers/BaseVisualizer.js`
- **Imports**:
  - `three`
  - `three/examples/jsm/geometries/RoundedBoxGeometry.js`
  - `gsap`
- **Called By**:
  - Extended by `VariableVisualizer.js` and `ArrayVisualizer.js`.
  - Instantiated in `main.js` as `baseVis`.
- **State Owned**:
  - `scene`: Reference to root Three.js scene.
  - `group`: Reference to root Three.js group.
  - `blocks`: Hashmap `id -> { mesh, label, colorKey }`.
- **Outputs**:
  - Three.js meshes (`Mesh`, `LineSegments`, `CanvasTexture`, `MeshStandardMaterial`) added to `this.group`.
  - GSAP tween promises.

---

### 2.7 `src/visualizers/VariableVisualizer.js`
- **Imports**: `BaseVisualizer.js`.
- **Called By**: `main.js` (`varViz.reset()`, `varViz.consumeFrame(frame)`).
- **State Owned**:
  - `_varOrder`: Array of variable names to manage fixed grid indexing.
  - Inherited `blocks` map from `BaseVisualizer`.
- **Outputs**:
  - Spawns and updates 3D boxes representing local variables.

---

### 2.8 `src/visualizers/ArrayVisualizer.js`
- **Imports**: `BaseVisualizer.js`.
- **Called By**: `main.js` (`arrayViz.initialize()`, `arrayViz.consumeFrame(frame, pointerVars)`, `arrayViz.clearAll()`).
- **State Owned**:
  - `_arrayName`: String name of target array.
  - `_arrayValues`: Array of element values.
  - `_pointers`: Map `varName -> index`.
- **Outputs**:
  - 3D array elements (`arr_el_i`), index markers (`arr_idx_i`), and pointer labels (`arr_ptr_name`).

---

### 2.9 `src/visualizers/CallStackVisualizer.js`
- **Imports**: None.
- **Called By**: `main.js` (`callStackViz.reset()`, `callStackViz.consumeFrame(frame)`).
- **State Owned**:
  - `container`: DOM element (`#call-stack-container`).
  - `_frames`: Internal stack representation `[{ function, line, locals, isTop }]`.
  - `_pendingAnimation`: `'push'` | `'pop'` | `null`.
- **Outputs**:
  - HTML markup injected into `container.innerHTML`.

---

### 2.10 `src/questions/registry.js`
- **Imports**: None.
- **Called By**: `main.js` (fallback problem catalog).
- **State Owned**: Static problem definitions array.
- **Outputs**:
  - Array of problem objects with metadata, starter code, solution code, and visualizer callbacks.

---

### 2.11 `src/firebase.js` & `src/sanity.js`
- **Imports**: `firebase/app`, `firebase/auth`, `@sanity/client`.
- **Called By**: `main.js` for Google sign-in, auth state monitoring, email saving, and cloud question fetching.
- **State Owned**: SDK client connections.
