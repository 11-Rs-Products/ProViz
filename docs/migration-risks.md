# ProViz Migration Risks & Mitigations

This document outlines key technical and architectural risks identified during the **Stage 0 Baseline & Architecture Audit**, along with mitigation strategies for future migration stages.

---

## 1. Risk Matrix

| Risk ID | Risk Title | Severity | Likelihood | Impact Area |
|---|---|---|---|---|
| **R1** | Loss of Object Identity & Heap Topology | **Critical** | High | Tracing, Memory Graph, Visualization |
| **R2** | Desynchronized 3D Scene on Backward Playback | **Critical** | High | Playback, BaseVisualizer, UX |
| **R3** | Hardcoded Problem Coupling in Orchestrator | **High** | High | UI, Execution Pipeline, Generic IDE |
| **R4** | Heavy Main Thread Execution in Pyodide | **High** | Medium | Browser Responsiveness, Infinite Loops |
| **R5** | Fragile Ad-Hoc Array Pointer Heuristics | **Medium** | High | ArrayVisualizer, Specialized Plugins |
| **R6** | Inlined Python Tracer Script Maintenance | **Medium** | High | Python Runtime Adapter, Developer DX |
| **R7** | Absence of Automated Unit Test Suite | **High** | High | Regression Testing, Refactoring Safety |

---

## 2. Detailed Risk Descriptions & Mitigation Strategies

### Risk R1: Tracing Serializes Values to Strings, Discarding Object Identity (`id(v)`)
- **Root Cause**: `_tracerPythonSource()` in `PythonExecutor.js` executes `repr(v)[:80]` to serialize values into string primitives.
- **Consequence**: Two references pointing to the same list or custom object appear as identical, independent string literals. Mutation of shared objects cannot be tracked as a single heap node update.
- **Mitigation for Stage 1/2**:
  - Update the Python tracer to record unique Python object IDs (`id(v)`), memory types (`type(v).__name__`), and reference relationships.
  - Implement a structured **Heap Object Graph** in the Universal Execution Trace (UET).

---

### Risk R2: Visualizers Mutate 3D State Forward-Only, Breaking Reverse Stepping / Scrubbing
- **Root Cause**: `BaseVisualizer` and `ArrayVisualizer` maintain persistent mesh registries (`this.blocks`). `consumeFrame(frame)` applies incremental forward deltas. When `playback.prevFrame()` or `playback.jumpTo()` is triggered, applying past frames as forward updates results in stale or misplaced meshes.
- **Consequence**: Stepping backwards or jumping on the timeline produces visual glitches or phantom 3D blocks.
- **Mitigation for Stage 2/3**:
  - Redesign the visualization engine to consume **declarative, immutable scene state snapshots** for each frame index, or implement an explicit state reset/re-render mechanism on non-linear jumps.

---

### Risk R3: Execution Pipeline Hard-Blocked on `currentQuestion`
- **Root Cause**: In `main.js`, `runCode()` begins with `if (!currentQuestion) return;` and passes `currentQuestion.visualization` into `TraceTransformer` and `setupScene()`.
- **Consequence**: ProViz cannot currently run arbitrary user code entered in a blank scratchpad without a predefined problem structure.
- **Mitigation for Stage 1**:
  - Make `questionConfig` optional with safe empty defaults in `TraceTransformer` and `setupScene`.
  - Introduce a default "Freeform Scratchpad" mode in the UI.

---

### Risk R4: Pyodide Blocking the Browser Main Thread
- **Root Cause**: `PythonExecutor.js` runs Pyodide directly on the UI main thread via `await this.pyodide.runPythonAsync(...)`.
- **Consequence**: Long-running user code or accidental infinite loops (e.g. `while True: pass`) freeze the entire browser tab, rendering the UI unresponsive.
- **Mitigation for Stage 1/2**:
  - Move Pyodide execution into a dedicated **Web Worker**.
  - Add execution timeout and cancellation hooks via `Worker.terminate()`.

---

### Risk R5: Hardcoded Pointer Names in Array Visualization
- **Root Cause**: `ArrayVisualizer.js` inspects hardcoded variable names: `['i', 'j', 'left', 'right', 'mid', 'idx']`.
- **Consequence**: If a user names their loop pointer `ptr`, `k`, or `cur`, the array visualizer fails to render the pointer marker.
- **Mitigation for Stage 2/3**:
  - Infer collection indices dynamically based on AST access patterns or explicit index bounds heuristics, rather than fixed identifier names.

---

### Risk R6: Multi-line String Python Tracer Embedded in JavaScript
- **Root Cause**: The tracer Python code is an embedded multiline template literal inside `PythonExecutor.js`.
- **Consequence**: Syntax highlighting, Python linting, and unit testing of the tracer module are impossible in standard JS development workflows.
- **Mitigation for Stage 1**:
  - Move the Python tracer code into a dedicated `.py` asset file loaded at build time or fetched as raw text.

---

### Risk R7: High Refactoring Risk Due to Lack of Unit Tests
- **Root Cause**: Existing tests consist only of 4 Puppeteer end-to-end browser automation scripts requiring a running dev server.
- **Consequence**: Changes to `TraceTransformer` or `PlaybackEngine` could introduce silent regressions that E2E tests do not catch.
- **Mitigation for Stage 1**:
  - Introduce a lightweight unit test runner (such as Vitest) for pure logic modules (`TraceTransformer`, `PlaybackEngine`, `ExplanationEngine`).
