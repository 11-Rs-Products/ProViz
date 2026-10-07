import { ConfidenceScale } from './ConfidenceScale.js';
import { OracleStabilityAnalyzer } from './OracleStabilityAnalyzer.js';
import { OracleStabilityClassification } from './OracleEvidenceModel.js';

export class OracleConfidenceEstimator {
  static estimate(evidenceModel) {
    const stability = OracleStabilityAnalyzer.analyze(evidenceModel);
    let confidence = ConfidenceScale.LOW;

    switch (stability.classification) {
      case OracleStabilityClassification.STABLE:
        confidence = ConfidenceScale.VERY_HIGH;
        break;
      case OracleStabilityClassification.LIKELY_STABLE:
        confidence = ConfidenceScale.HIGH;
        break;
      case OracleStabilityClassification.UNCERTAIN:
        confidence = ConfidenceScale.MEDIUM;
        break;
      case OracleStabilityClassification.CONFLICTING:
        confidence = ConfidenceScale.CONFLICTING;
        break;
      case OracleStabilityClassification.INSUFFICIENTLY_OBSERVED:
      default:
        confidence = ConfidenceScale.LOW;
        break;
    }

    return {
      oracleId: evidenceModel.oracleId,
      confidence,
      confidenceScore: stability.score,
      stabilityClassification: stability.classification,
      explanation: stability.explanation
    };
  }
}
