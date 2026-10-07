import { ExpectedInformationGain } from './ExpectedInformationGain.js';
import { ExplorationValue } from './ExplorationValue.js';

export class InformationGain {
  /**
   * Calculates Shannon entropy of a discrete probability distribution.
   */
  static entropy(probabilities = []) {
    let h = 0.0;
    for (const p of probabilities) {
      if (p > 0) {
        h -= p * Math.log2(p);
      }
    }
    return Math.max(0.0, h);
  }

  /**
   * Scores next experiment candidates based on multi-factor expected gain.
   */
  static scoreCandidate(candidate, subject, context = {}) {
    const priorEntropy = context.priorEntropy || 1.0;
    const estReduction = context.estReduction || 0.5;
    const expectedNovelty = context.novelty || 0.5;
    const coverageGain = context.coverageGain || 0.4;
    const mutationDiscrim = context.mutationDiscrim || 0.3;

    // Weight combination: uncertainty reduction (0.4), novelty (0.3), coverage (0.2), mutation (0.1)
    const overall = 0.4 * estReduction + 0.3 * expectedNovelty + 0.2 * coverageGain + 0.1 * mutationDiscrim;

    return new ExplorationValue({
      candidateInput: candidate,
      targetSubject: subject,
      expectedNovelty,
      expectedCoverageGain: coverageGain,
      expectedUncertaintyReduction: estReduction,
      expectedMutationDiscrimination: mutationDiscrim,
      overallValue: overall,
      rationale: `Ranked with expected information gain ${overall.toFixed(3)}`
    });
  }
}
