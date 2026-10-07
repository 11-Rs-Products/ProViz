import { BehaviorDistributionDiff } from './BehaviorDistributionDiff.js';

export class BehaviorShiftDetector {
  static detect(baselineDist, currentDist, threshold = 0.05) {
    const diff = BehaviorDistributionDiff.diff(baselineDist, currentDist, threshold);
    return {
      hasShift: diff.isSignificant,
      diff,
      explanation: diff.isSignificant
        ? `Behavioral shift detected: ${diff.classification} (Divergence: ${(diff.divergenceScore * 100).toFixed(1)}%)`
        : 'Behavioral distribution is consistent with baseline.'
    };
  }
}
