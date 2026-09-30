# ProViz Stage 23 — Universal Property-Based, Metamorphic & Adaptive Behavioral Exploration Engine

## 1. Executive Summary & Core Motivation

In Stage 22, ProViz gained the capability to mine behavioral specifications, construct formal behavioral oracles, generate targeted test objectives, and synthesize individual deterministic tests. However, evaluating programs solely against static, individual synthesized tests leaves fundamental gaps:
1. **Unknown-Unknown Behaviors:** Programs frequently contain subtle edge cases and latent defects that fixed test synthesis heuristics never consider.
2. **Oracle Problem:** For complex functions (e.g., sorting, optimization, graph layout, compilation), exact expected outputs cannot easily be computed a priori without reimplementing the system.
3. **Surviving Mutants & Specification Gaps:** Static tests may cover lines without exerting boundary pressure necessary to distinguish mutants or expose condition contradictions.
4. **Counterexample Bloat:** Raw counterexamples produced by random generation are typically large, noisy, and difficult to comprehend.

**Stage 23** solves these challenges by establishing the **Universal Property-Based, Metamorphic & Adaptive Behavioral Exploration Engine**. ProViz now autonomously generates, mutates, minimizes, clusters, and explores input families using deterministic property generators, metamorphic transformations, boundary-value derivation, grammar synthesis, adaptive novelty feedback, and invariant-preserving counterexample shrinking.

---

## 2. Architecture Overview & Subsystem Boundaries

The exploration engine is situated in `src/exploration/` and cleanly interfaces with every major subsystem across Stages 1–22:

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 Stage 23: Behavioral Exploration Engine                          │
│                                                                                                  │
│   ┌───────────────────────────┐    ┌───────────────────────────┐    ┌─────────────────────────┐  │
│   │   Universal Generators    │    │   Metamorphic Testing     │    │   Adaptive Exploration  │  │
│   │ • Primitives (Int, Str..) │    │ • Relations & Transforms  │    │ • Novelty Detectors     │  │
│   │ • Collections (Arr, Map..)│    │ • Oracles & Evaluators    │    │ • Behavioral Clusters   │  │
│   │ • Grammars & Constraints  │    │ • Relation Mining & Runs  │    │ • Priority Queue Engine │  │
│   └─────────────┬─────────────┘    └─────────────┬─────────────┘    └────────────┬────────────┘  │
│                 │                                │                               │               │
│                 └────────────────────────────────┼───────────────────────────────┘               │
│                                                  ▼                                               │
│                            ┌───────────────────────────────────────────┐                         │
│                            │    Campaign Orchestration & Lifecycle     │                         │
│                            │ • Budgets, Plans, Sessions, Snapshots     │                         │
│                            │ • Multidimensional Exploration Matrix    │                         │
│                            │ • Universal Counterexample Shrinker       │                         │
│                            └─────────────────────┬─────────────────────┘                         │
└──────────────────────────────────────────────────┼───────────────────────────────────────────────┘
                                                   │
     ┌───────────────────┬─────────────────────────┼────────────────────────┬───────────────────┐
     ▼                   ▼                         ▼                        ▼                   ▼
┌──────────────┐  ┌──────────────┐          ┌──────────────┐         ┌──────────────┐    ┌──────────────┐
│   Stage 22   │  │   Stage 20   │          │   Stage 18   │         │   Stage 13   │    │   Stage 5    │
│ Specifications│ │   Mutation   │          │   Concolic   │         │  CFG / SSA   │    │   Debugger   │
│   & Oracles  │  │   Analysis   │          │   Execution  │         │   Slicing    │    │ Orchestration│
└──────────────┘  └──────────────┘          └──────────────┘         └──────────────┘    └──────────────┘
```

---

## 3. Universal Generator Hierarchy

ProViz provides a language-neutral generator hierarchy implementing deterministic generation, sampling, and composition:

- **Primitive Generators:**
  - `IntegerGenerator`, `FloatGenerator`: Numeric sampling with range boundaries and distributions.
  - `BooleanGenerator`: Deterministic boolean generation.
  - `CharacterGenerator`, `StringGenerator`: Character and string synthesis with custom alphabets and length bounds.
  - `NullGenerator`, `ConstantGenerator`, `EnumGenerator`, `RangeGenerator`.
- **Structured Generators:**
  - `ArrayGenerator`, `ListGenerator`: Dynamic collections with element generators and length bounds.
  - `SetGenerator`, `MapGenerator`: Unique-element sets and associative key-value maps.
  - `TupleGenerator`, `ObjectGenerator`, `RecordGenerator`: Heterogeneous product types.
  - `OptionalGenerator`, `UnionGenerator`: Sum types and nullable values.
  - `TreeGenerator`, `GraphGenerator`: Recursive data structures with depth budgets.
- **Compositional Generators:**
  - `GeneratorComposition`: Sequential and combinational generator pipelines.

---

## 4. Deterministic Randomness & Seeding Model

All generators in ProViz derive values from `GeneratorContext`:
- Utilizes an immutable linear congruential pseudo-random generator:
  $$\text{val}_{n+1} = \frac{(\text{seed} \times 9301 + (\text{step} + \text{offset}) \times 49297 + 233280) \bmod 233280}{233280}$$
- Guarantees byte-for-byte reproducibility across runs, platforms, and distributed workers given identical `(seed, step)` coordinates.

---

## 5. Boundary Point Analysis & Generation

The `BoundaryAnalyzer` and `BoundaryGenerator` derive critical testing boundaries:
- **Canonical Numeric Bounds:** `0`, `1`, `-1`, `min`, `max`, `min + 1`, `max - 1`.
- **Source/AST Condition Extraction:** Parses relational conditions (`x > 10`, `y == 0`) and synthesizes boundary testing points directly matching condition decision planes.

---

## 6. Grammar-Guided Input Generation & Parsing

For recursive, syntactically constrained inputs (such as arithmetic expressions, JSON, or protocol formats):
- `Grammar`: Defines non-terminals, terminal symbols, and production rules.
- `GrammarGenerator`: Expands grammar rules up to bounded recursion depths.
- `GrammarShrinker`: Reduces complex syntactically valid strings while maintaining structural invariants and failure predicates.

---

## 7. Property-Based Testing & Test Families

- `TestFamilyTemplate`: Parameterized test template mapping function arguments to generator pipelines.
- `TestFamilyGenerator`: Instantiates batches of executable test cases from templates.
- `TestFamilyExpander`: Expands test families through targeted perturbations.
- `TestFamilyReducer`: Minimizes redundant instances based on behavioral cluster coverage.

---

## 8. Metamorphic Testing Architecture

Metamorphic testing validates programs without requiring concrete expected outputs by checking relational invariants:
- **`MetamorphicRelation`:** Encapsulates source input, transformation function, follow-up input, and expected output relationship.
- **`MetamorphicTransformation`:** Supports standard transformations (`PERMUTATION`, `REVERSE`, `SCALING`, `TRANSLATION`, `DUPLICATION`, `IDEMPOTENCE`) and custom transformations.
- **`MetamorphicOracle`:** Verifies whether baseline and transformed outputs satisfy relational properties (e.g. `sort(permute(L)) == sort(L)`).
- **`MetamorphicMiner`:** Automatically discovers candidate metamorphic relations from execution traces and method contracts.
- **`MetamorphicCampaign`:** Executes automated property sweeps across relations and tracks violations.

---

## 9. Counterexample Shrinking & Minimization

When an exploration candidate triggers a failure, assertion violation, or metamorphic breach, `Shrinker` reduces the input to its minimal root cause:
- **Numeric Minimization:** Shrinks numbers towards `0` via binary search.
- **Collection Minimization:** Halves collections, drops elements, and recursively shrinks remaining members.
- **String Minimization:** Slices strings and deletes characters while preserving failure predicates.
- **Structural Minimization:** Prunes superfluous keys and nullifies fields.
- **Invariant Preservation:** Guarantees that the failure predicate remains strictly satisfied at every shrinking step.

---

## 10. Behavioral Fingerprinting & Clustering

- **`BehavioralFingerprint`:** Captures execution characteristics including return type, stringified representation, covered branches, exception type, path signature, and mutations.
- **`BehaviorDistance`:** Quantifies semantic distance between distinct execution paths.
- **`BehaviorClusterer`:** Partitions execution outcomes into discrete behavioral clusters.
- **`NoveltyDetector`:** Identifies inputs that trigger previously unobserved branches, paths, or exceptions, preventing exploration loops.

---

## 11. Multi-Objective Guided Exploration

The engine steers exploration using unified feedback loops:
- **Coverage Guidance:** Targets unvisited control-flow blocks and branches.
- **Specification Guidance:** Targets uncovered specification condition boundaries.
- **Mutation Guidance & Survivor Killing:** Prioritizes inputs that kill surviving Stage 20 program mutants.
- **Regression Guidance:** Focuses exploration on semantic deltas identified in Stage 21.

---

## 12. Adaptive Exploration Queue & Policy Engine

- **`ExplorationQueue`:** Priority queue ordered by multidimensional `ExplorationScore`.
- **`ExplorationPolicy`:** Configurable weights for novelty, boundary proximity, specification importance, and mutant killing potential.
- **`AdaptiveExplorer`:** Dynamically adjusts generator weights based on yield rates and novelty discovery.

---

## 13. Seed Corpus & Input Mutation Operations

- **`SeedCorpus` & `SeedEntry`:** Manages high-yield seed inputs with dynamic energy ratings.
- **`SeedSelector`:** Energy-weighted seed selection algorithm.
- **`InputMutationOperator`:** Type-aware mutation operators (increment, negate, zero, insert, delete, reverse, shuffle, struct nullify).

---

## 14. Exploration Campaign Lifecycle & Budgeting

- **`ExplorationCampaign`:** Central controller managing generators, objectives, metamorphic relations, and evaluation results.
- **`ExplorationSession`:** Tracks execution lifecycle (`PENDING`, `RUNNING`, `PAUSED`, `COMPLETED`, `CANCELLED`).
- **`ExplorationBudget`:** Enforces resource bounds on iterations, tests, executions, time, and shrink steps.
- **`ExplorationSnapshot`:** Immutable historical snapshot of exploration progress.

---

## 15. Multidimensional Exploration Matrix & Queries

`ExplorationMatrix` tracks cross-cutting associations between:
- Candidate Inputs $\longleftrightarrow$ Test Objectives
- Candidate Inputs $\longleftrightarrow$ Specification Boundaries
- Candidate Inputs $\longleftrightarrow$ Mutants Killed
- Candidate Inputs $\longleftrightarrow$ Behavioral Clusters

`ExplorationQueries` provides instant deterministic querying across these dimensions.

---

## 16. Exploration Findings & Natural Explanations

- **`ExplorationFindingKind`:** Identifies phenomena such as `DISCOVERED_NEW_BEHAVIOR`, `VIOLATED_METAMORPHIC_RELATION`, `KILLED_SURVIVING_MUTANT`, `CLOSED_SPECIFICATION_GAP`, `CONFLICTING_BEHAVIOR`, `DISCOVERED_CRASH_OR_EXCEPTION`, `MINIMIZED_COUNTEREXAMPLE`.
- **`ExplorationExplainer`:** Produces natural language diagnostic summaries explaining root causes and implications.

---

## 17. Multidimensional Exploration Adequacy

`ExplorationAdequacyAnalyzer` evaluates holistic exploration completeness:
- **Behavioral Diversity Coverage:** Ratio of unique behavioral clusters explored.
- **Generator Coverage:** Proportion of configured generator pipelines exercised.
- **Metamorphic Coverage:** Proportion of metamorphic relations validated.
- **Boundary Coverage:** Proportion of critical boundary points evaluated.

---

## 18. Language Adapter Boundary

- **`LanguageExplorationAdapter`:** Abstract interface for language-specific value formatting and harness generation.
- **`PythonExplorationAdapter`:** Formats Python kwargs/args, generates standalone property test suites, and synthesizes runnable test harnesses.

---

## 19. Debugger Integration & Public API

The `Debugger` exposes high-level exploration controls:
- `createExplorationCampaign(options)`
- `startExploration(campaignId, budget)`
- `generateInputs(generatorConfig)`
- `mineMetamorphicRelations(traceOrCode)`
- `runMetamorphicCampaign(relationId, inputCount)`
- `getExplorationResults(campaignId)`
- `getExplorationFindings(campaignId)`
- `getBehavioralClusters(campaignId)`
- `getNovelBehaviors(campaignId)`
- `getExplorationCoverage(campaignId)`
- `shrinkCounterexample(counterexample, predicate)`
- `explainExploration(findingId)`

---

## 20. Verification, Benchmark Results & Roadmap

### Verification Across 6 Mandatory End-to-End Scenarios
1. **Scenario 1 (Boundary Exploration):** Discovered zero-division boundary and distinct behavioral fingerprints.
2. **Scenario 2 (Surviving Mutant Kill):** Generated boundary input exposing off-by-one difference, killing surviving clamp mutant.
3. **Scenario 3 (Metamorphic Sort Validation):** Verified permutation invariance, idempotence, and size monotonicity.
4. **Scenario 4 (Counterexample Minimization):** Shrunk 7-element failing array down to minimal single-element counterexample `[-7]`.
5. **Scenario 5 (Adaptive Novelty Navigation):** Successfully navigated multi-branch classifier into 5 distinct behavioral clusters.
6. **Scenario 6 (Conflicting Behavior Detection):** Detected and explained contradictory specification assertions.

### Test Suite Status
- **Stage 23 Assertions:** 30 test blocks, >100 assertions, 100% pass rate.
- **Full Suite Status:** 23/23 Stages Passing, 100% green status across the repository.
