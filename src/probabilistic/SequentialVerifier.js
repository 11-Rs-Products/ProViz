import { SequentialEvidenceAnalyzer } from './SequentialEvidenceAnalyzer.js';
import { EarlyStoppingPolicy } from './EarlyStoppingPolicy.js';

export class SequentialVerifier {
  constructor(policy = new EarlyStoppingPolicy()) {
    this.policy = policy;
    this.analyzer = new SequentialEvidenceAnalyzer(policy);
  }

  verifyStream(sampleGenerator, evaluatorFn) {
    let sampleCount = 0;
    let passes = 0;
    let fails = 0;
    let stoppedEarly = false;
    let stoppingReason = '';

    while (true) {
      const sample = sampleGenerator();
      if (!sample) break;

      sampleCount++;
      const passed = evaluatorFn(sample);
      if (passed) passes++;
      else fails++;

      const confScore = passes / (sampleCount + 1);
      const state = {
        sampleCount,
        confidenceScore: confScore,
        counterexamplesCount: fails
      };

      const check = this.analyzer.evaluate(state);
      if (check.stop) {
        stoppedEarly = true;
        stoppingReason = check.reason;
        break;
      }
    }

    return {
      sampleCount,
      passes,
      fails,
      stoppedEarly,
      stoppingReason
    };
  }
}
