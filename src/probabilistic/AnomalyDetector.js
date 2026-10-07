import { AnomalyScore } from './AnomalyScore.js';
import { AnomalyExplanation } from './AnomalyExplanation.js';
import { BehaviorAnomaly } from './BehaviorAnomaly.js';

export class AnomalyDetector {
  /**
   * Detects anomalies from behavior distribution.
   * Safety invariant: Rare behavior is flagged as anomaly candidate, NOT automatically an error/bug.
   */
  static detectFromDistribution(distribution, rarityThreshold = 0.005) {
    if (!distribution || distribution.totalObservations < 10) {
      return [];
    }

    const anomalies = [];
    const dominant = distribution.topOutcomes(1)[0];
    const baselineDesc = dominant
      ? `${dominant.outcome.id} (${(dominant.estimatedProbability * 100).toFixed(1)}%)`
      : 'No dominant behavior';

    for (const prob of distribution.getAllOutcomes()) {
      if (prob.estimatedProbability < rarityThreshold && prob.observedFrequency > 0) {
        const rarityScore = 1.0 - (prob.estimatedProbability / rarityThreshold);
        const anomalyScore = new AnomalyScore({
          score: Math.min(1.0, 0.8 + 0.2 * rarityScore),
          threshold: 0.8,
          rarityScore,
          divergenceScore: Math.abs((dominant?.estimatedProbability || 0) - prob.estimatedProbability)
        });

        const isExc = prob.outcome.isException();
        const type = isExc ? 'UNEXPECTED_EXCEPTION' : 'RARE_BEHAVIOR';

        const explanation = new AnomalyExplanation({
          baseline: baselineDesc,
          observedBehavior: `${prob.outcome.id} observed ${prob.observedFrequency}/${distribution.totalObservations} times (${(prob.estimatedProbability * 100).toFixed(3)}%)`,
          difference: `Occurrence rate ${(prob.estimatedProbability * 100).toFixed(3)}% is below rarity threshold ${(rarityThreshold * 100).toFixed(3)}%`,
          evidence: prob.supportingEvidence[0] || null,
          confidence: prob.observedFrequency >= 2 ? 'HIGH' : 'MEDIUM'
        });

        anomalies.push(
          new BehaviorAnomaly({
            subject: distribution.subject,
            type,
            anomalyScore,
            explanation,
            outcome: prob.outcome
          })
        );
      }
    }

    return anomalies;
  }
}
