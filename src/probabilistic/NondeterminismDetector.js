import { RepeatabilityAnalyzer } from './RepeatabilityAnalyzer.js';

export const DeterminismClassification = Object.freeze({
  DETERMINISTIC: 'DETERMINISTIC',
  PROBABLY_DETERMINISTIC: 'PROBABLY_DETERMINISTIC',
  VARIABLE: 'VARIABLE',
  NONDETERMINISTIC: 'NONDETERMINISTIC',
  UNKNOWN: 'UNKNOWN'
});

export class NondeterminismDetector {
  /**
   * Evaluates repeated execution variance and classifies determinism.
   * Invariant: Timing variance alone is NOT semantic non-determinism.
   */
  static detect(variance, minRunsForCertainty = 5) {
    if (!variance || variance.runsCount === 0) {
      return {
        classification: DeterminismClassification.UNKNOWN,
        confidence: 0.0,
        explanation: 'No execution runs recorded.'
      };
    }

    if (variance.isSemanticVariance()) {
      return {
        classification: DeterminismClassification.NONDETERMINISTIC,
        confidence: Math.min(1.0, variance.runsCount / minRunsForCertainty),
        explanation: `Semantic non-determinism detected: ${variance.distinctReturnValues.length} distinct return values, ${variance.distinctExceptions.length} distinct exceptions.`
      };
    }

    if (variance.runsCount >= minRunsForCertainty) {
      return {
        classification: DeterminismClassification.DETERMINISTIC,
        confidence: Math.min(0.99, 1.0 - Math.exp(-0.2 * variance.runsCount)),
        explanation: `Consistently identical behavior across ${variance.runsCount} repeated runs.`
      };
    }

    return {
      classification: DeterminismClassification.PROBABLY_DETERMINISTIC,
      confidence: 0.6,
      explanation: `Consistent across ${variance.runsCount} runs (below certainty threshold ${minRunsForCertainty}).`
    };
  }
}
