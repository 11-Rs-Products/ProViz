/**
 * PerformanceMetric.js
 * Canonical metric sample and measurement representation.
 */

import { PerformancePropertyKind } from './PerformancePropertyKind.js';

export class PerformanceMetric {
  /**
   * @param {Object} options
   * @param {string} options.metricId
   * @param {string} options.property - PerformancePropertyKind
   * @param {string} [options.name='']
   * @param {string} [options.unit='ms']
   * @param {number} options.value
   * @param {number} [options.sampleCount=1]
   * @param {string} [options.workloadId='']
   * @param {string} [options.environment='default']
   * @param {number} [options.confidence=1.0]
   * @param {Array<string>} [options.provenance=[]]
   * @param {number} [options.timestamp=Date.now()]
   */
  constructor({
    metricId,
    property = PerformancePropertyKind.LATENCY,
    name = '',
    unit = 'ms',
    value,
    sampleCount = 1,
    workloadId = '',
    environment = 'default',
    confidence = 1.0,
    provenance = [],
    timestamp = Date.now()
  }) {
    if (!metricId || value === undefined) {
      throw new Error('PerformanceMetric requires metricId and value');
    }
    this.metricId = metricId;
    this.property = property;
    this.name = name || property;
    this.unit = unit;
    this.value = Number(value);
    this.sampleCount = Math.max(1, Number(sampleCount) || 1);
    this.workloadId = workloadId;
    this.environment = environment;
    this.confidence = Math.max(0.0, Math.min(1.0, Number(confidence) || 1.0));
    this.provenance = Object.freeze([...provenance]);
    this.timestamp = timestamp;
    Object.freeze(this);
  }

  toJSON() {
    return {
      metricId: this.metricId,
      property: this.property,
      name: this.name,
      unit: this.unit,
      value: this.value,
      sampleCount: this.sampleCount,
      workloadId: this.workloadId,
      environment: this.environment,
      confidence: this.confidence,
      provenance: [...this.provenance],
      timestamp: this.timestamp
    };
  }

  static fromJSON(json) {
    return new PerformanceMetric(json);
  }
}
