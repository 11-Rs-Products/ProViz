import { VerificationRiskModel } from './VerificationRiskModel.js';

export class RiskPrioritizer {
  /**
   * Prioritizes subjects by composite risk score.
   */
  static prioritize(subjects = [], factorMap = new Map()) {
    const scored = subjects.map(sub => {
      const factors = factorMap.get(sub) || {};
      const evalRes = VerificationRiskModel.evaluateSubjectRisk(sub, factors);
      return evalRes;
    });

    return scored.sort((a, b) => b.riskScore - a.riskScore);
  }
}
