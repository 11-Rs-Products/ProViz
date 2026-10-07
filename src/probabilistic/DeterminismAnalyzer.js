import { RepeatabilityAnalyzer } from './RepeatabilityAnalyzer.js';
import { NondeterminismDetector, DeterminismClassification } from './NondeterminismDetector.js';

export class DeterminismAnalyzer {
  static analyzeExecutions(subject, executions = []) {
    const variance = RepeatabilityAnalyzer.analyze(subject, executions);
    const detection = NondeterminismDetector.detect(variance);
    return {
      subject,
      variance,
      classification: detection.classification,
      confidence: detection.confidence,
      explanation: detection.explanation
    };
  }
}
