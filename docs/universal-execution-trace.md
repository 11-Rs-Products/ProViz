# Universal Execution Trace (UET) Specification

> **Version:** 1  
> **Status:** Active / Canonical Contract  
> **Scope:** Stage 1 Foundation  

---

## 1. Purpose

The **Universal Execution Trace (UET)** is the canonical runtime contract in ProViz. It defines a language-neutral, visualization-agnostic, and problem-independent representation of program execution.

Prior to Stage 1, the tracing pipeline coupled Python `sys.settrace` logs directly to question metadata and visualization-specific assumptions. UET solves this by establishing a clear separation between:
- **What happened during execution** (the trace), and
- **How that execution is visualized or explained** (the presentation layer).

---

## 2. Core Design Principles

1. **Language-Neutral**: Conceptual schema designed to represent execution across languages (Python in Stage 1; JavaScript, C++, etc., in future stages).
2. **Visualization-Independent**: The trace never contains rendering primitives such as Three.js meshes, RGB/hex colors, geometry coords, camera angles, or GSAP tween configurations.
3. **Problem-Independent**: Execution does not require a `questionId`, test suite, or pre-configured scene callbacks. Educational problems exist purely as an optional context layer above execution.
4. **Deterministic & Sequential**: Every event possesses a unique numeric identifier and explicit source code location.

---

## 3. UET Schema (Version 1)

### 3.1 Trace Envelope Schema

```typescript
interface ExecutionTrace {
  version: 1;
  metadata: {
    language: string;        // 'python'
    runtime: string;         // 'pyodide'
    version: string;         // '3.x'
    timestamp: number;       // Epoch timestamp in ms
    duration_ms: number;     // Execution duration
    event_count: number;     // Total number of events
  };
  source: {
    entrypoint: string;      // 'main.py'
    files: Record<string, string>; // Source code map
  };
  events: TraceEvent[];
  result: {
    success: boolean;
    output: string;
    error: {
      type: string;
      message: string;
      line: number | null;
      traceback?: string;
    } | null;
  };
  final_state: {
    output: string;
  };
}
```

### 3.2 Event Envelope Schema

```typescript
interface TraceEvent {
  id: number;                // Sequential event ID (0, 1, 2, ...)
  type: 'program_start' | 'line' | 'call' | 'return' | 'exception' | 'program_end';
  source: {
    file: string;            // 'main.py'
    line: number | null;     // 1-indexed source line
    column: number | null;   // Column number if available
  };
  scope: {
    function: string;        // Function name or '<module>'
    depth: number;           // Call stack depth (1 = module level)
  };
  timestamp: number;         // Epoch timestamp in ms
  data: {
    locals?: Record<string, any>;
    changed_variables?: Array<{
      name: string;
      old_value: any;
      new_value: any;
      is_new: boolean;
    }>;
    stack?: Array<{
      function: string;
      line: number;
    }>;
    return_value?: any;
    exception_type?: string;
    exception_message?: string;
    output?: string;
  };
}
```

---

## 4. Supported Event Types in Stage 1

| Event Type | Trigger | Key Data Payload |
|---|---|---|
| `program_start` | Execution begins | `source.file`, `scope: <module>` |
| `line` | Step to source line | `locals`, `changed_variables`, `stack` |
| `call` | Function invocation | `scope.function`, `locals` (arguments), `stack` |
| `return` | Function return | `return_value`, `scope.function` |
| `exception` | Runtime error / unhandled exception | `exception_type`, `exception_message` |
| `program_end` | Execution completed | `output` (accumulated stdout) |

---

## 5. Architectural Ownership & Data Flow

```text
[ Source Code / ExecutionRequest ]
               │
               ▼
   [ Language Runtime Adapter ]        (e.g., PythonExecutor via Pyodide)
               │
               ▼
[ Universal Execution Trace (UET v1) ]  <-- Canonical Contract Boundary
               │
               ▼
     [ LegacyFrameAdapter ]            (Compatibility layer for Stage 1)
               │
               ▼
      [ PlaybackEngine ]
         │           │
         ▼           ▼
[ ExplanationEngine ] [ 3D Visualizers / DOM CallStack ]
```

- **Runtime Layer (`PythonExecutor`)**: Responsible for execution and normalizing runtime events into UET.
- **Trace Layer (`TraceSchema`, `ExecutionRequest`)**: Defines contracts and validation.
- **Adapter Layer (`LegacyFrameAdapter`)**: Converts UET events into legacy `VisualizationFrame` structures so existing visualizers and playback controls continue to work without a full rewrite.
- **Presentation Layer (`BaseVisualizer`, `VariableVisualizer`, `ArrayVisualizer`, `CallStackVisualizer`, `ExplanationEngine`)**: Derives visual and textual representations from frames.
- **Problem Layer (`questions/registry.js`)**: Optional context attached to an `ExecutionRequest`.

---

## 6. Versioning Strategy

The trace root includes an explicit integer `version: 1`. 
- **Backward Compatibility**: Future visualizer and inspector components can inspect `trace.version` to determine available features (such as heap references in Version 2).
- **Migration Pipeline**: Trace normalizers can upgrade legacy trace versions prior to ingestion by the state engine.

---

## 7. Deferred to Stage 2: Object Identity & Heap Graph

Stage 1 establishes the event envelope and eliminates the problem dependency. The following state modeling capabilities are explicitly scheduled for **Stage 2**:
- **Object Identity (`id(v)`)**: Preserving distinct memory addresses rather than flat truncated strings.
- **Heap Object Graph**: Modeling mutable objects (lists, dictionaries, class instances) as discrete heap nodes.
- **Reference Topology**: Capturing pointer edges from stack frames to heap nodes and heap nodes to other heap nodes.
- **In-Place Mutation Events**: Granular collection mutation events (e.g. `list_set_item`, `list_append`, `dict_set_key`).
