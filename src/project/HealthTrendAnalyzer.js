/**
 * HealthTrendAnalyzer.js
 * Compares past health snapshots to evaluate health trajectory and dimension shifts.
 */

import { HealthTrend } from './HealthTrend.js';

export class HealthTrendAnalyzer {
  /**
   * @param {import('./EngineeringHealth.js').EngineeringHealth} previousHealth
   * @param {import('./EngineeringHealth.js').EngineeringHealth} currentHealth
   */
  compare(previousHealth, currentHealth) {
    if (!previousHealth || !currentHealth) {
      throw new Error('HealthTrendAnalyzer requires previousHealth and currentHealth');
    }

    const prevScore = previousHealth.getCompositeScore();
    const currScore = currentHealth.getCompositeScore();
    const delta = currScore - prevScore;

    const dimensionDeltas = {};
    const improvingDimensions = [];
    const degradingDimensions = [];

    for (const [dim, currVal] of Object.entries(currentHealth.dimensions)) {
      const prevVal = previousHealth.getScore(dim);
      const diff = Number((currVal - prevVal).toFixed(4));
      dimensionDeltas[dim] = diff;
      if (diff > 0.01) improvingDimensions.push(dim);
      else if (diff < -0.01) degradingDimensions.push(dim);
    }

    let direction = 'STABLE';
    if (delta > 0.02) direction = 'IMPROVING';
    else if (delta < -0.02) direction = 'DEGRADING';

    return new HealthTrend({
      direction,
      delta,
      dimensionDeltas,
      improvingDimensions,
      degradingDimensions,
      timestamp: Date.now()
    });
  }
}
