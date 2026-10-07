import { RareBehavior } from './RareBehavior.js';

export class RareBehaviorDetector {
  /**
   * Scans a BehaviorDistribution for outcomes below rarity threshold.
   */
  static detect(distribution, threshold = 0.005) {
    if (!distribution || distribution.totalObservations < 10) return [];

    const rare = [];
    for (const p of distribution.getAllOutcomes()) {
      if (p.estimatedProbability < threshold && p.observedFrequency > 0) {
        rare.push(
          new RareBehavior({
            subject: distribution.subject,
            outcome: p.outcome,
            frequency: p.observedFrequency,
            probability: p.estimatedProbability,
            inputs: p.supportingEvidence.map(e => e.observation?.input).filter(Boolean)
          })
        );
      }
    }

    return rare;
  }
}
