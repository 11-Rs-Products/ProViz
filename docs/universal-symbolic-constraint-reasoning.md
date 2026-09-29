# Universal Symbolic Constraint, Path Reasoning & Proof Engine (Stage 16)

## 1. Architectural Position & Overview

Stage 16 establishes the next level of deterministic formal reasoning in ProViz: moving from conservative static properties (Stage 15) to path-sensitive, symbolic condition analysis.

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
      │
      ├──────────────────────────────────────────────┐
      │                                              │
      ↓                                              ↓
STATIC ANALYSIS                              DYNAMIC OBSERVATION
      │                                              │
      ↓                                              ↓
CFG                                      StateReconstructor
      ↓                                              │
DOMINATORS                                           │
      ↓                                              │
SSA                                                  │
      ↓                                              │
STATIC DATAFLOW                                      │
      ↓                                              │
PDG / SLICING                                        │
      ↓                                              │
TYPE / VALUE FLOW                                    │
      ↓                                              │
VERIFICATION                                          │
      ↓                                              │
PROPERTY ANALYSIS                                    │
      ↓                                              │
SYMBOLIC CONSTRAINT ENGINE ←─────────────────────────┘
      ↓
SYMBOLIC PATHS
      ↓
PROOFS / COUNTEREXAMPLES
      ↓
EXPLANATION GRAPH
      ↓
DEBUGGER / WATCHES / INSPECTOR / IDE / VISUALIZATION
```

Stage 16 answers:
> *"Under exactly which symbolic conditions is a property true, false, reachable, unreachable, safe, or unsafe?"*

---

## 2. Core Invariants & Evidence Separation

- **Runtime Authority:** `RuntimeState` remains the single source of concrete runtime execution truth.
- **Static Authority:** `CFG`, `SSA`, `DataflowGraph`, `TypeSnapshot`, and `VerificationSnapshot` are immutable upstream reasoning layers.
- **Evidence Classes:**
  - `STATIC_PROOF`
  - `STATIC_INFERENCE`
  - `SYMBOLIC_PROOF`
  - `SYMBOLIC_COUNTEREXAMPLE`
  - `DYNAMIC_OBSERVATION`
  - `HEURISTIC`
  - `UNKNOWN`
- **Strict Conservatism:** The status `PROVEN` is returned only when sufficient deductive evidence exists. Failure to prove a property does not imply it is false (`UNKNOWN` is preserved).
- **Immutability & Non-Execution:** The symbolic engine never invokes `eval()`, executes arbitrary code, mutates `RuntimeState`, or modifies historical snapshots.

---

## 3. Package Structure (`src/symbolic/`)

- `Symbol.js` / `SymbolKind.js`: Deterministic symbolic identity model with origins and metadata.
- `SymbolicValue.js`: Container wrapping symbolic expressions and abstract value bounds.
- `SymbolicExpression.js` / `ExpressionKind.js`: Structural AST-like expressions with canonicalization.
- `SymbolicConstant.js`, `SymbolicVariable.js`, `SymbolicOperation.js`, `SymbolicFunction.js`: Concrete expression node specializations.
- `Constraint.js` / `ConstraintKind.js` / `ConstraintRelation.js`: Atomic symbolic predicates with negations and relation flipping.
- `ConstraintNormalizer.js` / `ConstraintSimplifier.js`: Canonical sorting and redundancy elimination.
- `ConstraintSet.js`: Immutable collection of constraints with contradiction detection.
- `BooleanFormula.js` / `FormulaNormalizer.js` / `FormulaSimplifier.js`: Propositional formulas with canonical reductions.
- `SymbolicEnvironment.js`: Scoped immutable environment mapping variables/SSA IDs to expressions.
- `SymbolicState.js` / `SymbolicStateJoin.js`: Encapsulation of path constraints, environment, and `ITE` joins.
- `PathPredicate.js` / `SymbolicPath.js` / `SymbolicPathGraph.js`: Bounded CFG path exploration.
- `PathConditionBuilder.js`: Translation of CFG condition nodes into symbolic predicates.
- `SymbolicExecutor.js` / `SymbolicTransfer.js`: Bounded symbolic interpreter with depth, path, and timeout controls.
- `ConstraintSolver.js` / `LinearConstraintSolver.js` / `ConstraintResult.js`: Interval bound tightening, equality propagation, and implication testing.
- `Proof.js` / `ProofKind.js` / `ProofStep.js`: Deductive proof trees referencing upstream analysis artifacts.
- `Counterexample.js` / `CounterexampleStep.js`: Abstract counterexample assignments and execution traces.
- `SymbolicProperty.js` / `SymbolicVerification.js`: Refinement of Stage 15 findings into `PROVEN`, `FEASIBLE`, `UNREACHABLE`, or `UNKNOWN`.
- `SymbolicExplanation.js`: Formatter generating structured explanations.
- `SymbolicAnalyzer.js` / `SymbolicEngine.js`: Top-level analysis orchestrator.
- `SymbolicQueries.js`: Unified query API for UI, debugger, and inspector.
- `SymbolicSnapshot.js`: Immutable frozen snapshot with deterministic byte-for-byte serialization.
- `LanguageSymbolicAdapter.js` / `PythonSymbolicAdapter.js`: Language-specific symbolic semantics.

---

## 4. Symbol Model & Deterministic Identities

A `Symbol` represents an unknown or abstract value:
- `id`: Stable hash derived from name, kind, origin, and SSA ID (e.g. `sym_x_a1b2c3d4`).
- `name`: Identifier string.
- `kind`: `INPUT`, `PARAMETER`, `UNKNOWN`, `RETURN_VALUE`, `FIELD`, `ELEMENT`, `GLOBAL`, `TEMPORARY`, `RANGE_VARIABLE`, `LOOP_VARIABLE`.
- `sourceLocation`: Optional source code mapping.
- `origin`: Node or SSA definition responsible for the symbol.

---

## 5. Symbolic Expression Model & Canonicalization

`SymbolicExpression` supports AST constructions with mathematical and logical canonical reductions:
- `x + 0` $\rightarrow$ `x`
- `0 + x` $\rightarrow$ `x`
- `x - 0` $\rightarrow$ `x`
- `x - x` $\rightarrow$ `0`
- `x * 0` $\rightarrow$ `0`
- `x * 1` $\rightarrow$ `x`
- `not(not(x))` $\rightarrow$ `x`
- `c1 op c2` $\rightarrow$ `folded_constant`

Canonicalization avoids unsound rewrites on floating point numbers or dynamic Python types.

---

## 6. Constraints & Solvers

### Constraint Representation
- Relations: `==`, `!=`, `<`, `<=`, `>`, `>=`, `is`, `is not`, `in`, `not in`.
- Normalized ordering: constant operands are canonically placed on the right-hand side (`5 < x` $\rightarrow$ `x > 5`).

### LinearConstraintSolver
- **Interval Bounds:** Tightens lower and upper bounds across integer/numeric variables. Detects contradictions such as $\{ x \ge 10, x \le 5 \}$.
- **Equality Propagation:** Maintains equivalence classes using union-find logic.
- **Disequalities:** Tracks explicit inequalities to detect conflicts such as $\{ x == 5, x \ne 5 \}$.
- **Satisfiability & Implication:** Evaluates `implies(Premises, Conclusion)` by checking if $SAT(Premises \land \neg Conclusion) = UNSAT$.

---

## 7. Symbolic Execution & Path Feasibility

- `SymbolicExecutor` traverses CFGs starting from `entryNodeId`.
- At branch points (`TRUE_BRANCH` / `FALSE_BRANCH`), `PathConditionBuilder` derives active constraints.
- Infeasible paths (where the accumulated `ConstraintSet` is `UNSAT`) are marked `isFeasible = false` and pruned from candidate execution states.
- Resource budgets:
  - `maxPaths = 32`
  - `maxDepth = 50`
  - `timeoutMs = 500`

---

## 8. Refinement of Stage 15 Findings

Stage 16 ingests Stage 15 diagnostics (`POSSIBLE_DIVISION_BY_ZERO`, `POSSIBLE_NONE_ACCESS`, `INDEX_OUT_OF_BOUNDS`, etc.) and performs targeted symbolic refinement:

1. **Safety Condition:** e.g., $y \ne 0$ for division.
2. **Unsafe Condition:** e.g., $y == 0$.
3. **Solver Query:**
   - If unsafe condition is contradictory along all reachable paths $\rightarrow$ finding is marked `UNREACHABLE` or `PROVEN_SAFE`.
   - If unsafe condition is satisfiable along a feasible path $\rightarrow$ finding is marked `FEASIBLE` and a `Counterexample` is constructed.
   - Otherwise $\rightarrow$ preserved as `UNKNOWN` / `POSSIBLE`.

---

## 9. Debugger, Watch & Inspection Integration

The `Debugger` exposes Stage 16 symbolic queries:
- `getSymbolicPaths()` / `getSymbolicPath(pathId)`
- `getFeasibleSymbolicPaths()` / `getInfeasibleSymbolicPaths()`
- `getSymbolicProofs()` / `getSymbolicProof(propertyId)`
- `getSymbolicCounterexamples()` / `getSymbolicCounterexample(findingId)`
- `getRefinedFinding(findingId)`
- `getWatchConstraints(watchId)`
- `explainWatchConstraint(watchId)`

---

## 10. Performance & Determinism Benchmarks

- **Analysis Throughput:** 1,000-statement CFG analyzed in under 50ms (target: < 2,000ms).
- **Query Latency:** 10,000 symbolic constraint queries executed in < 1ms (target: < 500ms).
- **Deterministic Serialization:** Identical inputs produce byte-for-byte identical `SymbolicSnapshot` JSON.
