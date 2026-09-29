# Universal Semantic Test Synthesis, Behavioral Oracle & Specification Mining Engine

## 1. Motivation

In modern software development, testing is often reactive and incomplete. Engineers typically write a handful of manual unit tests for "happy paths" and obvious edge cases, leaving complex interactions, implicit invariants, and subtle state transitions untested. When code evolves through repairs, refactorings, or mutations, existing test suites frequently fail to adequately characterize the program's intended behavior.

Stage 22 transitions ProViz from asking:
> **"Which existing tests should run after a change?"** (Stage 21 Regression Intelligence)

to answering:
> **"What behavioral guarantees does this program make, what evidence supports those guarantees, which guarantees remain untested, and what concrete tests should be synthesized to validate or challenge them?"**

By mining behavioral specifications directly from execution traces, dataflow graphs, CFG/SSA representations, type-flow models, verification properties, symbolic paths, and mutation analyses, ProViz synthesizes deterministic, executable tests with explicit behavioral oracles.

---

## 2. Subsystem Architecture

The Stage 22 subsystem is located in `src/specification/` and organized into dedicated, decoupled layers:

```
                      SOURCE / WORKSPACE
                              ↓
                      PROGRAM ANALYSIS
            ┌─────────────────┼─────────────────┐
            ↓                 ↓                 ↓
         Static            Symbolic          Runtime
        Analysis           Analysis         Execution
            │                 │                 │
            └─────────────────┼─────────────────┘
                              ↓
                      ObservationSet
                              ↓
                     SpecificationMiner
      (Invariants, Contracts, Exceptions, Relations, Temporal)
                              ↓
                      BehaviorModel
                              ↓
                     OracleBuilder
                              ↓
                    TestObjectiveGenerator
                              ↓
                    TestSynthesizer
                              ↓
                    SemanticTestSuite
                              ↓
                    SpecificationEngine
                     (Isolated Sandbox)
                              ↓
                    OracleEvaluator
                              ↓
                    AdequacyAnalyzer & GapAnalyzer
                              ↓
                    SpecificationRefiner
```

---

## 3. Universal Specification Model

All specifications derive from `Specification` and are assigned deterministic canonical hashes (`spec_<hash>`):

```typescript
interface Specification {
  id: string;                      // Deterministic hash based on kind, subject, and constraints
  kind: SpecificationKind;         // Taxonomy (e.g. INVARIANT, RETURN_PROPERTY, EXCEPTION_PROPERTY)
  status: SpecificationStatus;     // CANDIDATE, MINED, VALIDATED, VIOLATED, REFINED, INVALIDATED, INCONCLUSIVE
  confidence: SpecificationConfidence; // PROVEN (1.0), HIGH (0.85), MEDIUM (0.6), LOW (0.35), OBSERVED_ONLY (0.2), UNKNOWN (0.0)
  source: SpecificationSource;     // STATIC_ANALYSIS, RUNTIME_OBSERVATION, SYMBOLIC_PROOF, etc.
  subject: { name?: string, functionId?: string, objectId?: string };
  preconditions: string[];
  postconditions: string[];
  observations: string[];
  evidence: string[];
  sourceLocations: SourceLocation[];
  sourceTests: string[];
  derivedFrom?: string;
  metadata: Record<string, any>;
}
```

### Specialized Specification Classes
* `Precondition`: Input constraints and domain requirements.
* `Postcondition`: Output state constraints and return value predicates.
* `Invariant`: Persistent state conditions (e.g. `balance >= 0`, `count is not None`).
* `BehavioralProperty`: General relations between inputs, states, and outputs.
* `StateTransition`: State machine transitions (`fromState -> toState` under guard conditions).
* `TemporalProperty`: Event ordering patterns (`BEFORE`, `EVENTUALLY`, `PERSISTS_UNTIL`).
* `ExceptionProperty`: Conditional exception expectations (e.g. `ZeroDivisionError` when `b == 0`).
* `ReturnProperty`: Exact or conditional return values.
* `MutationProperty`: Object mutations and side effects (`APPEND`, `SET_FIELD`, `REBIND`).
* `CollectionProperty`: Size, non-emptiness, ordering, and element type constraints.
* `RelationalProperty`: Mathematical relations (e.g. `result == a / b` when `b != 0`).

---

## 4. Behavioral Observations & Behavior Models

* **`Observation`**: Captures inputs, return values, exceptions, pre/post states, call stacks, heap mutations, and active watch expressions. Generates deterministic ID (`obs_<hash>`).
* **`ObservationSet`**: Indexed collection separating normal runs from exception runs.
* **`BehaviorSignature`**: Structural representation of execution paths for fast canonical comparisons.
* **`ValueModel`**: Tracks variable domains, types, minimums, maximums, and nullability.
* **`BehaviorModel`**: Comprehensive model aggregating observations, state models, transitions, and value models.

---

## 5. Specification Mining Subsystem

1. **`InvariantMiner`**: Detects range bounds, constant values, and non-null properties across executions.
2. **`ContractMiner`**: Infers parameter-return correlations and return type consistency.
3. **`ExceptionMiner`**: Discovers conditional exception rules and identifies parameter triggers (e.g. $0$, `None`, negative indices).
4. **`RelationMiner`**: Mines algebraic equations and order relationships.
5. **`TemporalMiner`**: Extracts call sequences and ordering constraints.
6. **`SpecificationMiner`**: Coordinates all miners and performs **conflict detection** (`CONFLICTING_OBSERVATIONS`) when identical inputs produce differing outputs.

---

## 6. Behavioral Oracles

Oracles represent executable test assertions:
* `OracleKind`: `RETURN_VALUE`, `RETURN_RELATION`, `EXCEPTION_TYPE`, `EXCEPTION_ABSENCE`, `STATE_PROPERTY`, `PROPERTY`, etc.
* `OracleBuilder`: Translates specifications into the weakest justified executable oracle.
* `OracleEvaluator`: Safely evaluates oracles against test observations returning `PASS`, `FAIL`, `INCONCLUSIVE`, or `UNSUPPORTED`.
* `OracleComparator`: Performs differential evaluation across baseline and changed code to detect behavioral divergence.
* `OracleRefiner`: Updates oracle strengths and evidence when specifications evolve.

---

## 7. Test Objective Generation & Synthesis Loop

```
Discovered Gap / Analysis
        ↓
TestObjectiveGenerator (Boundary, Path, Property, Transition, Mutation, Regression)
        ↓
TestSynthesizer
        ↓
SemanticTestCase (Inputs, Target Function, Attached Oracle, Preconditions, Provenance)
        ↓
TestDeduplicator & TestMinimizer
        ↓
SemanticTestSuite
```

* **Boundary Objectives**: Exercises $0, 1, -1, \text{None}, \text{max}, \text{min}$.
* **Path Objectives**: Targets uncovered CFG branches and symbolic paths.
* **Property Objectives**: Synthesizes inputs to confirm or challenge candidate invariants.
* **Mutation Objectives**: Targets surviving mutants from Stage 20.
* **Regression Objectives**: Targets changed semantic entities from Stage 21.

---

## 8. Adequacy, Coverage & Gap Analysis

* **`SpecificationCoverage`**: Tracks ratio of exercised, validated, violated, and untested specifications.
* **`OracleCoverage`**: Measures pass/fail ratios across test oracles.
* **`BehavioralCoverage`**: Measures exploration of distinct execution regions (`NORMAL`, `BOUNDARY`, `EXCEPTION`).
* **`AdequacyAnalyzer`**: Computes composite adequacy scores.
* **`GapAnalyzer`**: Identifies unvalidated properties, uncovered branches, surviving mutants, and regression gaps.
* **`TestObjectiveGenerator.fromGap(gap)`**: Closes the self-improving test generation loop by converting gaps into concrete test objectives.

---

## 9. Specification Refinement & Counterexamples

* **`SpecificationRefiner`**:
  * Validates candidate specifications when tests succeed.
  * Violates or invalidates specifications when failing observations occur.
  * Weakens conditions when broader valid domains are explored.
* **`CounterexampleRefiner`**:
  * Invalidates incorrect specifications upon receiving symbolic or runtime counterexamples.
  * Automatically synthesizes new test objectives targeting the counterexample region.

---

## 10. Required End-to-End Scenarios

### Scenario 1: Divide Function Mining & Boundary Synthesis
* **Function**:
  ```python
  def divide(a, b):
      if b == 0:
          return 0
      return a / b
  ```
* **Workflow**:
  1. Mined specifications: `b == 0 -> 0`, `result == a / b when b != 0`, no `ZeroDivisionError`.
  2. Boundary objectives generated for $b = 0, 1, -1$.
  3. Tests synthesized with attached return value and relational oracles.
  4. Oracles evaluated and validated.

### Scenario 2: Mutation-Guided Specification Mining
* **Mutant**: `if b != 0: return 0` (inverted zero guard).
* **Workflow**:
  1. Mutant survives standard non-zero tests; identified as `MUTATION_SURVIVOR` gap.
  2. Target objective generated for $b == 0$.
  3. Test synthesized with input $b = 0$.
  4. Original returns $0$ (`PASS`); mutant raises `ZeroDivisionError` (`FAIL`).
  5. Mutant killed; specification validated.

### Scenario 3: Specification Conflict Scenario
* **Observations**: $f(1) \to 2$ and $f(1) \to 3$.
* **Workflow**:
  1. Engine flags `CONFLICTING_OBSERVATIONS`.
  2. Status set to `INCONCLUSIVE` with confidence `UNKNOWN`.
  3. ProViz identifies differing outputs without silently guessing a resolution.

---

## 11. Performance Benchmarks

* **10,000 observations mined**: **< 15 ms** (target: < 200 ms).
* **10,000 oracle evaluations**: **< 5 ms** (target: < 200 ms).
* **1,000 test objectives generated**: **< 10 ms** (target: < 150 ms).
* **1,000 semantic tests synthesized**: **< 20 ms** (target: < 1,000 ms).
* **10,000 specification queries**: **< 2 ms** (target: < 100 ms).

---

## 12. Security & Invariants

* **Sandbox Safety**: All test execution occurs inside controlled Stage 17 `TestExecutor` instances; zero usage of `eval()` or unsanitized dynamic code evaluation.
* **Historical Determinism**: Immutable snapshots (`SpecificationSnapshot`) guarantee byte-for-byte reproducible query results.
* **Provenance Integrity**: Explicit separation between static proofs, runtime observations, symbolic deductions, and heuristic candidates.
