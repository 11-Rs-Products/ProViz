# Universal Counterexample-Guided Test Generation & Dynamic Validation Engine (Stage 17)

## 1. Architectural Position & Overview

Stage 17 bridges formal symbolic analysis (Stage 16) and concrete dynamic execution (Stages 1–3). It transforms abstract counterexamples, path constraints, and verification findings into concrete, executable test inputs, executes them in isolated runtime sandboxes, and validates whether the predicted behaviors actually occur.

```
                         SOURCE WORKSPACE
                                │
                                ↓
                         MODULE GRAPH
                                │
                                ↓
                        LANGUAGE EXECUTOR
                                │
                                ↓
                     UNIVERSAL EXECUTION TRACE
                                │
                                ↓
                         RUNTIME STATE
                                │
          ┌─────────────────────┴─────────────────────┐
          │                                           │
          ↓                                           ↓
    STATIC ANALYSIS                            DYNAMIC OBSERVATION
          │                                           │
          ↓                                           ↓
         CFG                                  StateReconstructor
          ↓                                           │
         SSA                                           │
          ↓                                           │
      DATAFLOW                                          │
          ↓                                           │
      TYPEFLOW                                          │
          ↓                                           │
    VERIFICATION                                        │
          ↓                                           │
      SYMBOLIC                                          │
          ↓                                           │
   PROOF / COUNTEREXAMPLE                               │
          │                                             │
          └──────────────────┬──────────────────────────┘
                             ↓
                 CONSTRAINT CONCRETIZATION
                             ↓
                    TEST INPUT GENERATION
                             ↓
                       TEST CASE
                             ↓
                    EXISTING EXECUTOR
                             ↓
                         UET TRACE
                             ↓
                      OBSERVATION
                             ↓
                  PREDICTION COMPARISON
                             ↓
                ┌────────────┴─────────────┐
                ↓                          ↓
          VALIDATED TEST             MODEL MISMATCH
                │                          │
                ↓                          ↓
           COVERAGE                    DIAGNOSTIC
                │
                ↓
         TEST MINIMIZATION
                │
                ↓
          REGRESSION TEST
                │
                ↓
        DEBUGGER / IDE / UI
```

---

## 2. Core Invariants & Evidence Discipline

- **Runtime Authority:** `RuntimeState` is the sole source of concrete execution truth. Generated tests become evidence only after dynamic observation.
- **Derived Analysis:** Static and symbolic models (`CFG`, `SSA`, `Dataflow`, `TypeFlow`, `Verification`, `Symbolic`) remain immutable upstream sources.
- **Prediction vs Observation:** Every test outcome distinguishes:
  - `PREDICTED`: Expected outcome derived from static/symbolic reasoning.
  - `OBSERVED`: Actual behavior recorded in the Universal Execution Trace.
  - `VALIDATED`: Prediction matches observation.
  - `MISMATCHED`: Prediction diverges from observation.
  - `INCONCLUSIVE`: Incomplete execution or unconstructable inputs.
- **Execution Isolation:** Each test execution uses a fresh runtime state and heap without mutating the user workspace.

---

## 3. Package Structure (`src/testing/`)

- `TestInput.js` / `TestInputKind.js`: Immutable input descriptors (function arguments, module inputs, environment variables).
- `TestValue.js` / `TestValueGenerator.js`: Safe representation and deterministic synthesis of concrete test values (primitives, boundaries, collections).
- `TestCase.js` / `TestCaseStatus.js`: Immutable test specification tying inputs to target objectives and expectations.
- `TestTarget.js` / `TestTargetKind.js` / `TestObjective.js`: Classification of test goals (findings, counterexamples, paths, branches).
- `TestExpectation.js` / `TestObservation.js`: Specification of predicted behavior vs observed runtime trace/exceptions.
- `ConstraintAssignment.js` / `ConstraintConcretizer.js` / `AssignmentValidator.js`: Solves symbolic constraints into concrete variable bindings.
- `PathTestGenerator.js` / `FindingTestGenerator.js` / `CounterexampleGenerator.js`: Specialized generators targeting paths, bugs, and counterexamples.
- `TestDeduplicator.js` / `TestMinimizer.js`: Removes redundant test cases and shrinks input values while preserving target conditions.
- `Coverage.js` / `CoverageTarget.js` / `CoverageAnalyzer.js`: Dynamic line, node, edge, and branch coverage metrics.
- `PredictionComparator.js` / `TestValidator.js` / `TestResult.js`: Formal comparison between prediction and observation.
- `TestSuite.js` / `TestSuiteBuilder.js`: Aggregate suite management with deduplication and metrics.
- `TestExplanation.js`: Human- and machine-readable explanations of test generation and validation.
- `TestSnapshot.js`: Immutable snapshot with deterministic byte-for-byte serialization.
- `LanguageTestingAdapter.js` / `PythonTestingAdapter.js`: Language-specific harness creation and trace observation extraction.
- `TestExecutor.js`: Isolated test execution engine.
- `TestingEngine.js` / `TestingAnalyzer.js`: Top-level orchestrator.
- `TestingQueries.js`: Read-only query interface for UI, Debugger, and Watches.

---

## 4. Constraint Concretization & Value Generation

### A. Numeric Intervals & Boundaries
- Uses `LinearConstraintSolver` interval tightening and disequality elimination.
- Generates boundary candidates ($C-1, C, C+1$) or zero-favored values ($0, 1, -1$) deterministically.
- E.g., $\{ x \ge 5, x \le 10, x \ne 5 \} \to x = 6$.

### B. Collections & Shapes
- Uses Stage 14 `CollectionShape` and Stage 15 range constraints:
  - $\text{len}(xs) == 0 \to []$
  - $\text{len}(xs) > 0 \to [0]$
  - $\text{key} \in d \to \{ \text{"key"}: 0 \}$

### C. Nullability
- $x \text{ is None} \to \text{None}$
- $x \text{ is not None} \to \text{non-null value (e.g. 1)}$

---

## 5. Finding- & Counterexample-Directed Test Generation

Stage 17 converts Stage 15/16 diagnostics directly into reproducible tests:
1. **Division by Zero:**
   - Property: $y \ne 0 \to$ Counterexample: $y = 0 \to$ Test: $x = 10, y = 0 \to$ Expected: `ZeroDivisionError`.
2. **None Access / Null Pointer:**
   - Property: $obj \ne \text{None} \to$ Counterexample: $obj = \text{None} \to$ Test: $obj = \text{None} \to$ Expected: `TypeError`.
3. **Index Out of Bounds:**
   - Target index $i \ge \text{len}(xs) \to$ Test: $xs = [0], i = 1 \to$ Expected: `IndexError`.

---

## 6. Dynamic Validation & Prediction Comparison

After executing a test in an isolated harness:
- `TestObservation` captures trace events, runtime exceptions, return values, and line/branch coverage.
- `PredictionComparator` compares:
  - Expected exception vs observed exception.
  - Expected path vs observed CFG sequence.
  - Expected return value vs observed output.
- `TestValidator` produces a `TestResult` marked `PASS`, `FAIL`, or `MISMATCH`.

---

## 7. Deduplication, Minimization & Coverage

- **Deduplication:** Hashes canonical input bindings and target identifiers to prune duplicate tests.
- **Minimization:** Reduces integer magnitudes ($100 \to 1$), string lengths, and collection sizes while preserving target satisfiability.
- **Coverage Guidance:** Combines dynamic line/branch coverage with Stage 16 symbolic reachability to identify feasible but uncovered execution paths.

---

## 8. Debugger, Watch & Inspector Integration

The `Debugger` exposes Stage 17 testing capabilities:
- `generateTestForFinding(findingId)` / `generateTestsForFinding(findingId)`
- `generateTestForPath(pathId)` / `generateTestsForBranch(nodeId)`
- `generateTestForCounterexample(counterexampleId)`
- `executeGeneratedTest(testId)` / `validateGeneratedTest(testId)`
- `getTestCase(testId)` / `getTestResult(testId)` / `getTestSuite(suiteId)`
- `getCoverage()` / `getCoverageTargets()` / `getUncoveredTargets()`
- `minimizeTest(testId)`
- `getGeneratedTestArtifact(testId)`
- `getTestExplanation(testId)`
- `getTestingSnapshot()`
- `generateTestForWatch(watchId)` / `validateWatchPrediction(watchId, testId)`
- `generateTestForObjectConstraint(objectId)`

---

## 9. Performance & Determinism Benchmarks

- **1,000 TestCase Generations:** ~8ms (Target: < 1,000ms).
- **10,000 Constraint Concretizations:** ~46ms (Target: < 500ms).
- **1,000 Test Deduplications:** < 1ms (Target: < 100ms).
- **Deterministic Serialization:** Byte-for-byte identical across repeated runs.
