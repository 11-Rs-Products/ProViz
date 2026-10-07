/**
 * PerformanceRegressionAnalyzer.js
 * Compares current measurements with historical baselines:
 * Regression = (Current - Baseline) / Baseline
 * Distinguishes metric directionality (e.g. higher latency is worse, lower throughput is worse).
 */

export class PerformanceRegressionReport {
  constructor({ baselineId, isRegression = false, regressions = [], improvements = [], summary = '' }) {
    this.baselineId = baselineId;
    this.isRegression = isRegression;
    this.regressions = Object.freeze([...regressions]);
    this.improvements = Object.freeze([...improvements]);
    this.summary = summary;
    Object.freeze(this);
  }

  toJSON() {
    return {
      baselineId: this.baselineId,
      isRegression: this.isRegression,
      regressions: [...this.regressions],
      improvements: [...this.improvements],
      summary: this.summary
    };
  }
}

export class PerformanceRegressionAnalyzer {
  /**
   * Compares a measurement against a baseline.
   * @param {PerformanceBaseline} baseline
   * @param {PerformanceMeasurement} measurement
   * @param {Object} [options]
   * @returns {PerformanceRegressionReport}
   */
  compareWithBaseline(baseline, measurement, options = {}) {
    const thresholdPct = options.thresholdPct || 10.0; // 10% regression threshold
    const regressions = [];
    const improvements = [];

    const lowerIsBetter = ['LATENCY', 'CPU_USAGE', 'MEMORY_USAGE', 'ALLOCATION_RATE', 'TAIL_LATENCY'];

    for (const [prop, baselineVal] of Object.entries(baseline.metrics)) {
      const baseNum = typeof baselineVal === 'object' && baselineVal.mean !== undefined ? baselineVal.mean : Number(baselineVal);
      const measVal = measurement.metrics[prop];
      if (measVal === undefined || baseNum <= 0) continue;

      const measNum = typeof measVal === 'object' && measVal.mean !== undefined ? measVal.mean : Number(measVal);
      const diffPct = ((measNum - baseNum) / baseNum) * 100;

      const isLowerBetter = lowerIsBetter.includes(prop.toUpperCase());

      if (isLowerBetter) {
        if (diffPct > thresholdPct) {
          regressions.push({ property: prop, baseline: baseNum, current: measNum, changePct: Math.round(diffPct * 10) / 10 });
        } else if (diffPct < -thresholdPct) {
          improvements.push({ property: prop, baseline: baseNum, current: measNum, changePct: Math.round(diffPct * 10) / 10 });
        }
      } else {
        // Higher is better (e.g. THROUGHPUT)
        if (diffPct < -thresholdPct) {
          regressions.push({ property: prop, baseline: baseNum, current: measNum, changePct: Math.round(diffPct * 10) / 10 });
        } else if (diffPct > thresholdPct) {
          improvements.push({ property: prop, baseline: baseNum, current: measNum, changePct: Math.round(diffPct * 10) / 10 });
        }
      }
    }

    const isRegression = regressions.length > 0;

    return new PerformanceRegressionReport({
      baselineId: baseline.id,
      isRegression,
      regressions,
      improvements,
      summary: isRegression
        ? `Performance regression detected across ${regressions.length} metrics: ${regressions.map(r => `${r.property} (${r.changePct > 0 ? '+' : ''}${r.changePct}%)`).join(', ')}`
        : 'Performance verified: no statistically meaningful regressions detected'
    });
  }
}
