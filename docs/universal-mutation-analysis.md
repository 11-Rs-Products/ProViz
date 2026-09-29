# Universal Mutation Analysis, Test Adequacy & Behavioral Robustness Engine (Stage 20)

## 1. Motivation
Stage 19 enabled automated fix synthesis and patch validation. However, a passing test suite does not necessarily guarantee that tests are sensitive to semantic regressions.

Stage 20 introduces **Universal Mutation Analysis, Test Adequacy & Behavioral Robustness Analysis**. By systematically creating controlled semantic perturbations (mutants) and evaluating whether existing test suites, static verifiers, or concolic engines detect them, ProViz measures the empirical adequacy of tests and automatically synthesizes new targeted test inputs to kill surviving mutants.

---

## 2. Architecture & Lifecycle

```
                         SOURCE WORKSPACE
                               │
                               ▼
                        EXECUTION ENGINE
                               │
                               ▼
                              UET
                               │
               ┌───────────────┴────────────────┐
               ▼                                ▼
         RUNTIME STATE                    STATIC ANALYSIS
               │                                │
               │                    ┌───────────┼───────────┐
               │                    ▼           ▼           ▼
               │                  CFG/SSA    DATAFLOW    TYPEFLOW
               │                    │           │           │
               │                    └───────────┼───────────┘
               │                                ▼
               │                          VERIFICATION
               │                                │
               │                                ▼
               │                           SYMBOLIC
               │                                │
               ▼                                ▼
            TESTING                         CONCOLIC
               │                                │
               └───────────────┬────────────────┘
                               ▼
                          TEST EVIDENCE
                               │
                               ▼
                       PROGRAM REPAIR
                               │
                               ▼
                        VALIDATED PATCH
                               │
                               ▼
                      MUTATION ANALYSIS
                               │
                 ┌─────────────┼─────────────┐
                 ▼             ▼             ▼
            MUTATION       EXECUTION      SYMBOLIC
            GENERATOR         │           DIFFERENCE
                 │             │             │
                 └─────────────┼─────────────┘
                               ▼
                      MUTATION CLASSIFIER
                               │
             ┌─────────────────┼─────────────────┐
             ▼                 ▼                 ▼
           KILLED            SURVIVED         EQUIVALENT
             │                 │                 │
             ▼                 ▼                 ▼
       TEST ADEQUACY      TEST GENERATION    PROOF EVIDENCE
                               │
                               ▼
                          CONCOLIC KILL
                               │
                               ▼
                        ROBUST TEST SUITE
                               │
                               ▼
                      DEBUGGER / VISUALIZER
```

### Formal Lifecycle
```
Workspace
   ↓
Mutation Sites
   ↓
Mutation Candidates
   ↓
Mutant Workspace
   ↓
Static Analysis
   ↓
Regression Tests
   ↓
Differential Observation
   ↓
Killed / Survived / Equivalent / Unknown
   ↓
Survivor Analysis
   ↓
Symbolic Difference
   ↓
Concolic Test Generation
   ↓
Differential Execution
   ↓
Final Classification
```

---

## 3. Mutation Model
- `MutationOperator`: Represents a specific operator (`ARITHMETIC`, `RELATIONAL`, `BOOLEAN`, `CONSTANT`, `CONDITIONAL`, `LOOP`, `COLLECTION`, `INDEX`, `RETURN`, `COMPARISON`, `NEGATION`, `BOUNDARY`, `EXCEPTION`).
- `MutationCandidate`: Immutable representation of a single code perturbation containing canonical IDs, target location, operator ID, and a Stage 19 `PatchSet`.
- `MutationStatus`: `GENERATED`, `EXECUTED`, `KILLED`, `SURVIVED`, `EQUIVALENT`, `UNKNOWN`, `UNSUPPORTED`, `TIMEOUT`, `INVALID`.

---

## 4. Mutation Operators
- **Arithmetic**: `+` ↔ `-`, `*` ↔ `/`.
- **Relational**: `<` ↔ `<=`, `>` ↔ `>=`, `==` ↔ `!=`.
- **Boolean**: `and` ↔ `or`, `not P` ↔ `P`.
- **Constant**: `0` ↔ `1`, `True` ↔ `False`, `None` ↔ `0`.
- **Conditional**: `if P:` ↔ `if not (P):`.
- **Boundary**: `< len(xs)` ↔ `<= len(xs)`.
- **Return**: `return <expr>` ↔ `return None` / `return 0`.

---

## 5. Language Adapters
- `LanguageMutationAdapter`: Language-neutral interface defining mutation site enumeration, transformation, and validation.
- `PythonMutationAdapter`: Python AST-aware adapter synthesizing exact structural replacement patches.

---

## 6. Mutation Generation & Filtering
- `MutationSiteAnalyzer`: Scans source code and CFG to locate valid mutation points.
- `MutationFilter`: Rejects duplicate signatures, syntactically invalid patches, and out-of-scope categories.
- `MutationGenerator`: Deterministically coordinates generation with stable sorting.

---

## 7. Mutant Workspaces
- `MutantWorkspace`: Wraps the original and mutated `WorkspaceSnapshot`.
- Guarantees strict immutability: active workspaces are never modified.

---

## 8. Differential Execution & Oracles
- `DifferentialExecutor`: Runs identical inputs against original and mutated code in isolated environments.
- `MutationOracle`: Defines detection policies across `EXCEPTION`, `RETURN_VALUE`, `OUTPUT`, `ASSERTION`, `WATCH_VALUE`, `PATH`, `BRANCH`, `STATE`, `CONTRACT`, `FINDING`, and `COVERAGE`.
- `MutationComparator`: Produces structured behavioral deltas (`BehavioralDelta`).

---

## 9. Mutant Classification & Equivalence
- `MutationClassifier`: Classifies mutants into `KILLED`, `SURVIVED`, `EQUIVALENT`, `UNKNOWN`, `UNSUPPORTED`, or `TIMEOUT`.
- `EquivalenceAnalyzer`: Employs symbolic and type reasoning to prove identity equivalence (e.g. `x + 0` ↔ `x - 0`, `x * 1` ↔ `x / 1`).

---

## 10. Test Adequacy & Coverage Correlation
- `MutationScore`: Computes raw mutation score (`killed / total`) and effective mutation score (`killed / (total - equivalent)`).
- `MutationMatrix`: Bi-directional queryable matrix mapping test cases to killed and surviving mutants.
- Correlates with Stage 17 coverage to identify covered-yet-surviving mutants.

---

## 11. Mutation-Guided Test Generation & Concolic Killing
- `DifferentialSymbolicAnalyzer`: Derives symbolic constraints where original and mutant behaviors diverge.
- `MutationTestGenerator`: Synthesizes Stage 17 `TestCase` instances targeting surviving mutants.
- `MutationConcolicEngine`: Re-executes generated tests concolically to kill survivors and strengthen the test suite.

---

## 12. Repair Integration (Stage 19)
- `RepairMutationValidator`: Evaluates Stage 19 repairs by perturbing code surrounding the fix and ensuring the regression suite detects the perturbations.

---

## 13. Historical Reproducibility & Determinism
- All mutation IDs and results are deterministically hashed from canonical workspace versions and operator signatures.
- Campaigns execute against immutable `WorkspaceSnapshot` instances.

---

## 14. Debugger Integration APIs
Integrated in `src/debugger/Debugger.js`:
- `startMutationCampaign(request)`
- `pauseMutationCampaign()`
- `continueMutationCampaign()`
- `stopMutationCampaign()`
- `getMutationCampaign()`
- `getMutationStatus()`
- `getMutants()`
- `getMutationResult(mutantId)`
- `getMutationScore()`
- `getMutationMatrix()`
- `getSurvivingMutants()`
- `getEquivalentMutants()`
- `getMutationCoverage()`
- `explainMutation(mutantId)`
- `generateTestForMutant(mutantId)`
- `killMutant(mutantId)`
- `validateMutantEquivalence(mutantId)`
- `getMutationSnapshot()`
- `getMutationArtifact()`
- `mutationWatch(watchId, mutantId)`

---

## 15. Performance Targets
- **1,000 Mutation Generations:** ~15 ms (Target: < 100 ms)
- **1,000 Matrix Lookups:** ~1 ms (Target: < 100 ms)
- **100 Differential Executions:** Fast in-memory simulation.

---

## 16. Known Limitations
- General semantic equivalence is undecidable; only known algebraic and structural equivalences are proven.
- Multi-statement complex mutation requires higher search depth configuration.
