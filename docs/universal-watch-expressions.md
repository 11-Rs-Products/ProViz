# Universal Watch Expressions & Interactive Runtime Inspection Architecture

## 1. Overview & Architecture

ProViz Stage 11 introduces **Universal Watch Expressions and Interactive Runtime Inspection**, enabling users and developers to query live and historical program state deterministically, safely, and without side effects.

### Core Architectural Separation

```
                         DEBUGGER (Orchestrator)
                            │
            ┌───────────────┼────────────────┐
            ↓               ↓                ↓
        Breakpoints     Watch Manager    Object Inspector
                            │
                            ↓
                    Expression Engine
                            │
                            ↓
                    RuntimeState_N
                            │
              ┌─────────────┴─────────────┐
              ↓                           ↓
          Scope Lookup                Heap Lookup
              │                           │
              └─────────────┬─────────────┘
                            ↓
                    Evaluation Result
```

### Invariants:
1. **`RuntimeState` = Authoritative Source of Truth:** Reconstructed deterministically by `StateReconstructor`.
2. **`ExpressionEvaluator` = Read-Only Query Layer:** Queries heap and scope structures without mutating runtime state.
3. **`WatchManager` = Persistent Query Registry:** Stores expression definitions, activation state, and history.
4. **`Debugger` = Orchestration Authority:** Coordinates stepping, execution context, object inspection, and watch updates.
5. **Language Agnostic Core:** Language syntax is decoupled via language expression adapters producing normalized ASTs.

---

## 2. Canonical Expression Abstraction

An `Expression` represents a normalized, deterministic query over runtime state.

```javascript
import { Expression } from './src/inspection/Expression.js';

const expr = new Expression('user.profile.name', 'python');
console.log(expr.id);         // "expr_user_profile_name_..."
console.log(expr.normalized); // "user.profile.name"
```

- **Deterministic Identity:** Expression IDs (`id`) are generated deterministically using slugification and 32-bit FNV-1a hashing. Random IDs are prohibited.
- **Normalization:** Collapses whitespace and trims formatting differences to ensure equivalence (`a [ 0 ]` normalized to `a[0]`).
- **Serialization:** Full JSON round-trip support via `.toJSON()` and `Expression.fromJSON()`.

---

## 3. Parser & Normalized AST

The `ExpressionParser` uses a pure recursive-descent tokenization and parsing model. It parses expressions into language-neutral AST nodes without using JavaScript's native `eval()`.

### Supported AST Node Types:
- `Identifier`: Variable, parameter, or module name (`x`, `data`).
- `MemberAccess`: Attribute access (`user.name`, `account.balance`).
- `IndexAccess`: Collection indexing or dictionary key access (`items[0]`, `data["key"]`).
- `Literal`: Primitives including integers, floats, strings, booleans, and `None` (`42`, `"admin"`, `True`, `None`).
- `BinaryOp`: Safe arithmetic and string concatenation (`+`, `-`, `*`, `/`, `//`, `%`).
- `UnaryOp`: Unary negation and boolean inversion (`-`, `+`, `not`).
- `Comparison`: Structural equality and relational operators (`==`, `!=`, `<`, `<=`, `>`, `>=`).
- `Identity`: Reference identity verification (`a is b`, `a is not b`).
- `Call`: Safe pure intrinsics (`len(x)`, `type(x)`). Prohibits arbitrary function execution.
- `ListLiteral` / `DictLiteral`: In-memory list or dictionary query literals.

---

## 4. EvaluationContext

`EvaluationContext` encapsulates the scope hierarchy and limits for evaluating an expression against a specific frame or runtime state:

```javascript
import { EvaluationContext } from './src/inspection/EvaluationContext.js';

// Construct from RuntimeState or DebuggerState
const ctx = EvaluationContext.fromRuntimeState(runtimeState, {
    frameIndex: 12,
    fileId: 'main.py',
    moduleId: 'main',
    limits: { timeoutMs: 500, maxDepth: 16 }
});
```

### Scope Resolution Hierarchy:
1. Active Call Frame Local Scope (`callFrame.scope.bindings`)
2. Enclosing Call Frames (stack frames from bottom to top)
3. Module Global Scope (`runtimeState.globals.bindings`)
4. Module Names / Built-ins (safe inspection constants)

---

## 5. EvaluationResult & EvaluationError

Evaluation produces structured result envelopes without throwing unhandled exceptions into the UI:

```javascript
{
    status: "success", // "success" | "error" | "timeout" | "depth_limit" | "size_limit" | "unsupported"
    value: { kind: "primitive", type: "int", value: 42 },
    valueType: "int",
    objectId: null,
    display: "42",
    duration: 0.12,
    error: null,
    metadata: { frameIndex: 12, fileId: "main.py" }
}
```

### Structured Error Codes:
- `UNKNOWN_IDENTIFIER`: Variable or symbol not found in scope hierarchy.
- `ATTRIBUTE_NOT_FOUND`: Attribute or field does not exist on object.
- `INDEX_OUT_OF_RANGE`: List index out of bounds.
- `INVALID_INDEX`: Key not present in dictionary or invalid index type.
- `UNSUPPORTED_OPERATION`: Prohibited operations (e.g. user function calls, mutations).
- `TYPE_ERROR`: Incompatible operands for operator.
- `DEPTH_LIMIT`: Recursion or object graph traversal limit exceeded.
- `SIZE_LIMIT`: Result exceeded item or memory limit.
- `TIMEOUT`: Evaluation exceeded time budget.
- `SYNTAX_ERROR`: Malformed query expression.
- `MODULE_NOT_FOUND`: Target module does not exist in workspace.

---

## 6. Reference Identity & Structural Equality

Stage 11 strictly distinguishes Python reference identity (`is`) from structural equality (`==`):

- **Identity (`a is b`):** Compares canonical `objectId`s from the `Heap` (e.g. `obj_1 === obj_1`). Does not require JavaScript reference equality.
- **Equality (`a == b`):** Traverses collection elements and dictionary entries recursively with cycle detection (`visited` set) to determine content equivalence across distinct heap objects.

---

## 7. Cyclic Structures & Bounded Traversal

Cyclic object graphs (e.g. `a = []; a.append(a)`) are bounded via `Set` cycle detection:
- `stringifyValue` detects cyclic references and renders `[Cyclic #obj_id]`.
- Property traversal terminates when reaching `maxDepth` (default 16).
- Infinite recursion is mathematically prevented.

---

## 8. Pure Read-Only Guarantee

Expression evaluation never modifies:
- `RuntimeState`
- `Heap` / `HeapObject`
- `Scope` / `CallFrame`
- `Timeline` / `Trace`
- `SceneGraph` / `LayoutState`

Expressions such as `items.append(10)` or `del obj.attr` are parsed and rejected with `UNSUPPORTED_OPERATION`.

---

## 9. Persistent Watch Expressions & WatchManager

`WatchManager` manages registered user queries:

```javascript
import { WatchManager } from './src/inspection/WatchManager.js';

const wm = new WatchManager();
const watch = wm.add('user.name');

// Evaluate all enabled watches against current context
const results = wm.evaluateAll(ctx);

// Historical evaluation across timeline frames
const history = wm.evaluateHistory(watch.id, timeline, reconstructor);
```

---

## 10. Historical Evaluation & Time Travel

The debugger can evaluate expressions at arbitrary historical timeline frames without re-executing user code:

```
frameIndex (e.g. Frame 42)
       ↓
StateReconstructor.reconstruct(42)
       ↓
RuntimeState_42
       ↓
EvaluationContext.fromRuntimeState(RuntimeState_42)
       ↓
ExpressionEvaluator.evaluate("items[0]", ctx)
       ↓
EvaluationResult (Deterministic result at Frame 42)
```

---

## 11. Multi-File & Module Scope Resolution

Multi-file workspaces preserve module isolation:
- Expressions evaluated within `utils.py` resolve against `utils` module globals and local call frames.
- Identifiers in `main.py` do not leak into `utils.py` scope contexts.

---

## 12. ObjectInspector Integration

When an expression evaluates to a heap reference (e.g. `user.profile` -> `obj_42`):
- `EvaluationResult.objectId` contains `'obj_42'`.
- The UI / Debugger seamlessly passes `'obj_42'` directly to `ObjectInspector.getObjectDetails('obj_42')` or `ObjectInspector.getObjectTree('obj_42')` for deep heap graph exploration.

---

## 13. InspectionSnapshot & State Diffing

`InspectionSnapshot` captures an immutable record of all watches, values, and location metadata at a given frame:

```javascript
const snap1 = InspectionSnapshot.capture({ watchManager, context, frameIndex: 10 });
const snap2 = InspectionSnapshot.capture({ watchManager, context: ctx2, frameIndex: 20 });

const diff = snap1.diff(snap2);
// Returns: { changed: [{ watchId, expression, fromValue, toValue }], added: [], removed: [] }
```

---

## 14. Performance & Benchmarks

Benchmarked against large scale heap graphs and high expression volumes:

| Benchmark Scenario | Count | Execution Time | Target Limit |
|---|---|---|---|
| Large Heap Construction | 1,000 Objects | ~1.3 ms | < 100 ms |
| Batch Expression Evaluation | 1,000 Expressions | ~1.9 ms | < 150 ms |
| Stress Evaluation Loop | 10,000 Expressions | ~8.1 ms | < 300 ms |
| Deep Graph Traversal (Cycle Protected) | Depth 16 | < 0.05 ms | < 1 ms |

---

## 15. Future Language Adapters

The architecture supports pluggable language adapters (`LanguageExpressionAdapter`):
- Python (Current default)
- JavaScript / TypeScript
- Java / Rust / C++
Each adapter defines tokenization rules, identifier resolution syntax, and native literal mapping while reusing the core `ExpressionEvaluator`, `WatchManager`, and `EvaluationContext`.
