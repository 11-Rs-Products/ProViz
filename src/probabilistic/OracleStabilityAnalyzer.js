import { OracleStabilityClassification } from './OracleEvidenceModel.js';

export class OracleStabilityAnalyzer {
  static analyze(evidenceModel) {
    if (!evidenceModel || evidenceModel.totalEvaluations === 0) {
      return {
        classification: OracleStabilityClassification.INSUFFICIENTLY_OBSERVED,
        score: 0.0,
        explanation: 'Oracle has no evaluation records.'
      };
    }

    if (evidenceModel.totalEvaluations < 5) {
      return {
        classification: OracleStabilityClassification.INSUFFICIENTLY_OBSERVED,
        score: 0.3,
        explanation: `Insufficient observations (${evidenceModel.totalEvaluations} evaluations).`
      };
    }

    if (evidenceModel.environmentDependenceDetected) {
      return {
        classification: OracleStabilityClassification.UNCERTAIN,
        score: 0.4,
        explanation: 'Oracle exhibits environment dependence.'
      };
    }

    if (evidenceModel.unknownCount > evidenceModel.totalEvaluations * 0.2) {
      return {
        classification: OracleStabilityClassification.UNCERTAIN,
        score: 0.5,
        explanation: `High proportion of inconclusive oracle outcomes (${evidenceModel.unknownCount}/${evidenceModel.totalEvaluations}).`
      };
    }

    if (evidenceModel.totalEvaluations >= 20 && evidenceModel.mutationKillsCount > 0) {
      return {
        classification: OracleStabilityClassification.STABLE,
        score: 0.95,
        explanation: `Highly stable oracle with ${evidenceModel.totalEvaluations} evaluations and ${evidenceModel.mutationKillsCount} mutation kills.`
      };
    }

    return {
      classification: OracleStabilityClassification.LIKELY_STABLE,
      score: 0.8,
      explanation: `Consistent oracle behavior across ${evidenceModel.totalEvaluations} evaluations.`
    };
  }
}
