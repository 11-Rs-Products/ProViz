# Universal Program Repair, Fix Synthesis & Patch Validation Engine (Stage 19)

## 1. Architecture & Core Lifecycle
Stage 19 establishes the automated Program Repair, Fix Synthesis, and Patch Validation subsystem for ProViz.

```
                    ┌──────────────────────────────┐
                    │       SOURCE WORKSPACE       │
                    └──────────────┬───────────────┘
                                   ↓
                         Verification Finding
                                   ↓
                         Root-Cause Analysis
                                   ↓
                         Repair Hypotheses
                                   ↓
                      Candidate Patch Generation
                                   ↓
                       ┌───────────┴───────────┐
                       ↓                       ↓
                Static Validation      Symbolic Validation
                       ↓                       ↓
               Concolic Validation    Regression Validation
                       └───────────┬───────────┘
                                   ↓
                           Behavioral Delta
                                   ↓
                        Repair Explanation & Result
                                   ↓
                            User Decision
                                   ↓
                          Apply / Reject / Revert
                                   ↓
                        New Workspace Revision
```

### Formal Repair Lifecycle
```
Finding
  ↓
Root Cause
  ↓
Repair Hypothesis
  ↓
Patch Candidate
  ↓
Static Validation
  ↓
Symbolic Validation
  ↓
Concolic Validation
  ↓
Regression Validation
  ↓
Behavioral Delta
  ↓
Validated Candidate
  ↓
User Decision
  ↓
Apply / Reject
```

---

## 2. Root-Cause Analysis
`RootCauseAnalyzer` combines information across all ProViz static and dynamic analysis layers:
- Stage 12: Dataflow origins and mutation history
- Stage 13: CFG, SSA, and Program Slicing
- Stage 14: Abstract types and value intervals
- Stage 15: Verification findings and violated properties
- Stage 16: Symbolic constraints and path conditions
- Stage 17 & 18: Concrete counterexamples and observed traces

---

## 3. Repair Hypotheses
`RepairHypothesis` defines an explicit causal assertion:
- **Problem**: Description of the defect.
- **Root Cause**: The variable or expression introducing the invalid state.
- **Proposed Transformation**: Guard or handler to insert.
- **Expected Invariant**: Mathematical property enforced at the target site (e.g. `denominator != 0`).
- **Expected Behavior**: Desired runtime response when invariant is breached.

---

## 4. Transformation Model
`Transformation` and `TransformationBuilder` construct structured, syntax-aware code modifications independently of raw string interpolation:
- Preserves code indentation and formatting.
- Wraps or precedes target statements with explicit guards.

---

## 5. Patch Representation
- `Patch`: Immutable, location-precise structural source edit (`fileId`, `startLine`, `startColumn`, `endLine`, `endColumn`, `replacement`, `originalText`).
- `PatchSet`: Ordered composition of edits supporting `apply()`, `reverse()`, `compose()`, and `conflictsWith()`.
- `PatchValidator`: Ensures target bounds exist, original source matches, and revision versions are consistent.

---

## 6. Supported Repair Strategies
- `NULL_GUARD`: Guards against None / null pointer dereferences (`if x is None: return None`).
- `DIVISION_GUARD`: Guards against division by zero (`if denominator == 0: return 0`).
- `BOUNDS_CHECK`: Protects against index out of bounds on sequences (`if not (0 <= i < len(xs)): return None`).
- `KEY_EXISTENCE_GUARD`: Protects against missing dictionary keys (`if k not in d: return None`).
- `TYPE_GUARD`: Guards against unexpected operand types (`if not isinstance(x, ExpectedType): return None`).
- `ATTRIBUTE_GUARD`: Guards against missing object attributes (`if not hasattr(obj, 'attr'): return None`).
- `EXCEPTION_HANDLING`: Wraps risky blocks in targeted `try/except` handlers.

---

## 7. Static Validation
`StaticRepairValidator`:
- Applies candidate patches to an isolated copy of the `WorkspaceSnapshot`.
- Re-runs Stage 15 `VerificationAnalyzer`.
- Confirms whether the original finding is `RESOLVED`, `STILL_PRESENT`, or `UNREACHABLE`.

---

## 8. Symbolic Validation
`SymbolicRepairValidator`:
- Reconstructs symbolic paths with Stage 16 `SymbolicAnalyzer`.
- Confirms that the counterexample path condition is mathematically eliminated or rendered infeasible under the new guard.

---

## 9. Concolic Validation
`ConcolicRepairValidator`:
- Uses Stage 17/18 `TestExecutor` to replay the original failing counterexample against the patched source.
- Validates that runtime exceptions are avoided and execution completes safely.

---

## 10. Regression Validation
`RegressionValidator`:
- Re-executes the existing test suite and previously generated test cases against the patched code.
- Ensures zero regressions on established program functionality.

---

## 11. Behavioral Comparison
`BehavioralDelta`:
- Analyzes execution deltas between original and patched program behavior.
- Classifies changes into `EXPECTED` (avoided errors, intentional default returns) and `UNEXPECTED` modifications.

---

## 12. Contract Preservation
`ContractValidator`:
- Verifies that patched functions respect pre-conditions, post-conditions, and class invariants defined in Stage 15.

---

## 13. Multi-File Repairs
- Patches can span multiple files within a `WorkspaceSnapshot`.
- Reanalyzes all affected modules while keeping untouched files intact.

---

## 14. Historical Snapshots & Immutability
- Active workspace is never mutated during patch generation and validation.
- All candidate generation operates on isolated snapshot clones.

---

## 15. Determinism
- Byte-for-byte reproducibility: Identical inputs yield identical serialized repair candidates and results.
- All IDs are computed deterministically via stable hashing.

---

## 16. Security & Safety Boundaries
- Zero dynamic code execution via `eval()`, `exec()`, or sub-shells.
- All tests execute strictly through the configured ProViz execution sandbox.

---

## 17. Unsupported Cases
Unsupported dynamic idioms produce explicit `UNSUPPORTED_LANGUAGE_FEATURE` or `UNKNOWN` statuses rather than fabricating synthetic fixes.

---

## 18. Debugger Integration APIs
Integrated in `src/debugger/Debugger.js`:
- `analyzeFindingRootCause(findingId)`
- `generateRepairCandidates(findingId)`
- `getRepairCandidate(candidateId)`
- `validateRepair(candidateId)`
- `validateAllRepairs(findingId)`
- `previewRepair(candidateId)`
- `applyRepair(candidateId)`
- `rejectRepair(candidateId)`
- `revertRepair(repairId)`
- `getRepairResult(candidateId)`
- `getRepairExplanation(candidateId)`
- `getRepairHistory()`
- `getRepairSnapshot()`
- `generateRepairsForCounterexample(counterexampleId)`
- `generateRepairsForWatch(watchId)`
- `analyzeObjectFailure(objectId)`

---

## 19. UI Integration
Presentation-only UI panel displaying:
- **Finding & Root Cause**: Causal location, variable, and evidence.
- **Candidate Fixes**: Exact diff preview, strategy, and confidence.
- **Layered Validation**: Syntax, Static, Symbolic, Concolic, and Regression badges.
- **Action Buttons**: Preview, Apply, Reject, and Revert.

---

## 20. Known Limitations
- Synthesizes safety guards and bounded handling; does not generate arbitrary algorithmic code from scratch.
- Complex multi-method refactorings require explicit user direction.
