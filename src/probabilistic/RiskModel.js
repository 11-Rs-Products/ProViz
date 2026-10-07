import { RiskFactor } from './RiskFactor.js';
import { RiskExplanation } from './RiskExplanation.js';
import { BehaviorRisk } from './BehaviorRisk.js';

export class RiskModel {
  /**
   * Computes composite weighted risk score from explicit risk factors.
   */
  static evaluate(subject, factors = []) {
    if (!factors || factors.length === 0) {
      return new BehaviorRisk({ subject, compositeScore: 0.0, level: 'LOW', factors: [] });
    }

    let totalWeight = 0;
    let weightedSum = 0;

    for (const f of factors) {
      weightedSum += f.score * f.weight;
      totalWeight += f.weight;
    }

    const compositeScore = totalWeight > 0 ? weightedSum / totalWeight : 0.0;
    let level = 'LOW';
    if (compositeScore >= 0.75) level = 'CRITICAL';
    else if (compositeScore >= 0.50) level = 'HIGH';
    else if (compositeScore >= 0.25) level = 'MEDIUM';

    const sortedFactors = [...factors].sort((a, b) => (b.score * b.weight) - (a.score * a.weight));
    const explanation = new RiskExplanation({
      subject,
      compositeRiskScore: compositeScore,
      riskLevel: level,
      topFactors: sortedFactors.slice(0, 3),
      summary: `Risk level ${level} (${compositeScore.toFixed(3)}) driven by ${sortedFactors[0]?.name || 'unknown'}`
    });

    return new BehaviorRisk({
      subject,
      compositeScore,
      level,
      factors,
      explanation
    });
  }
}
