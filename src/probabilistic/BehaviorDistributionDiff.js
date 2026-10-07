import { DistributionDiff, DistributionShiftClassification } from './DistributionDiff.js';

export class BehaviorDistributionDiff {
  /**
   * Compares two BehaviorDistribution instances (baseline vs current).
   */
  static diff(baselineDist, currentDist, significanceThreshold = 0.05) {
    if (!baselineDist || !currentDist) {
      return new DistributionDiff({
        subject: baselineDist?.subject || currentDist?.subject || 'unknown',
        classification: DistributionShiftClassification.UNKNOWN
      });
    }

    const baselineOutcomes = new Map(baselineDist.outcomes);
    const currentOutcomes = new Map(currentDist.outcomes);

    const allKeys = new Set([...baselineOutcomes.keys(), ...currentOutcomes.keys()]);
    const diffs = {};
    const newBehaviors = [];
    const disappearedBehaviors = [];
    let totalVarDist = 0.0;

    for (const key of allKeys) {
      const pBase = baselineDist.probabilityOf(key);
      const pCurr = currentDist.probabilityOf(key);
      const d = pCurr - pBase;
      diffs[key] = d;
      totalVarDist += Math.abs(d);

      if (pBase === 0 && pCurr > 0) {
        newBehaviors.push(key);
      } else if (pBase > 0 && pCurr === 0) {
        disappearedBehaviors.push(key);
      }
    }

    totalVarDist = 0.5 * totalVarDist; // TVD bounded [0, 1]
    const isSignificant = totalVarDist >= significanceThreshold;

    let classification = DistributionShiftClassification.NO_CHANGE;
    if (newBehaviors.length > 0) {
      classification = DistributionShiftClassification.NEW_BEHAVIOR;
    } else if (disappearedBehaviors.length > 0) {
      classification = DistributionShiftClassification.DISAPPEARED_BEHAVIOR;
    } else if (isSignificant) {
      classification = DistributionShiftClassification.SIGNIFICANT_SHIFT;
    } else if (totalVarDist > 0.01) {
      classification = DistributionShiftClassification.POSSIBLE_SHIFT;
    }

    return new DistributionDiff({
      subject: currentDist.subject,
      classification,
      divergenceScore: totalVarDist,
      probabilityDifferences: diffs,
      newBehaviors,
      disappearedBehaviors,
      isSignificant
    });
  }
}
