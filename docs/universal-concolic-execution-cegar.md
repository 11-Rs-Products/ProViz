# Universal Concolic Execution, Path Refinement & CEGAR Engine (Stage 18)

## 1. Motivation
Stage 17 established the first complete bridge from static reasoning to concrete test execution. However, static symbolic execution alone struggles with complex dynamic features, incomplete path conditions, and environment-dependent logic. Pure dynamic execution only explores a single path at a time.

Stage 18 unifies concrete execution and symbolic analysis into a **Universal Concolic Execution and Counterexample-Guided Abstraction Refinement (CEGAR) Engine**. By collecting exact path constraints from concrete execution, systematically inverting branch conditions, solving for new inputs, and comparing predicted paths against actual runtime traces, ProViz achieves automated path exploration, bug confirmation, and model refinement with mathematical determinism.

---

## 2. Architecture & Lifecycle

```
                    ┌──────────────────────────────┐
                    │       SOURCE WORKSPACE       │
                    └──────────────┬───────────────┘
                                   ↓
                           Language Executor
                                   ↓
                                  UET
                                   ↓
                            RuntimeState
                                   ↓
                 ┌─────────────────┴─────────────────┐
                 ↓                                   ↓
          Static Analysis                    Concrete Execution
                 ↓                                   ↓
      CFG / SSA / Dataflow /               Observed Path
      TypeFlow / Verification                    ↓
      Symbolic Constraints                 Path Extraction
                 ↓                                   │
                 └──────────────┬────────────────────┘
                                ↓
                       Concolic State
                                ↓
                    Branch / Path Selection
                                ↓
                     Constraint Negation
                                ↓
                       Constraint Solver
                                ↓
                       Concrete Assignment
                                ↓
                         Generated Test
                                ↓
                      Real Execution Again
                                ↓
                  Prediction / Observation
                                ↓
                       Model Refinement
                                ↓
                     Exploration Graph
                                ↓
                Coverage / Findings / Tests
```

### Formal Lifecycle
```
Concrete Input
    ↓
Concrete Execution
    ↓
Observed Path
    ↓
Symbolic Path Condition
    ↓
Select Branch
    ↓
Negate Predicate
    ↓
Solve
    ↓
Concrete Assignment
    ↓
Execute
    ↓
Compare
    ↓
Reproduce / Diverge
    ↓
Refine
    ↓
Explore Next Candidate
```

---

## 3. Concrete / Symbolic Relationship
- `RuntimeState` is the authoritative concrete source of truth.
- `SymbolicState` represents abstract path conditions, constraints, and reasoning.
- `ConcolicState` captures the bridge between concrete runtime observations and symbolic expressions.
- The symbolic model only *predicts* program behavior; the runtime environment *verifies* what actually happens.

---

## 4. Path Extraction
`PathExtractor` maps Universal Execution Traces (UET) to:
- Executed CFG nodes and edges.
- Concrete branch decisions (`TRUE`, `FALSE`, `UNKNOWN`, `EXCEPTION`).
- Symbolic branch predicates (`PathConstraint`).
- Multi-frame call stack transitions and loop iterations.

---

## 5. Branch Negation
`BranchNegator` inverts an executed branch predicate:
- Given branch predicate $P$ and prior path constraints $C_1 \land C_2 \land \dots \land C_{n-1}$, it forms $C_1 \land \dots \land C_{n-1} \land \neg P$.
- Handles relational comparisons (`>`, `<`, `>=`, `<=`), equality/disequality (`==`, `!=`), identity (`is`, `is not`), and boolean expressions.

---

## 6. Constraint Solving
`PathConstraintSolver` delegates to Stage 16's `LinearConstraintSolver` and interval arithmetic systems:
- Produces `SAT`, `UNSAT`, `UNKNOWN`, or `TIMEOUT`.
- If `SAT`, generates model variable assignments.

---

## 7. Candidate Generation
`PathCandidateGenerator` selects which branch to negate based on configurable strategies:
- **DFS (Depth-First):** Explores deeper branches along the current path first.
- **BFS (Breadth-First):** Explores shallow branches first.
- **Coverage-Driven:** Prioritizes branches leading to unvisited CFG nodes or edges.
- **Finding-Driven:** Prioritizes branches along paths relevant to verification findings.

---

## 8. Concrete Execution
Solver assignments are mapped to Stage 17 `TestCase` objects via `ConcreteAssignmentBuilder` and validated by `AssignmentValidator`. They are executed by Stage 17's `TestExecutor` in an isolated sandbox.

---

## 9. Divergence Detection
`PathComparator` compares predicted candidate branches against observed execution paths:
- Identifies divergence causes: `CONTROL_FLOW_MISMATCH`, `CONSTRAINT_MISMATCH`, `TYPE_MISMATCH`, `HEAP_MISMATCH`, `UNMODELED_OPERATION`, or `EXCEPTION_MISMATCH`.

---

## 10. Model Refinement
When dynamic execution diverges from symbolic prediction:
- `ModelRefinement` documents the discrepancy without mutating static analysis.
- `RefinementConstraint` records empirically justified constraints local to the exploration session.

---

## 11. Exploration Strategies
Exploration strategies are deterministic:
- `DFS`
- `BFS`
- `COVERAGE`
- `FINDINGS`
- `TARGET`

Candidate evaluation order is strictly defined by target relevance, novelty, path depth, and canonical IDs.

---

## 12. Loops
- Loop headers identified via Stage 13 CFG.
- Iterations bounded by `maxLoopIterations`.
- When iteration limit is reached, reported as `LOOP_BOUND_REACHED` rather than infinite expansion.

---

## 13. Recursion
- Call frames tracked via `ConcolicFrame`.
- Recursion depth bounded by `maxPathDepth`.

---

## 14. Exceptions
- Exceptions are first-class execution outcomes and exploration targets.
- Branch decisions can record `BranchDecision.EXCEPTION`.
- Correlates with Stage 15 findings (e.g., `ZeroDivisionError`, `IndexError`, `AttributeError`).

---

## 15. Coverage Tracking
`ConcolicCoverage` records:
- Source lines, CFG nodes, CFG edges, branches, and functions covered.
- Per-iteration delta (`coverage_before`, `coverage_after`, `coverage_delta`).

---

## 16. Finding Reproduction
`FindingPathPlanner`:
- Locates candidate paths leading to Stage 15 findings.
- Generates inputs to dynamically reproduce and confirm static verification warnings.

---

## 17. Counterexample Refinement
`CounterexampleRefiner`:
- Takes Stage 16 counterexamples and tests them dynamically.
- Classifies into `CONFIRMED`, `MODEL_MISMATCH`, or `REJECTED`.

---

## 18. Historical Reproducibility
Explorations operate over immutable `WorkspaceSnapshot` snapshots:
- Byte-for-byte deterministic serialization via `ConcolicSnapshot` and `ExplorationArtifact`.
- Independent of subsequent live workspace edits.

---

## 19. Resource Limits
Configured via `ExplorationRequest`:
- `maxPaths`: Maximum paths explored.
- `maxDepth`: Maximum execution step depth.
- `maxLoopIterations`: Maximum loop unrolling.
- `maxExplorations`: Maximum solver/execution iterations.
- `timeoutMs`: Global exploration timeout.

---

## 20. Unsupported Semantics
Unsupported dynamic features produce explicit `UNKNOWN` or `UNSUPPORTED` status rather than fabricating symbolic behavior.

---

## 21. Determinism
- No randomized exploration in standard mode.
- Deterministic candidate ordering and tie-breaking.
- Immutable data structures ensure identical inputs yield identical outputs.

---

## 22. Security Boundaries
- Strictly zero dynamic `eval()`, `exec()`, or sub-shell spawning.
- All tests execute strictly through the configured ProViz execution sandbox.

---

## 23. APIs
Integrated in `src/debugger/Debugger.js`:
- `startConcolicExploration(request)`
- `stepConcolicExploration()`
- `getConcolicState()`
- `getExplorationSession()`
- `getExplorationResult()`
- `getExplorationGraph()`
- `getExploredPaths()`
- `getUnexploredBranches()`
- `getPathCandidates()`
- `getPathConstraints(pathId)`
- `getBranchPredicates(pathId)`
- `getPathDivergences()`
- `getRefinements()`
- `getConcolicCoverage()`
- `getConcolicStatistics()`
- `refineCounterexample(counterexampleId)`
- `exploreFinding(findingId)`
- `exploreWatch(watchId)`
- `exploreObjectConstraint(objectId, constraint)`
- `getExplorationArtifact()`

---

## 24. Performance Targets
- **1,000 Branch Negations:** ~2 ms (Target: < 50 ms)
- **1,000 Candidate Solves:** ~1 ms (Target: < 100 ms)
- **1,000 Graph Insertions:** ~1 ms (Target: < 100 ms)

---

## 25. Known Limitations
- Unbounded loops and deep recursion require manual threshold configuration.
- Complex third-party native C extensions are modeled conservatively.
