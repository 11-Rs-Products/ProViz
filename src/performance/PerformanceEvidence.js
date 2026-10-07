/**
 * PerformanceEvidence.js
 * Immutable evidence supporting performance and resource conclusions:
 * STATIC_ANALYSIS, SYMBOLIC_BOUND, PROFILE, BENCHMARK, STRESS_TEST, FAULT_INJECTION, REGRESSION_COMPARISON, RESOURCE_MEASUREMENT.
 */

export const PerformanceEvidenceType = Object.freeze({
  STATIC_ANALYSIS: 'STATIC_ANALYSIS',
  SYMBOLIC_BOUND: 'SYMBOLIC_BOUND',
  PROFILE: 'PROFILE',
  BENCHMARK: 'BENCHMARK',
  STRESS_TEST: 'STRESS_TEST',
  FAULT_INJECTION: 'FAULT_INJECTION',
  REGRESSION_COMPARISON: 'REGRESSION_COMPARISON',
  RESOURCE_MEASUREMENT: 'RESOURCE_MEASUREMENT'
});

export class PerformanceEvidence {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {string} options.type - PerformanceEvidenceType
   * @param {string} options.targetProperty
   * @param {boolean} options.provesGoal
   * @param {number} [options.confidence=0.95]
   * @param {string} [options.summary='']
   * @param {Object} [options.details={}]
   * @param {number} [options.timestamp=Date.now()]
   */
  constructor({
    id,
    type = PerformanceEvidenceType.BENCHMARK,
    targetProperty,
    provesGoal = true,
    confidence = 0.95,
    summary = '',
    details = {},
    timestamp = Date.now()
  }) {
    if (!id || !targetProperty) {
      throw new Error('PerformanceEvidence requires id and targetProperty');
    }
    this.id = id;
    this.type = type;
    this.targetProperty = targetProperty;
    this.provesGoal = Boolean(provesGoal);
    this.confidence = Math.max(0.0, Math.min(1.0, Number(confidence) || 0.95));
    this.summary = summary || `Performance evidence: ${type}`;
    this.details = Object.freeze({ ...details });
    this.timestamp = timestamp;
    Object.freeze(this);
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      targetProperty: this.targetProperty,
      provesGoal: this.provesGoal,
      confidence: this.confidence,
      summary: this.summary,
      details: { ...this.details },
      timestamp: this.timestamp
    };
  }

  static fromJSON(json) {
    return new PerformanceEvidence(json);
  }
}
