/**
 * RecommendationRanker.js
 * Multi-criteria ranking of ProjectRecommendations based on priorityScore, confidence, cost, and risk.
 */

import { ProjectRecommendation } from './ProjectRecommendation.js';

export class RecommendationRanker {
  /**
   * Rank recommendations
   * @param {ProjectRecommendation[]} recommendations
   * @param {Object} [weights={}]
   */
  rank(recommendations, weights = {}) {
    const list = [...recommendations];
    const {
      confidenceWeight = 1.0,
      costWeight = 1.0,
      riskPenaltyWeight = 1.0
    } = weights;

    list.sort((a, b) => {
      // Risk penalty factor
      const getRiskPenalty = (r) => r === 'CRITICAL' ? 0.3 : r === 'HIGH' ? 0.6 : r === 'MEDIUM' ? 0.8 : 1.0;
      const scoreA = ((a.confidence * confidenceWeight * 10) / Math.max(0.5, (a.estimatedCost + a.verificationCost) * costWeight)) * getRiskPenalty(a.risk);
      const scoreB = ((b.confidence * confidenceWeight * 10) / Math.max(0.5, (b.estimatedCost + b.verificationCost) * costWeight)) * getRiskPenalty(b.risk);

      return scoreB - scoreA;
    });

    return list;
  }
}
