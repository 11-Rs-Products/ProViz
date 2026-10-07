import { Experiment } from './Experiment.js';
import { ExperimentCandidate } from './ExperimentCandidate.js';
import { ExperimentValue } from './ExperimentValue.js';
import { ExperimentCost } from './ExperimentCost.js';
import { ExperimentKind } from './ExperimentKind.js';
import { EvidenceGapKind } from './EvidenceGapKind.js';

export class ExperimentPlanner {
  /**
   * Transforms evidence gaps and goals into executable experiment candidates.
   */
  static planExperiments(gaps = [], goals = [], context = {}) {
    const candidates = [];

    for (const gap of gaps) {
      switch (gap.kind) {
        case EvidenceGapKind.MISSING_PROOF: {
          // If easily provable, prefer STATIC_VERIFY / SYMBOLIC_PROVE; if finding has counterexample, prefer SYMBOLIC_DISPROVE
          if (context.hasFeasibleCounterexample) {
            candidates.push(
              new ExperimentCandidate({
                experiment: new Experiment({
                  kind: ExperimentKind.SYMBOLIC_DISPROVE,
                  target: gap.subject,
                  estimatedCost: 8,
                  expectedInformationGain: 0.95
                }),
                expectedValue: new ExperimentValue({
                  informationGain: 0.95,
                  riskReduction: 0.85,
                  findingResolution: 0.90,
                  uncertaintyReduction: 0.85
                }),
                estimatedCost: new ExperimentCost({ cpuCost: 1.0, wallClockEstimateMs: 8 }),
                gapId: gap.id,
                rationale: 'Symbolic counterexample reproduction is highest value for unproven finding.'
              })
            );
          } else {
            // Prefer STATIC_VERIFY first (low cost, immediate formal proof if valid)
            candidates.push(
              new ExperimentCandidate({
                experiment: new Experiment({
                  kind: ExperimentKind.STATIC_VERIFY,
                  target: gap.subject,
                  estimatedCost: 2,
                  expectedInformationGain: 0.90
                }),
                expectedValue: new ExperimentValue({
                  informationGain: 0.90,
                  riskReduction: 0.80,
                  confidenceGain: 0.95,
                  uncertaintyReduction: 0.90
                }),
                estimatedCost: new ExperimentCost({ cpuCost: 0.5, wallClockEstimateMs: 2 }),
                gapId: gap.id,
                rationale: 'Static verification can establish formal property at negligible cost.'
              })
            );
          }
          break;
        }

        case EvidenceGapKind.SURVIVING_MUTANT: {
          candidates.push(
            new ExperimentCandidate({
              experiment: new Experiment({
                kind: ExperimentKind.KILL_MUTANT,
                target: gap.subject,
                estimatedCost: 12,
                expectedInformationGain: 0.80
              }),
              expectedValue: new ExperimentValue({
                informationGain: 0.80,
                riskReduction: 0.70,
                mutationAdequacyGain: 0.90,
                uncertaintyReduction: 0.60
              }),
              estimatedCost: new ExperimentCost({ cpuCost: 1.2, wallClockEstimateMs: 12 }),
              gapId: gap.id,
              rationale: 'Kill surviving mutant to increase behavioral adequacy.'
            })
          );
          break;
        }

        case EvidenceGapKind.UNVALIDATED_REPAIR: {
          candidates.push(
            new ExperimentCandidate({
              experiment: new Experiment({
                kind: ExperimentKind.VALIDATE_REPAIR,
                target: gap.subject,
                estimatedCost: 15,
                expectedInformationGain: 0.99
              }),
              expectedValue: new ExperimentValue({
                informationGain: 0.99,
                riskReduction: 0.95,
                findingResolution: 0.95,
                uncertaintyReduction: 0.90
              }),
              estimatedCost: new ExperimentCost({ cpuCost: 1.5, wallClockEstimateMs: 15 }),
              gapId: gap.id,
              rationale: 'Validate applied patch across static, symbolic, and regression suites.'
            })
          );
          break;
        }

        case EvidenceGapKind.UNEXPLORED_PATH: {
          candidates.push(
            new ExperimentCandidate({
              experiment: new Experiment({
                kind: ExperimentKind.CONCOLIC_EXPLORE,
                target: gap.subject,
                estimatedCost: 14,
                expectedInformationGain: 0.85
              }),
              expectedValue: new ExperimentValue({
                informationGain: 0.85,
                riskReduction: 0.75,
                coverageGain: 0.85,
                uncertaintyReduction: 0.80
              }),
              estimatedCost: new ExperimentCost({ cpuCost: 1.4, wallClockEstimateMs: 14 }),
              gapId: gap.id,
              rationale: 'Concolic exploration systematically inverts branch conditions on complex path.'
            })
          );
          break;
        }

        case EvidenceGapKind.CONFLICTING_EVIDENCE: {
          candidates.push(
            new ExperimentCandidate({
              experiment: new Experiment({
                kind: ExperimentKind.REPEAT_OBSERVATION,
                target: gap.subject,
                estimatedCost: 5,
                expectedInformationGain: 0.75
              }),
              expectedValue: new ExperimentValue({
                informationGain: 0.75,
                uncertaintyReduction: 0.85,
                riskReduction: 0.60
              }),
              estimatedCost: new ExperimentCost({ cpuCost: 0.8, wallClockEstimateMs: 5 }),
              gapId: gap.id,
              rationale: 'Repeat observation to resolve contradictory evidence and reduce uncertainty.'
            })
          );
          break;
        }

        case EvidenceGapKind.MISSING_OBSERVATION: {
          candidates.push(
            new ExperimentCandidate({
              experiment: new Experiment({
                kind: ExperimentKind.ANOMALY_REPRODUCTION,
                target: gap.subject,
                estimatedCost: 10,
                expectedInformationGain: 0.85
              }),
              expectedValue: new ExperimentValue({
                informationGain: 0.85,
                riskReduction: 0.75,
                uncertaintyReduction: 0.70
              }),
              estimatedCost: new ExperimentCost({ cpuCost: 1.0, wallClockEstimateMs: 10 }),
              gapId: gap.id,
              rationale: 'Reproduce anomaly to confirm whether it is a rare defect or benign boundary.'
            })
          );
          break;
        }

        case EvidenceGapKind.MISSING_ORACLE: {
          candidates.push(
            new ExperimentCandidate({
              experiment: new Experiment({
                kind: ExperimentKind.ORACLE_VALIDATION,
                target: gap.subject,
                estimatedCost: 6,
                expectedInformationGain: 0.80
              }),
              expectedValue: new ExperimentValue({
                informationGain: 0.80,
                riskReduction: 0.65,
                confidenceGain: 0.70
              }),
              estimatedCost: new ExperimentCost({ cpuCost: 0.6, wallClockEstimateMs: 6 }),
              gapId: gap.id,
              rationale: 'Validate oracle stability before relying on specification checks.'
            })
          );
          break;
        }

        case EvidenceGapKind.MISSING_COVERAGE: {
          candidates.push(
            new ExperimentCandidate({
              experiment: new Experiment({
                kind: ExperimentKind.GENERATE_TEST,
                target: gap.subject,
                estimatedCost: 8,
                expectedInformationGain: 0.70
              }),
              expectedValue: new ExperimentValue({
                informationGain: 0.70,
                coverageGain: 0.90,
                uncertaintyReduction: 0.50
              }),
              estimatedCost: new ExperimentCost({ cpuCost: 0.8, wallClockEstimateMs: 8 }),
              gapId: gap.id,
              rationale: 'Generate targeted test input to cover unreachable or untested branch.'
            })
          );
          break;
        }

        case EvidenceGapKind.SPECIFICATION_UNCERTAINTY: {
          candidates.push(
            new ExperimentCandidate({
              experiment: new Experiment({
                kind: ExperimentKind.ORACLE_VALIDATION,
                target: gap.subject,
                estimatedCost: 6,
                expectedInformationGain: 0.85
              }),
              expectedValue: new ExperimentValue({
                informationGain: 0.85,
                riskReduction: 0.70,
                confidenceGain: 0.80,
                uncertaintyReduction: 0.85
              }),
              estimatedCost: new ExperimentCost({ cpuCost: 0.6, wallClockEstimateMs: 6 }),
              gapId: gap.id,
              rationale: 'Validate specification and oracle correctness under uncertainty.'
            })
          );
          break;
        }

        case EvidenceGapKind.INSUFFICIENT_SAMPLE:
        case EvidenceGapKind.ENVIRONMENT_MISMATCH: {
          candidates.push(
            new ExperimentCandidate({
              experiment: new Experiment({
                kind: ExperimentKind.REPEAT_OBSERVATION,
                target: gap.subject,
                estimatedCost: 5,
                expectedInformationGain: 0.70
              }),
              expectedValue: new ExperimentValue({
                informationGain: 0.70,
                uncertaintyReduction: 0.80,
                riskReduction: 0.60
              }),
              estimatedCost: new ExperimentCost({ cpuCost: 0.5, wallClockEstimateMs: 5 }),
              gapId: gap.id,
              rationale: 'Repeat observations to increase statistical sample size.'
            })
          );
          break;
        }

        case EvidenceGapKind.STALE_EVIDENCE: {
          candidates.push(
            new ExperimentCandidate({
              experiment: new Experiment({
                kind: ExperimentKind.REGRESSION_RUN,
                target: gap.subject,
                estimatedCost: 10,
                expectedInformationGain: 0.75
              }),
              expectedValue: new ExperimentValue({
                informationGain: 0.75,
                riskReduction: 0.70,
                confidenceGain: 0.80
              }),
              estimatedCost: new ExperimentCost({ cpuCost: 1.0, wallClockEstimateMs: 10 }),
              gapId: gap.id,
              rationale: 'Re-run regression suite to refresh stale evidence.'
            })
          );
          break;
        }

        case EvidenceGapKind.MISSING_COUNTEREXAMPLE: {
          candidates.push(
            new ExperimentCandidate({
              experiment: new Experiment({
                kind: ExperimentKind.SYMBOLIC_DISPROVE,
                target: gap.subject,
                estimatedCost: 12,
                expectedInformationGain: 0.90
              }),
              expectedValue: new ExperimentValue({
                informationGain: 0.90,
                riskReduction: 0.85,
                uncertaintyReduction: 0.80
              }),
              estimatedCost: new ExperimentCost({ cpuCost: 1.2, wallClockEstimateMs: 12 }),
              gapId: gap.id,
              rationale: 'Search for concrete counterexample via symbolic solver.'
            })
          );
          break;
        }

        default:
          break;
      }
    }

    return candidates;
  }
}
