# Universal Dataflow Analysis & Program Dependency Graph (PDG) Architecture

## 1. Overview & Motivation

ProViz Stage 12 introduces the **Universal Dataflow Analysis & Program Dependency Graph (PDG)** layer.

### The Fundamental Separation of Concerns:
- **`RuntimeState`**: Answers **WHAT** exists at the current moment (authoritative runtime truth).
- **`Debugger`**: Answers **WHERE** execution currently is along the global timeline.
- **`ExpressionEngine`**: Answers **WHAT** an inspection query evaluates to at an exact state.
- **`DataflowEngine` / PDG**: Answers **WHY** a runtime value has its current state, **WHERE** it originated from, which statements produced it, and **WHAT** downstream variables, objects, or expressions depend on it.

```
PROGRAM WORKSPACE
        ↓
MODULE GRAPH
        ↓
LANGUAGE EXECUTOR
        ↓
UNIVERSAL EXECUTION TRACE
        ↓
GLOBAL TIMELINE
        ↓
STATE RECONSTRUCTOR
        ↓
RUNTIME STATE
        │
        ├───────────────┬─────────────────┐
        ↓               ↓                 ↓
    DEBUGGER      OBJECT INSPECTOR   EXPRESSION ENGINE
        │               │                 │
        └───────────────┴────────┬────────┘
                                 ↓
                         DATAFLOW ENGINE
                                 ↓
                    PROGRAM DEPENDENCY GRAPH
                                 ↓
                         DATAFLOW QUERIES
                                 │
                 ┌───────────────┼────────────────┐
                 ↓               ↓                ↓
             WATCHES         DEBUGGER          INSPECTOR
                 │               │                │
                 └───────────────┴────────────────┘
                                 ↓
                            SCENE GRAPH
                                 ↓
                              LAYOUT
                                 ↓
                            TRANSITION
                                 ↓
                            ANIMATION
                                 ↓
                             RENDERER
```

---

## 2. Canonical Node Model (`DataflowNode`)

`DataflowNode` represents discrete semantic entities in the dependency graph:

| Node Type | Description | Example ID |
|---|---|---|
| `VARIABLE` | Named binding in a scope | `df_var_2_local_main_py_x` |
| `OBJECT` | Canonical heap object node | `df_obj_obj_1_f3` |
| `EXPRESSION` | Evaluated expression intermediate | `df_expr_1_fnv1a` |
| `OBJECT_FIELD` | Field on instance/dict | `df_field_obj_1_name_f2` |
| `COLLECTION_ELEMENT` | Indexed element of list/tuple | `df_elem_obj_1_0_f2` |
| `PARAMETER` | Function formal parameter | `df_param_2_main_py_calc_x` |
| `RETURN_VALUE` | Function return value | `df_ret_3_main_py_calc` |
| `STATEMENT` | Executed statement/mutation point | `df_mut_node_obj_1_append_f4` |

**Deterministic Node IDs:** Node IDs are generated deterministically using frame indices, scope identifiers, clean file slugs, and variable/object names without random numbers or wall-clock timestamps.

---

## 3. Explicit Semantic Edge Model (`DataflowEdge`)

Edges capture exact directional relationships between nodes:

- `DATA_DEPENDS_ON`: Direct computational or assignment dependency ($a = b + c \implies a \to b, a \to c$).
- `DEFINES`: Binds or creates a new variable/field/element definition.
- `USES`: Reads a value from an active definition.
- `ALIASES`: Indicates a variable reference points to a canonical `Heap` object ($a = [] \implies a \xrightarrow{\text{ALIASES}} \text{obj\_1}$).
- `MUTATES`: In-place semantic alteration of heap object state.
- `WRITES`: Field or element write ($obj.f = x$).
- `READS`: Field or element read.
- `CONTROL_DEPENDS_ON`: Control flow condition governing execution.
- `PASSES_ARGUMENT` / `RECEIVES_PARAMETER`: Inter-procedural argument flow.
- `RETURNS` / `RECEIVES_RETURN`: Return value flow back to caller.

---

## 4. Definitions & Uses Semantics

- **`Definition`**: A semantic point in time where a value is bound. Variable rebinding (e.g. `count = 1` then `count = 2`) creates distinct historical `Definition` records while retaining variable identity.
- **`Use`**: A semantic point in time where an existing binding is read as an operand in an expression or statement.

---

## 5. Alias & Mutation Analysis

- **`AliasSet`**: Tracks all variables and reference pathways referencing the same heap object across frames. Reconstructed from authoritative `RuntimeState` snapshots.
- **`MutationRecord`**: Captures in-place mutations (`append`, `insert`, `replace`, `field_write`, `dict_write`, `set_add`, etc.) along with mutated index/field, previous value, next value, and originating source line.

---

## 6. High-Level Dataflow Queries (`DataflowQueries`)

The `DataflowQueries` engine provides instant, deterministic answers:

### 1. "Where did this value come from?" (`findOrigins`)
Traces backward along incoming `DATA_DEPENDS_ON` edges through assignment chains, function calls, and expressions back to root literals and inputs:
```javascript
const origins = debugger.getOrigins('total');
// Returns: { target: 'total', currentValue: 100, origins: [...], path: [...] }
```

### 2. "What depends on this value?" (`findDependents`)
Traces forward along outgoing dependency edges to identify all variables and expressions affected by the target.

### 3. "What is the impact of this object?" (`findImpact`)
Computes the transitive impact set for a heap object:
- All active aliases (`a`, `b`)
- All applied mutations across the timeline
- All downstream dependents and affected source lines

### 4. "Why did this watch expression change?" (`explainWatchChange`)
Compares watch values between frames and returns the exact definitions and mutations responsible for the change:
```javascript
const explanation = debugger.explainWatchChange('user.name', 0, 5);
```

### 5. Shortest Data Path (`findDataPath`)
Finds the semantic data path from producer to consumer with cycle prevention.

---

## 7. Historical State & Navigation Independence

Dataflow queries describe the program deterministically at any historical frame index. The results are strictly identical whether jumping directly to frame 50 or stepping forward and backward through the trace:

$$\text{jumpTo}(50) \implies \text{query}(x) \equiv \text{step}(0 \to 100 \to 50) \implies \text{query}(x)$$

---

## 8. Multi-File & Cross-Module Dataflow

Dataflow analysis tracks dependencies crossing module boundaries (`main.py` calling `utils.py` and `models.py`) while preserving the canonical identity of shared heap objects (`obj_1`).

---

## 9. Safe Bounded Traversal & Cyclic Objects

Cyclic references (e.g. `a = []; a.append(a)`) are bounded using `visited` tracking sets and configurable depth/node limits (`maxDepth=16`, `maxNodes=64`, `timeoutMs=200`).

---

## 10. Performance Benchmarks

Benchmarked on large-scale dependency graphs:

| Benchmark Scenario | Count | Execution Time | Target Limit |
|---|---|---|---|
| Graph Construction | 1,000 Nodes & Edges | ~5.2 ms | < 200 ms |
| Batch Queries | 10,000 Lookups | ~2.0 ms | < 300 ms |
| Path Search (BFS) | Graph Depth 32 | ~0.09 ms | < 20 ms |

---

## 11. Distinguishing Types of Truth in ProViz

1. **Runtime Truth**: The exact state stored in `RuntimeState` / `Heap` at frame $N$.
2. **Dynamic Trace Evidence**: Concrete dataflow events, definitions, uses, and mutations observed during execution.
3. **Static Source Information**: AST structure and token identifiers extracted by language adapters.

ProViz Stage 12 builds dynamic runtime dataflow evidence and does not claim static compiler-grade whole-program SSA/CFG guarantees for unexecuted code paths.
