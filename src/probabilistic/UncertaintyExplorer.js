import { UncertaintyTarget } from './UncertaintyTarget.js';
import { InformationGain } from './InformationGain.js';

export class UncertaintyExplorer {
  /**
   * Selects highest-priority exploration targets based on uncertainty reduction policy.
   * Safety invariant: Does not hardcode "lowest confidence always wins" unconditionally, considers policy.
   */
  static selectTargets(candidates = [], policy = { favorUncertaintyReduction: true }) {
    if (!candidates || candidates.length === 0) return [];

    const scored = candidates.map(c => {
      let priorityScore = 0.0;
      if (policy.favorUncertaintyReduction) {
        // High uncertainty / low confidence prioritized
        priorityScore = 0.7 * (c.uncertaintyScore || (1.0 - (c.confidenceScore || 0))) + 0.3 * (c.novelty || 0);
      } else {
        // Balance coverage & novelty
        priorityScore = 0.5 * (c.coverageGain || 0) + 0.5 * (c.novelty || 0);
      }

      return {
        target: new UncertaintyTarget({
          subject: c.subject,
          targetType: c.targetType || 'LOW_CONFIDENCE_SPEC',
          uncertaintyScore: c.uncertaintyScore || (1.0 - (c.confidenceScore || 0)),
          confidenceScore: c.confidenceScore || 0,
          rationale: `Selected for exploration with priority score ${priorityScore.toFixed(3)}`
        }),
        score: priorityScore,
        input: c.input
      };
    });

    return scored.sort((a, b) => b.score - a.score);
  }
}
