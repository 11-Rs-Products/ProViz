export class BehaviorOutlierDetector {
  static detectOutliers(behaviorProbabilities = [], rarityThreshold = 0.01) {
    return behaviorProbabilities.filter(bp => bp.estimatedProbability < rarityThreshold && bp.observedFrequency > 0);
  }
}
