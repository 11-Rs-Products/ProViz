import { NumericOutlierDetector } from './NumericOutlierDetector.js';

export class TemporalOutlierDetector {
  static detectLatencyOutliers(temporalDistribution, thresholdZ = 3.0) {
    if (!temporalDistribution || temporalDistribution.count < 5) return [];
    const samples = temporalDistribution.empirical.samples;
    const res = NumericOutlierDetector.detectZScore(samples, thresholdZ);
    return res.outliers;
  }
}
