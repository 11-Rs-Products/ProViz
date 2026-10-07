import { ProbabilisticEngine } from './ProbabilisticEngine.js';

export class ProbabilisticAnalyzer {
  constructor(engine = new ProbabilisticEngine()) {
    this.engine = engine;
  }

  analyzeSubject(subject) {
    const distribution = this.engine.getBehaviorDistribution(subject);
    const confidence = this.engine.calibrateConfidence(subject);
    const risk = this.engine.getOverallRisk(subject);
    return {
      subject,
      distribution,
      confidence,
      risk
    };
  }
}
