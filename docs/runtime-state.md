# ProViz Runtime State, Object Identity & Heap Graph Specification

> **Version:** 1.0 (Stage 2)  
> **Status:** Canonical Runtime State Contract  

---

## 1. Overview & Core Philosophy

Stage 2 establishes the **truth layer** of ProViz: program execution is captured and structured as real runtime state, rather than flattened strings.

The runtime state model guarantees:
- **Object Identity**: Python objects maintain stable IDs (`obj_1`, `obj_2`, ...) throughout an execution session.
- **Reference Preservation**: Aliases and nested references point to shared heap nodes instead of duplicated values.
- **Mutation Tracking**: Mutations to a heap object (e.g. `list.append()`, `dict[k] = v`, `p.name = 'Bob'`) are immediately reflected across all referencing aliases.
- **Safety & Bounded Serialization**: Cyclic structures, deep graphs, and large collections are safely bounded without risk of infinite recursion.

---

## 2. Structured Value Model

Every value in the runtime environment belongs to one of three structured kinds:

```typescript
type Value = PrimitiveValue | ReferenceValue | OpaqueValue;

interface PrimitiveValue {
  kind: 'primitive';
  type: 'int' | 'float' | 'bool' | 'str' | 'NoneType';
  value: number | boolean | string | null;
}

interface ReferenceValue {
  kind: 'reference';
  type: 'list' | 'dict' | 'set' | 'tuple' | 'instance' | string;
  objectId: string; // e.g. "obj_1"
}

interface OpaqueValue {
  kind: 'opaque';
  type: string;
  reason: string; // e.g. "limit_exceeded" | "opaque_type"
}
```

### Examples

#### Primitive Assignment (`x = 42`)
```json
{
  "kind": "primitive",
  "type": "int",
  "value": 42
}
```

#### Object Reference (`a = [1, 2]`)
```json
{
  "kind": "reference",
  "type": "list",
  "objectId": "obj_1"
}
```

---

## 3. Heap Model & Object Identity

Heap nodes are stored in a centralized `Heap` registry keyed by stable ProViz identifier (`obj_N`). Python memory addresses (`id(v)`) are mapped to `obj_N` upon first observation.

### Heap Object Types

| Type | Data Container | Example Python Code |
|---|---|---|
| `list` | `elements: Value[]` | `[1, 2, 3]` |
| `tuple` | `elements: Value[]` | `(1, 2, 3)` |
| `set` | `elements: Value[]` | `{1, 2, 3}` |
| `dict` | `entries: Array<{ key: Value, value: Value }>` | `{'name': 'Alice', 'age': 25}` |
| `instance` | `fields: Record<string, Value>` | `person = Person('Alice')` |

### Heap Node JSON Schema
```json
{
  "obj_1": {
    "id": "obj_1",
    "type": "list",
    "className": "list",
    "elements": [
      { "kind": "primitive", "type": "int", "value": 1 },
      { "kind": "primitive", "type": "int", "value": 2 }
    ]
  }
}
```

---

## 4. Reference Graph & Alias Mutation

When multiple variables reference the same mutable object, they share the same `objectId`.

### Execution Example:
```python
a = [1, 2]
b = a
b.append(3)
```

### Runtime State Representation:
```text
Local Scope:
  a ──────────────┐
                  ▼
  b ───────────► List #obj_1
                 elements: [1, 2, 3]
```

When `b.append(3)` executes:
1. `obj_1` in `Heap` receives the appended element `3`.
2. Both `a` and `b` retain `objectId: "obj_1"`.
3. Reading `a` or `b` yields `[1, 2, 3]`.

---

## 5. Scope & Call Frame Model

Execution state maintains a stack of active `CallFrame` instances:

```typescript
interface CallFrame {
  frameId: string;        // e.g. "frame_1"
  functionName: string;   // e.g. "factorial" or "<module>"
  source: {
    file: string;
    line: number | null;
  };
  scope: Scope;           // Local variable bindings { [varName]: Value }
  depth: number;          // Stack depth (1-indexed)
}
```

- **Function Calls (`call`)**: Pushes a new `CallFrame` with initial argument bindings.
- **Function Returns (`return`)**: Pops the active `CallFrame`, discarding local scope while preserving global state and the return value.
- **Recursion**: Recursive calls create distinct `CallFrame` objects with independent local bindings.

---

## 6. Cyclic References & Defensive Safety

The Python tracer detects cycles during traversal using an in-flight `visited` set:

```python
a = []
a.append(a)
```

1. Serializing `a` registers `obj_1` and adds `id(a)` to the visited set.
2. When traversing `a[0]`, `id(a)` is detected in `visited`.
3. Traversal emits `{ kind: "reference", type: "list", objectId: "obj_1" }` without re-entering `a`.
4. Stringification and traversal algorithms safely handle cyclic edges without stack overflow.

### Traversal Safeguards:
- `MAX_DEPTH = 8`: Limits maximum nested object recursion.
- `MAX_ITEMS = 64`: Limits maximum collection elements inspected.
- `MAX_STR_LEN = 120`: Bounds large string literals.

---

## 7. Compatibility Layer (`LegacyFrameAdapter`)

Existing 3D visualizers (`VariableVisualizer`, `ArrayVisualizer`, `CallStackVisualizer`) consume legacy string snapshots.

`LegacyFrameAdapter` bridges the Runtime State to existing visualizers by resolving structured values against the heap via `stringifyValue(value, heap)`:
```text
Structured Runtime State  ──►  LegacyFrameAdapter  ──►  VisualizationFrame.variables  ──►  Existing 3D Visualizers
 (UET + Heap Graph)            (resolves references)      (string representations)
```

This ensures 100% backward compatibility while establishing the canonical runtime state foundation for Stage 3+.

---

## 8. Roadmap & Future Use

- **Stage 3**: Timeline Indexing, State Snapshot Checkpoints, and Deterministic Time Travel.
- **Stage 4 & 5**: Universal Scene Graph & Generic Memory/Collection Visualizers.
- **Stage 6**: Interactive Runtime State & Heap Graph Inspector UI.
