/**
 * ScalabilityAnalyzer.js
 * Analyzes scaling behavior (LINEAR, SUBLINEAR, SUPERLINEAR, SATURATING, DEGRADING) across concurrency levels.
 */

import { ScalabilityModel, ScalingBehavior } from './ScalabilityModel.js';

export class ScalabilityAnalyzer {
  /**
   * Evaluates scalability from concurrency scaling data points.
   * @param {Array<{ concurrency: number, throughput: number, latencyMs: number }>} dataPoints
   * @returns {ScalabilityModel}
   */
  analyzeScalability(dataPoints = []) {
    if (!dataPoints || dataPoints.length < 2) {
      return new ScalabilityModel({
        id: 'scale:insufficient_data',
        scalingBehavior: ScalingBehavior.UNKNOWN,
        dataPoints
      });
    }

    const sorted = [...dataPoints].sort((a, b) => a.concurrency - b.concurrency);
    const pFirst = sorted[0];
    const pLast = sorted[sorted.length - 1];

    let behavior = ScalingBehavior.LINEAR;
    let saturationPoint = 0;

    // Check if throughput dropped at high concurrency -> DEGRADING / SATURATING
    let maxThroughput = 0;
    let maxConc = 0;
    for (const p of sorted) {
      if (p.throughput > maxThroughput) {
        maxThroughput = p.throughput;
        maxConc = p.concurrency;
      }
    }

    if (pLast.throughput < maxThroughput * 0.85) {
      behavior = ScalingBehavior.DEGRADING;
      saturationPoint = maxConc;
    } else if (pLast.throughput <= maxThroughput * 1.05 && maxConc < pLast.concurrency) {
      behavior = ScalingBehavior.SATURATING;
      saturationPoint = maxConc;
    } else {
      const concRatio = pLast.concurrency / pFirst.concurrency;
      const tpRatio = pLast.throughput / (pFirst.throughput || 1);
      if (tpRatio >= concRatio * 0.9) behavior = ScalingBehavior.LINEAR;
      else if (tpRatio >= 1.2) behavior = ScalingBehavior.SUBLINEAR;
      else behavior = ScalingBehavior.SATURATING;
    }

    return new ScalabilityModel({
      id: `scale:${behavior.toLowerCase()}_${Date.now()}`,
      scalingBehavior: behavior,
      dataPoints: sorted,
      saturationPoint
    });
  }
}
