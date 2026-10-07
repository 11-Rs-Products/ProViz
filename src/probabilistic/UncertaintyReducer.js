import { Uncertainty } from './Uncertainty.js';
import { UncertaintyKind } from './UncertaintyKind.js';

export class UncertaintyReducer {
  /**
   * Reduce statistical uncertainty given sample count N and variance
   */
  static reduceByObservation(priorUncertainty, newObservationCount = 1, decayRate = 0.05) {
    const currentScore = priorUncertainty.score;
    // Asymptotically reduce uncertainty with more observations: U_new = U_old * exp(-decayRate * N)
    const factor = Math.exp(-decayRate * Math.max(0, newObservationCount));
    const nextScore = Math.max(0.001, currentScore * factor);

    return new Uncertainty({
      kind: priorUncertainty.kind,
      score: nextScore,
      sources: priorUncertainty.sources,
      description: `Reduced uncertainty via ${newObservationCount} new observations`
    });
  }

  static reduceByFormalProof(priorUncertainty, proofEvidence) {
    return new Uncertainty({
      kind: UncertaintyKind.OBSERVATIONAL,
      score: 0.0,
      sources: [...priorUncertainty.sources, { name: 'Formal Proof', id: proofEvidence.id }],
      description: 'Uncertainty completely eliminated by formal proof'
    });
  }
}
