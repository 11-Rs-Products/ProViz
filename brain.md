# ProViz — Project Brain

> **Status:** Architectural direction / source of truth  
> **Primary language:** Python first  
> **Long-term goal:** Universal, language-agnostic code visualization IDE  
> **Core idea:** ProViz is not a DSA visualizer that happens to run Python. It is a visual IDE/debugger that turns program execution into an interactive 3D representation.

---

## 1. Product Vision

ProViz is an interactive browser-based IDE where users can write code, execute it, inspect its runtime state, step through execution, and understand the program through synchronized visualizations and explanations.

The long-term product should allow a user to write **arbitrary code** without needing to configure a visualization beforehand.

Python is the first language. Other languages should eventually plug into the same visualization system.

### The fundamental pipeline

```text
Source Code
    ↓
Language Runtime
    ↓
Universal Execution Trace
    ↓
Runtime State / Heap / Call Stack
    ↓
Visualization Scene
    ↓
3D World
```

The key architectural principle is:

> **The execution layer describes what the program did. The visualization layer decides how that behavior should look.**

---

# 2. Current Product

ProViz currently contains:

- In-browser Python execution using Pyodide/WebAssembly
- `sys.settrace`-based execution tracing
- Three.js + GSAP 3D visualizations
- Variable visualization
- Array visualization
- Call-stack visualization
- Playback controls
- Human-readable execution explanations
- CodeMirror 6 editor
- DSA problem catalog
- Firebase authentication
- Sanity CMS
- Puppeteer testing
- Vite + vanilla JavaScript architecture

Current major modules include:

```text
main.js

src/
├── engine/
│   ├── PythonExecutor.js
│   └── TraceTransformer.js
│
├── visualizers/
│   ├── BaseVisualizer.js
│   ├── ArrayVisualizer.js
│   ├── VariableVisualizer.js
│   └── CallStackVisualizer.js
│
├── PlaybackEngine.js
├── ExplanationEngine.js
├── questions/
│   └── registry.js
├── firebase.js
└── sanity.js
```

This architecture works for the current DSA-oriented product, but it is too tightly coupled to predefined DSA concepts for the long-term vision.

---

# 3. Architectural North Star

The product should evolve from:

```text
Python
  ↓
DSA-specific trace
  ↓
Array / Variable / Stack visualizers
```

to:

```text
Code
  ↓
Language Adapter
  ↓
Universal Trace
  ↓
Runtime State
  ↓
Visualization Scene Graph
  ↓
Generic 3D Renderer
  ↓
Optional Specialized Visualizations
```

The core platform must not depend on:

- arrays
- linked lists
- trees
- graphs
- sorting
- binary search
- predefined coding questions

Those are **higher-level educational features** built on top of the core platform.

---

# 4. Core Architectural Principles

## 4.1 Visualization must not drive execution

The Python runtime should have no knowledge of:

- Three.js
- meshes
- animations
- camera positions
- block layouts
- visual styles

Execution produces semantic runtime information only.

Bad:

```text
PythonExecutor
    ↓
ArrayVisualizer
```

Good:

```text
PythonExecutor
    ↓
Universal Trace
    ↓
Runtime State
    ↓
Visualization Engine
```

---

## 4.2 Execution must be language-specific; visualization should be language-agnostic

Python will require Python-specific tracing and object inspection.

JavaScript, C++, Java, Rust, etc. will eventually require their own runtime adapters.

But all languages should converge into the same conceptual model:

```text
Language Adapter
       ↓
Universal Trace
       ↓
Universal Runtime State
       ↓
Universal Visualization
```

---

## 4.3 Do not require manual visualization configuration for ordinary code

A user should be able to write:

```python
x = 10
y = 20
z = x + y
```

and immediately see a visualization.

They should NOT have to write:

```js
visualizer: "variables"
```

or register `x`, `y`, or `z`.

Likewise:

```python
numbers = [10, 20, 30]
```

should automatically receive a generic collection visualization.

---

## 4.4 Specialized visualizations are plugins

Generic visualization is the default.

Specialized visualization can be layered on top.

Examples:

```text
Generic Object View
Generic Collection View
Reference / Pointer View
Call Stack View
Memory View
```

Optional specialized plugins:

```text
Array
Matrix
Linked List
Tree
Graph
Sorting
Heap
Recursion
```

The same runtime state should support multiple visual representations.

---

# 5. Universal Trace Model

The most important architectural abstraction is the **Universal Trace**.

The trace describes program execution independently of how it will be visualized.

A trace should capture concepts such as:

### Execution events

```text
program_start
line
function_call
function_return
exception
program_end
```

### Variable events

```text
variable_created
variable_assigned
variable_deleted
variable_mutated
```

### Object events

```text
object_created
attribute_changed
reference_created
reference_removed
```

### Collection events

```text
list_created
list_mutated
dict_created
dict_mutated
set_created
set_mutated
```

### Control-flow events

```text
branch_taken
loop_iteration
break
continue
return
```

The trace should describe semantics, not visuals.

---

# 6. Example Runtime Frame

A conceptual frame could look like:

```js
{
  id: 142,

  source: {
    file: "main.py",
    line: 17,
    column: 8
  },

  event: "line",

  callStack: [
    {
      function: "calculate",
      file: "main.py",
      line: 12
    }
  ],

  locals: {
    x: {
      type: "int",
      value: 10
    },

    user: {
      type: "object",
      objectId: "obj_17"
    }
  },

  heap: {
    "obj_17": {
      type: "User",
      attributes: {
        name: "Alice",
        age: 25
      }
    }
  },

  mutations: [
    {
      kind: "assignment",
      target: "x",
      previousValue: 9,
      value: 10
    }
  ]
}
```

Important:

> The frame does not say "render `x` as a blue cube."

That belongs to the visualization system.

---

# 7. Runtime State

The trace should reconstruct a runtime state containing:

```text
RuntimeState
├── source location
├── global variables
├── local variables
├── call stack
├── heap
├── object identities
├── references
├── collection contents
├── execution status
└── current event
```

Object identity is important.

For example:

```python
a = [1, 2]
b = a
```

The runtime must understand:

```text
a ─────┐
       ↓
     list #17
       ↑
b ─────┘
```

It must not treat `a` and `b` as two unrelated lists.

---

# 8. Immutable Trace + State Reconstruction

Do not store a complete copy of the entire program state for every execution frame.

That becomes expensive for large programs.

Prefer:

```text
Initial State
    +
Events / Deltas
    +
Periodic Checkpoints
```

Example:

```text
Checkpoint 0
    ↓
events 1–500
    ↓
Checkpoint 1
    ↓
events 501–1000
    ↓
Checkpoint 2
```

The playback engine reconstructs the requested state.

This enables:

- efficient scrubbing
- backward stepping
- long traces
- large heaps
- lower memory usage

---

# 9. Visualization Scene Graph

Three.js should not consume Python objects directly.

Introduce an intermediate representation:

```text
Runtime State
     ↓
Scene Builder
     ↓
Visualization Scene
     ↓
Three.js
```

Conceptually:

```js
{
  nodes: [
    {
      id: "variable:x",
      kind: "variable",
      label: "x",
      value: 42
    },

    {
      id: "object:17",
      kind: "object",
      type: "Person",
      label: "Person"
    }
  ],

  edges: [
    {
      from: "variable:user",
      to: "object:17",
      kind: "reference"
    }
  ]
}
```

This abstraction lets the visual design change without changing the execution engine.

---

# 10. Visualization Architecture

Target structure:

```text
visualization/
├── SceneManager.js
├── SceneGraph.js
├── ObjectRegistry.js
├── CameraController.js
│
├── generic/
│   ├── PrimitiveVisualizer.js
│   ├── ObjectVisualizer.js
│   ├── CollectionVisualizer.js
│   └── ReferenceVisualizer.js
│
└── specialized/
    ├── ArrayVisualizer.js
    ├── TreeVisualizer.js
    ├── GraphVisualizer.js
    └── CallStackVisualizer.js
```

### Generic visualizers

These should work for arbitrary Python programs.

### Specialized visualizers

These should enhance particular structures without becoming requirements for execution.

---

# 11. Generic Visualization Examples

## Primitive variables

```python
x = 10
y = 20
z = x + y
```

Could become:

```text
        PROGRAM STATE

   ┌─────────┐
   │    x    │
   │   10    │
   └─────────┘

   ┌─────────┐
   │    y    │
   │   20    │
   └─────────┘

         ↓

   ┌─────────┐
   │    z    │
   │   30    │
   └─────────┘
```

---

## Lists

```python
numbers = [10, 20, 30]
```

Generic collection visualization:

```text
numbers
   │
   ▼
┌────┬────┬────┐
│ 10 │ 20 │ 30 │
└────┴────┴────┘
```

---

## References

```python
a = [1, 2]
b = a
```

Visualization:

```text
a ─────┐
       ▼
     [1, 2]
       ▲
b ─────┘
```

This is a critical part of understanding Python.

---

## Objects

```python
user = User("Alice")
```

Should automatically expose:

```text
User
────────────
name = Alice
age = ...
methods
...
```

---

# 12. IDE Direction

ProViz should feel like a real IDE rather than a problem-solving page.

Target workspace:

```text
┌─────────────────────────────────────────────────────────────┐
│ ProViz   main.py   ▶ Run   ⏸   Step   1x                   │
├──────────────┬──────────────────────────────┬───────────────┤
│ FILES        │ CODE EDITOR                  │ INSPECTOR     │
│              │                              │               │
│ main.py      │ def fibonacci(n):            │ Variables     │
│ utils.py     │     if n <= 1:               │ n = 5         │
│              │         return n              │ result = 5   │
│              │                              │               │
│              │                              │ Call Stack    │
│              │                              │ fibonacci()   │
├──────────────┴──────────────────────────────┴───────────────┤
│                                                             │
│                       3D WORLD                               │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ Step 42 — fibonacci(2) called                               │
│ "The function calls itself with n = 2."                    │
├─────────────────────────────────────────────────────────────┤
│ ◀ ◀   ▶   ▶ ▶       ━━━━━━━━━●━━━━━━━━━━━━━━              │
└─────────────────────────────────────────────────────────────┘
```

---

# 13. IDE Capabilities

The long-term IDE should support:

### Editor

- CodeMirror 6
- Python syntax highlighting
- multiple files
- tabs
- file tree
- autocomplete where practical
- diagnostics
- active execution line
- line numbers
- code folding

### Debugging

- Run
- Pause
- Restart
- Step Into
- Step Over
- Step Out
- Continue
- Breakpoints
- Conditional breakpoints
- Temporary breakpoints
- Exception breakpoints

### Runtime inspection

- Variables
- Call stack
- Object inspector
- Heap/object graph
- Watches
- References
- Current source location

### Visualization

- 3D world
- camera controls
- focus selected object
- object highlighting
- relationship/reference lines
- transitions and mutations
- visualization modes

### Explanation

- current event
- human-readable explanation
- event badges
- source-line context
- variable-change explanations

---

# 14. Inspector

The inspector is a first-class part of the product.

For an object:

```text
OBJECT INSPECTOR

Person
──────────────────

Type
Person

Object ID
#0x17A3

Attributes
name
"Alice"

age
25

Methods
__init__
greet
```

For a list:

```text
LIST

Length: 5

[0] 10
[1] 20
[2] 30
[3] 40
[4] 50
```

For a function:

```text
FUNCTION

Name
calculate

Arguments
x = 10
y = 20

Local Variables
result = 30
```

Selecting an object in 3D should update the inspector, and selecting it in the inspector should focus the 3D object.

---

# 15. Playback Engine

Playback must remain independent from execution.

Architecture:

```text
Execution Engine
       ↓
Immutable Trace
       ↓
Playback Engine
       ↓
Current Runtime State
       ↓
Visualization + Inspector + Explanation
```

The execution engine should finish producing the trace independently from animation timing.

The visualization engine should never control the Python runtime.

---

# 16. Explanation Engine

The Explanation Engine should consume semantic trace events.

Example:

```js
{
  type: "assignment",
  target: "total",
  previous: 10,
  value: 15
}
```

Explanation:

> `total` changed from `10` to `15`.

Function call:

```js
{
  type: "call",
  function: "calculate",
  arguments: {
    x: 5
  }
}
```

Explanation:

> `calculate()` was called with `x = 5`.

Reference:

```js
{
  type: "reference",
  source: "b",
  target: "list_17"
}
```

Explanation:

> `b` now refers to the same list as `a`.

The explanation engine should not depend on a specific visualizer.

---

# 17. Language Adapter Architecture

Python is the first implementation.

Future languages should use adapters:

```text
LanguageAdapter
├── initialize()
├── execute()
├── pause()
├── resume()
├── getTrace()
├── getDiagnostics()
└── getLanguageFeatures()
```

Future structure:

```text
execution/
├── ExecutionEngine.js
├── LanguageAdapter.js
│
├── python/
│   ├── PythonAdapter.js
│   ├── PyodideRuntime.js
│   ├── PythonTracer.js
│   └── PythonSerializer.js
│
├── javascript/
│   └── ...
│
├── cpp/
│   └── ...
│
└── java/
    └── ...
```

The universal trace should be the contract between language-specific execution and language-independent visualization.

---

# 18. Proposed Directory Structure

```text
src/
│
├── app/
│   ├── App.js
│   ├── Workspace.js
│   └── Layout.js
│
├── editor/
│   ├── CodeEditor.js
│   ├── FileManager.js
│   ├── Breakpoints.js
│   └── Diagnostics.js
│
├── execution/
│   ├── ExecutionEngine.js
│   ├── LanguageAdapter.js
│   └── python/
│       ├── PythonAdapter.js
│       ├── PyodideRuntime.js
│       ├── PythonTracer.js
│       └── PythonSerializer.js
│
├── trace/
│   ├── Trace.js
│   ├── TraceEvent.js
│   ├── RuntimeState.js
│   ├── Heap.js
│   ├── CallFrame.js
│   └── Checkpoint.js
│
├── playback/
│   ├── PlaybackEngine.js
│   ├── Timeline.js
│   └── StateReconstructor.js
│
├── visualization/
│   ├── SceneManager.js
│   ├── SceneGraph.js
│   ├── ObjectRegistry.js
│   ├── CameraController.js
│   │
│   ├── generic/
│   │   ├── PrimitiveVisualizer.js
│   │   ├── ObjectVisualizer.js
│   │   ├── CollectionVisualizer.js
│   │   └── ReferenceVisualizer.js
│   │
│   └── specialized/
│       ├── ArrayVisualizer.js
│       ├── TreeVisualizer.js
│       ├── GraphVisualizer.js
│       └── CallStackVisualizer.js
│
├── explanation/
│   ├── ExplanationEngine.js
│   ├── EventExplainer.js
│   └── ExplanationTemplates.js
│
├── inspector/
│   ├── Inspector.js
│   ├── ObjectInspector.js
│   └── RuntimeInspector.js
│
├── problems/
│   ├── registry.js
│   └── ...
│
└── services/
    ├── firebase.js
    └── sanity.js
```

The exact filenames can evolve. The **separation of responsibilities** is the important part.

---

# 19. Educational Layer

The DSA problem system should become a consumer of ProViz rather than the definition of ProViz.

```text
                         ProViz Core
                             │
             ┌───────────────┼────────────────┐
             │               │                │
        Python IDE     Visual Debugger    3D Runtime
             │               │                │
             └───────────────┼────────────────┘
                             │
                     Educational Layer
                             │
              ┌──────────────┼──────────────┐
              │              │              │
             DSA          Python         Courses
           Problems       Lessons
```

Problems can provide:

- starter code
- expected output
- hints
- solution code
- specialized visualization preferences
- learning objectives

But ProViz Core must work without them.

---

# 20. Roadmap

## Phase 1 — Universal Python Execution

Goal:

> Any normal Python program can execute and produce a useful universal trace.

Support:

- primitives
- variables
- functions
- calls
- recursion
- lists
- tuples
- dictionaries
- sets
- classes
- objects
- references
- loops
- conditionals
- exceptions

Pipeline:

```text
CodeMirror
    ↓
Pyodide
    ↓
Python Tracer
    ↓
Universal Trace
    ↓
Playback
    ↓
Generic 3D Visualization
```

---

## Phase 2 — Real Debugger

Add:

- breakpoints
- step into
- step over
- step out
- continue
- call stack
- variable watches
- object inspector
- exception inspection
- better diagnostics

---

## Phase 3 — Rich Visualization

Add:

- arrays
- matrices
- trees
- graphs
- linked lists
- heaps
- pointer/reference visualization
- advanced recursion visualization
- memory/heap view

---

## Phase 4 — Educational Platform

Bring back and expand:

- DSA problem catalog
- starter code
- solution code
- guided visualizations
- learning paths
- hints
- quizzes
- explanation modes

---

## Phase 5 — Multi-Language

Add additional language adapters.

Potential order:

```text
Python
  ↓
JavaScript
  ↓
C++
  ↓
Java
  ↓
Rust / others
```

The order is not fixed. The universal trace contract must be designed so language additions do not require rewriting the visualization engine.

---

# 21. Definition of "Universal"

"Any code can be visualized" does **not** mean every possible runtime behavior must have a perfect custom 3D visualization.

The minimum universal guarantee is:

> Any supported language program that successfully executes should produce a meaningful generic representation of its execution state.

Specialized visualizations can then improve particular structures.

For example:

```text
Any object
    ↓
Generic Object View

Any list
    ↓
Generic Collection View

Tree-like data
    ↓
Optional Tree View

Graph-like data
    ↓
Optional Graph View
```

This distinction prevents the architecture from becoming impossible to maintain.

---

# 22. Important Technical Constraints

## Browser-first

The system should continue to prioritize client-side execution where practical.

Python:

```text
Pyodide + WebAssembly
```

No backend execution should be required for the basic workflow.

---

## Security

"Arbitrary Python code" means arbitrary code within the browser sandbox.

The architecture must not assume that Python execution is inherently safe.

Avoid exposing privileged browser APIs or application secrets to executed user code.

---

## Performance

Arbitrary code can produce:

- millions of trace events
- large objects
- deep recursion
- infinite loops
- huge collections

Therefore the runtime needs:

- execution limits
- trace limits
- cancellation
- memory safeguards
- lazy inspection
- checkpoints
- event compression where safe
- virtualization for large collections

---

# 23. Product Invariants

These should remain true as the project grows.

### Invariant 1

**Execution does not depend on visualization.**

### Invariant 2

**Visualization does not depend on DSA problems.**

### Invariant 3

**The trace model is language-neutral at the conceptual level.**

### Invariant 4

**Generic visualization always exists before specialized visualization.**

### Invariant 5

**Problem-specific configuration is optional.**

### Invariant 6

**Playback operates on trace/state, not directly on the language runtime.**

### Invariant 7

**Three.js is a renderer, not the source of truth for program state.**

### Invariant 8

**Object identity and references must be preserved.**

### Invariant 9

**The user should be able to inspect the same state through multiple views.**

### Invariant 10

**New languages should require a new adapter, not a rewrite of the core visualization system.**

---

# 24. Anti-Patterns to Avoid

## Do not build this:

```text
Python code
 ↓
ArrayVisualizer
 ↓
3D
```

This only works for DSA.

---

## Do not put Python knowledge into Three.js objects

Bad:

```js
mesh.pythonVariable = ...
```

Prefer a dedicated runtime/state model.

---

## Do not make the trace format visualization-specific

Bad:

```js
{
  createBlueCube: true
}
```

Good:

```js
{
  type: "object_created",
  objectId: "obj_17",
  objectType: "Person"
}
```

---

## Do not create separate runtime models for every visualizer

There should be one authoritative runtime state.

---

## Do not make the problem registry part of execution

A Python program should run whether or not it belongs to a catalog problem.

---

## Do not optimize only for toy DSA examples

The architecture should work for:

```python
class BankAccount:
    ...
```

as well as:

```python
for i in range(100):
    ...
```

and:

```python
graph = {...}
```

---

# 25. Canonical Mental Model

When making architectural decisions, think:

```text
                    USER
                     │
                     ▼
                 PROVIZ IDE
                     │
          ┌──────────┼──────────┐
          │          │          │
       Editor     Inspector   3D World
          │          │          │
          └──────────┼──────────┘
                     │
                Playback State
                     │
                 Trace Model
                     │
              Language Adapter
                     │
                 Runtime
```

The trace is the central contract.

The runtime produces it.

The playback engine consumes it.

The inspector reads it.

The explanation engine reads it.

The visualization engine reads it.

---

# 26. The One-Sentence Product Definition

> **ProViz is a browser-based visual programming environment that turns real program execution into an interactive, inspectable 3D world.**

---

# 27. Immediate Engineering Priority

Before adding more DSA visualizers, prioritize the abstraction work:

1. Define the universal trace/event schema.
2. Separate Python execution from visualization.
3. Introduce a canonical `RuntimeState`.
4. Introduce object identity + reference tracking.
5. Make `PlaybackEngine` consume the universal trace.
6. Build a generic scene graph.
7. Build generic primitive/object/collection visualizers.
8. Build the inspector around runtime state.
9. Make the current Array/Stack visualizers specialized plugins.
10. Only then expand the DSA visualization library.

The goal is not to throw away the current system.

The goal is to **move the current system down one layer** so that today's DSA visualizers become specialized capabilities of a much more general platform.

---

# 28. Final Direction

The project should evolve through this transformation:

```text
CURRENT

DSA Problem
    ↓
Python Execution
    ↓
DSA Trace
    ↓
DSA Visualization


TARGET

Any Supported Code
    ↓
Language Runtime
    ↓
Universal Execution Trace
    ↓
Runtime State
    ↓
Generic Visualization Scene
    ↓
3D World
    ↓
Optional Specialized Views
    ↓
Educational Experiences
```

**ProViz Core = execution + trace + state + playback + visualization.**

**ProViz Education = problems + lessons + DSA + guided experiences.**

Keep those two layers separate.
