import { RiskFactor } from './RiskFactor.js';
import { RiskModel } from './RiskModel.js';

export class RiskAnalyzer {
  static analyzeSubject(subject, context = {}) {
    const factors = [];

    if (context.confidenceScore !== undefined && context.confidenceScore < 0.7) {
      factors.push(
        new RiskFactor({
          name: 'LOW_CONFIDENCE',
          score: 1.0 - context.confidenceScore,
          weight: 1.5,
          description: `Confidence is ${(context.confidenceScore * 100).toFixed(1)}%`
        })
      );
    }

    if (context.hasRegression) {
      factors.push(
        new RiskFactor({
          name: 'REGRESSION_HISTORY',
          score: 0.9,
          weight: 2.0,
          description: 'Recent regression detected'
        })
      );
    }

    if (context.survivingMutantsCount > 0) {
      factors.push(
        new RiskFactor({
          name: 'MUTATION_SURVIVOR',
          score: Math.min(1.0, 0.3 * context.survivingMutantsCount),
          weight: 1.2,
          description: `${context.survivingMutantsCount} surviving mutants detected`
        })
      );
    }

    if (context.hasConflicts) {
      factors.push(
        new RiskFactor({
          name: 'SPECIFICATION_CONFLICT',
          score: 0.85,
          weight: 1.8,
          description: 'Conflicting specification / observation evidence'
        })
      );
    }

    return RiskModel.evaluate(subject, factors);
  }
}
