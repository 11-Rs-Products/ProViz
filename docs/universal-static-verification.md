# Stage 15 — Universal Static Verification, Bug Detection & Program Property Analysis Engine

## Overview
The **Universal Static Verification, Bug Detection & Program Property Analysis Engine** builds upon ProViz's foundational analysis stack (CFG, Dominators, SSA, Static Dataflow, Dynamic Dataflow/PDG, Program Slicing, and Type/Value-Flow) to verify program properties, detect defects, infer invariants, check contracts, and provide explainable evidence chains.

---

## 1. Architectural Position

```
SOURCE WORKSPACE
      ↓
MODULE GRAPH
      ↓
LANGUAGE EXECUTOR
      ↓
UNIVERSAL EXECUTION TRACE
      ↓
RUNTIME STATE / HEAP
      ↓
┌──────────────────────────────────────────────┐
│ STATIC ANALYSIS                              │
│                                              │
│ CFG (Stage 13)                               │
│ ↓                                            │
│ DOMINATORS / CONTROL DEPENDENCIES (Stage 13)  │
│ ↓                                            │
│ SSA (Stage 13)                               │
│ ↓                                            │
│ STATIC DATAFLOW (Stage 13)                   │
│ ↓                                            │
│ PROGRAM DEPENDENCY GRAPH (Stage 12)          │
│ ↓                                            │
│ PROGRAM SLICING (Stage 13)                   │
│ ↓                                            │
│ TYPE / VALUE FLOW (Stage 14)                 │
│ ↓                                            │
│ ABSTRACT VALUES / CONSTANTS / SHAPES (14)    │
│ ↓                                            │
│ PROPERTY / VERIFICATION ANALYSIS (Stage 15)  │
└──────────────────────────────────────────────┘
      ↓
PROPERTY GRAPH / FINDINGS
      ↓
EXPLANATION ENGINE
      ↓
┌──────────────────────────────────────────────┐
│ DEBUGGER                                     │
│ WATCHES                                      │
│ OBJECT INSPECTOR                             │
│ SOURCE EDITOR                                │
│ DATAFLOW / TYPEFLOW / SLICING                │
│ SCENE GRAPH / VISUALIZATION                  │
└──────────────────────────────────────────────┘
```

---

## 2. Core Concepts & Models

### Property & Proof Lattice
* **`Property`**: Represents verifiable assertions (e.g. `NON_NULL(x)`, `VALUE_IN_RANGE(x, [0, 100])`, `DIVISOR_NON_ZERO(y)`).
* **`PropertyState`**: Four-state proof lattice:
  * `PROVEN`: Guaranteed true across all statically feasible paths.
  * `DISPROVEN`: Guaranteed false under analyzed preconditions.
  * `POSSIBLE`: May occur on at least one feasible abstract path.
  * `UNKNOWN`: Insufficient evidence to establish proof or refutation.

### Range Interpretation
* **`RangeValue`**: Interval arithmetic supporting:
  * Integers & floats (`[min, max]`)
  * `+Infinity` and `-Infinity`
  * Add, subtract, multiply, divide, modulo, power, absolute value, min, max
  * Lattice `union`, `intersect`, and `widen` (for loop fixed points).

### Path Conditions & State
* **`PathCondition`**: Predicate governing branch execution (e.g., `x is not None`, `x > 0`).
* **`PathState`**: Immutable abstract execution state tracking accumulated branch conditions, refined ranges, and reachability.
* **`PathExplorer`**: Bounded path exploration preventing exponential explosion via `maxPaths`, `maxDepth`, and `timeoutMs`.

---

## 3. Finding Categories

* **Null Safety**: `DEFINITE_NONE_ACCESS`, `POSSIBLE_NONE_ACCESS`.
* **Division Safety**: `DEFINITE_DIVISION_BY_ZERO`, `POSSIBLE_DIVISION_BY_ZERO`.
* **Index & Bounds Safety**: `DEFINITE_INDEX_OUT_OF_BOUNDS`, `POSSIBLE_INDEX_OUT_OF_BOUNDS`, `DEFINITE_INVALID_INDEX_TYPE`.
* **Attribute & Shape Safety**: `DEFINITE_ATTRIBUTE_ERROR`, `POSSIBLE_ATTRIBUTE_ERROR`, `UNSUPPORTED_DYNAMIC_BEHAVIOR`.
* **Type Compatibility**: `DEFINITE_TYPE_MISMATCH`, `POSSIBLE_TYPE_MISMATCH`.
* **Control Flow & Reachability**: `UNREACHABLE_CODE`, `UNREACHABLE_BRANCH`, `CONSTANT_CONDITION`, `POSSIBLE_INFINITE_LOOP`.
* **Call Safety**: `DEFINITE_CALL_ARGUMENT_MISMATCH`, `POSSIBLE_CALL_ARGUMENT_MISMATCH`.
* **Mutation & Aliasing**: `ALIASING_RISK`, `UNSAFE_MUTATION`.

---

## 4. Invariants & Contracts

* **`Invariant`**: Inferred loop and function invariants (e.g. `x >= 0`, `val is not None`).
* **`Contract`**: Function preconditions, postconditions, and invariants verified against abstract states without executing user code.

---

## 5. Verification Graph & Explanations

* **`VerificationGraph`**: Directed graph connecting `FINDING`, `PROPERTY`, `CFG_NODE`, `SSA_VALUE`, `SOURCE_LOCATION`, and `RUNTIME_FRAME` nodes via `CAUSED_BY`, `OBSERVED_AT`, `DEFINES`, `USES`, and `FLOWS_TO` edges.
* **`VerificationExplanation`**: Structured explanation detailing summary, severity, evidence list, responsible definitions, and control flow paths.
* **`VerificationSnapshot`**: Immutable, frozen representation with deterministic serialization round-trip support.

---

## 6. Debugger & Watch Integration

The `Debugger` exposes Stage 15 verification APIs:
* `getFindings()`, `getFinding(id)`
* `getFindingsAtFrame(frameIndex)`, `getFindingsAtLocation(loc)`
* `getVerificationSnapshot()`
* `explainFinding(id)`
* `getFindingSlice(id)`
* `getProperties(target)`, `getProperty(target, kind)`
* `getWatchFindings(watchId)`, `explainWatchSafety(watchId)`

---

## 7. Benchmarks & Invariants

* **Performance Verified**:
  * 1,000-statement verification: **~49 ms** (< 1,000 ms target).
  * 10,000 verification queries: **~58 ms** (< 500 ms target).
* **Non-Executing**: Static analysis never invokes `eval()`, `exec()`, or dynamic side effects.
* **Conservative**: Reports `UNKNOWN` or `UNSUPPORTED_DYNAMIC_BEHAVIOR` when static reflection or opaque dynamism is encountered.
