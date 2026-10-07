import { NumericOutlierDetector } from './NumericOutlierDetector.js';
import { BehaviorOutlierDetector } from './BehaviorOutlierDetector.js';
import { TemporalOutlierDetector } from './TemporalOutlierDetector.js';

export class OutlierDetector {
  static detectNumericIQR(samples, k = 1.5) {
    return NumericOutlierDetector.detectIQR(samples, k);
  }

  static detectNumericZScore(samples, threshold = 3.0) {
    return NumericOutlierDetector.detectZScore(samples, threshold);
  }

  static detectBehaviorOutliers(probabilities, rarityThreshold = 0.01) {
    return BehaviorOutlierDetector.detectOutliers(probabilities, rarityThreshold);
  }

  static detectLatencyOutliers(temporalDist, thresholdZ = 3.0) {
    return TemporalOutlierDetector.detectLatencyOutliers(temporalDist, thresholdZ);
  }
}
