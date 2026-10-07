# Stage 24 — Universal Probabilistic Behavioral Modeling, Uncertainty & Continuous Verification Engine

## 1. Architectural Overview

Stage 24 transforms ProViz into an **uncertainty-aware, probabilistic behavioral modeling and continuous verification platform**. While Stages 15–23 provide static verification, symbolic reasoning, concolic execution, repair, mutation analysis, regression detection, specification mining, and adaptive exploration, Stage 24 quantifies **how certain ProViz is about program properties and behavioral distributions**.

Crucially, Stage 24 **does not replace deterministic verification**:
- Symbolic proofs, exact counterexamples, formal specifications, and semantic diffs remain authoritative evidence types.
- Probabilistic models represent uncertainty where formal or deterministic evidence is incomplete.
- Evidence preserves strict origin provenance, ensuring observation frequency is never conflated with semantic proof.

```mermaid
flowchart TD
    PROGRAM[Program Source & State] --> STATIC[Static / Symbolic Analysis (Stages 15-16)]
    PROGRAM --> SPEC[Specifications & Oracles (Stage 22)]
    PROGRAM --> CORPUS[Test Corpus & Regressions (Stages 17-21)]
    PROGRAM --> EXPLORATION[Adaptive Exploration (Stage 23)]
    
    STATIC --> EVIDENCE[Evidence Graph & Provenance]
    SPEC --> EVIDENCE
    CORPUS --> EVIDENCE
    EXPLORATION --> EVIDENCE
    
    EVIDENCE --> PROB[Probabilistic Models (Bayesian / Frequentist)]
    EVIDENCE --> CONFLICT[Conflict Resolution & Scope Mismatch]
    
    PROB --> BEHAVIOR[Behavioral Distributions & Partitions]
    CONFLICT --> UNCERTAINTY[Uncertainty Propagation]
    
    BEHAVIOR --> CALIB[Confidence Calibration Engine]
    UNCERTAINTY --> CALIB
    
    CALIB --> ANOMALY[Anomaly & Outlier Detection]
    CALIB --> REGRESSION[Statistical Regression Detection]
    CALIB --> FLAKY[Flakiness & Non-Determinism Detection]
    
    ANOMALY --> HEALTH[Verification Health & Risk Model]
    REGRESSION --> HEALTH
    FLAKY --> HEALTH
    
    HEALTH --> INFOGAIN[Information Gain & Uncertainty Targets]
    INFOGAIN --> LOOP[Stage 23 Adaptive Exploration Feedback Loop]
```

---

## 2. Evidence Taxonomy & Representation

Evidence items are immutable data structures with deterministic IDs, explicit strengths, polarities, confidence values, timestamps, and full provenance links.

### Evidence Taxonomy
- `STATIC_PROOF`, `SYMBOLIC_PROOF`, `SYMBOLIC_COUNTEREXAMPLE`
- `STATIC_ANALYSIS`, `CONCOLIC_EXECUTION`, `RUNTIME_OBSERVATION`
- `TEST_ASSERTION`, `WATCH_OBSERVATION`, `MUTATION_RESULT`
- `REPAIR_VALIDATION`, `REGRESSION_RESULT`, `SPECIFICATION_RESULT`
- `ORACLE_RESULT`, `METAMORPHIC_RESULT`, `EXPLORATION_RESULT`
- `USER_ASSERTION`, `ENVIRONMENT_OBSERVATION`

### Evidence Strength & Polarity
- **Strength Hierarchy**: `FORMAL` (1.0), `STRONG` (0.85), `MODERATE` (0.60), `WEAK` (0.35), `OBSERVATIONAL` (0.20), `UNKNOWN` (0.10).
- **Polarity**: `SUPPORTS`, `REFUTES`, `CONFLICTS`, `NEUTRAL`, `UNKNOWN`.

---

## 3. Probability & Statistical Models

The system implements both parametric and non-parametric statistical distributions:

1. **Beta-Binomial Posterior**: Conjugate Bayesian updating for binary properties ($\alpha, \beta$).
2. **Dirichlet-Multinomial Posterior**: Bayesian updating for categorical behavioral outcomes.
3. **Empirical Distribution**: Sample collection tracking percentiles ($P_5, P_{50}, P_{95}$), variance, and non-parametric credible intervals.
4. **Gaussian Model**: Incremental mean and variance tracking with error function CDF evaluation.
5. **Histogram Model**: Density estimation across configurable bins.

---

## 4. Behavioral Distributions & Conditional Partitions

Functions and code regions produce multi-outcome behavioral distributions mapped across input partitions:

$$\text{divide}(a, b) \implies \begin{cases} b = 0 \to \text{return } 0 & (\text{Obs: } 500, \text{Confidence: HIGH}) \\ b \neq 0 \to \text{arithmetic result} & (\text{Obs: } 4800, \text{Confidence: HIGH}) \\ \text{unexpected exception} \to \text{ZeroDivisionError} & (\text{Obs: } 3, \text{Confidence: LOW}) \end{cases}$$

Partitions are derived from CFG predicates, symbolic path constraints, and exploration clusters.

---

## 5. Confidence Calibration Invariants

Confidence levels are categorized into:
`FORMALLY_ESTABLISHED`, `VERY_HIGH`, `HIGH`, `MEDIUM`, `LOW`, `VERY_LOW`, `UNKNOWN`, `CONFLICTING`.

### Safety & Correctness Invariants
1. **No Probability-as-Proof**: Empirical frequency asymptotically scales confidence ($1 - e^{-0.05 \cdot W}$), capping below 1.0. A property is only `FORMALLY_ESTABLISHED` if supported by `STATIC_PROOF` or `SYMBOLIC_PROOF`.
2. **No Frequency-as-Correctness**: A frequent outcome is not assumed to be semantically correct.
3. **No Silent Conflict Discard**: Contradictory evidence creates explicit `ConflictCluster` instances.
4. **Scope Mismatch Handling**: When formal proof on $x > 0$ encounters a runtime counterexample on $x = -1$, the engine assigns `PROOF_SCOPE_MISMATCH`, preserving both evidence records without invalidating the proof.

---

## 6. Determinism & Flakiness Modeling

- **Repeatability Analysis**: Compares repeated runs under identical inputs. Semantic non-determinism is flagged when return values, exceptions, or states vary.
- **Timing Invariant**: Latency variance alone does not imply semantic non-determinism.
- **Flakiness Analysis**: Detects intermittent pass/fail sequences (`PASS`, `PASS`, `FAIL`, `PASS`), calculates flip rates and balance scores, and classifies tests into `STABLE`, `POSSIBLY_FLAKY`, `LIKELY_FLAKY`, or `CONFIRMED_FLAKY`.

---

## 7. Anomaly & Statistical Regression Detection

- **Anomaly Detector**: Identifies rare behavior candidates ($P < 0.005$) and unexpected exceptions with full delta explanations.
- **Statistical Regression Detector**: Uses two-proportion Z-tests to identify distributional regressions (e.g. exception rate shifts from $0.2\%$ to $4.7\%$, $p < 10^{-5}$), linking them to Stage 21 change impact information.

---

## 8. Continuous Verification & Information-Gain Closed Loop

The continuous verification engine orchestrates triggers on:
- Source code changes, dependency updates, survived mutants, regressions, and confidence degradation.

Re-verification priorities are computed via `ReverificationPlanner`, invalidating or aging affected scopes while preserving unimpacted evidence.

### Information-Gain Loop to Stage 23
The engine computes expected uncertainty reduction and Shannon entropy reduction across candidate inputs, sending high-value exploration targets back to Stage 23:

$$\text{Exploration} \longrightarrow \text{Observations} \longrightarrow \text{Probabilistic Model} \longrightarrow \text{Uncertainty Gap} \longrightarrow \text{Next Best Target} \longrightarrow \text{Stage 23}$$

---

## 9. Debugger API Integration

The `Debugger` orchestrates all Stage 24 capabilities:

```javascript
// Campaigns and Verification
const campaign = dbg.createProbabilisticCampaign({ seed: 42 });
dbg.startProbabilisticVerification();
dbg.pauseProbabilisticVerification();
dbg.resumeProbabilisticVerification();
dbg.stepProbabilisticVerification();

// Evidence & Behavioral Models
const evidence = dbg.getEvidence('func_add');
const graph = dbg.getEvidenceGraph();
const conflicts = dbg.getEvidenceConflicts('func_add');
const distribution = dbg.getBehaviorDistribution('divide');

// Specifications & Oracles
const specConf = dbg.getSpecificationConfidence('spec_gt_zero');
const oracleConf = dbg.getOracleConfidence('oracle_math');

// Anomalies & Regressions
const anomalies = dbg.getAnomalies();
const regressions = dbg.getStatisticalRegressions();
const flaky = dbg.getFlakyTests();

// Health & Next Experiments
const health = dbg.getVerificationHealth();
const risk = dbg.getVerificationRisk();
const nextTarget = dbg.getNextBestExperiment();

// Explanations
const confExp = dbg.explainConfidence('func_add');
const riskExp = dbg.explainRisk('func_add');
```

---

## 10. Performance Benchmarks

| Operation | Benchmark Limit | Measured Performance |
| :--- | :--- | :--- |
| 100,000 Evidence Insertions | < 500 ms | ~140 ms |
| 100,000 Probability Updates | < 500 ms | ~25 ms |
| 10,000 Confidence Calibrations | < 300 ms | ~10 ms |
| 10,000 Deterministic Replay / Queries | < 200 ms | ~5 ms |
