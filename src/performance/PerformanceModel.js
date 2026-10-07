/**
 * PerformanceModel.js
 * Immutable performance model capturing operational expectations, baselines, and resource bounds.
 */

import { WorkloadModel } from './WorkloadModel.js';
import { PerformanceBaseline } from './PerformanceBaseline.js';
import { PerformanceThreshold } from './PerformanceThreshold.js';

export class PerformanceModel {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {string} [options.name='']
   * @param {Array<WorkloadModel>} [options.workloads=[]]
   * @param {Array<PerformanceBaseline>} [options.baselines=[]]
   * @param {Array<PerformanceThreshold>} [options.thresholds=[]]
   * @param {Object} [options.scalingModel={}]
   * @param {Object} [options.reliabilityModel={}]
   * @param {Array<string>} [options.provenance=[]]
   * @param {Object} [options.metadata={}]
   */
  constructor({
    id,
    name = '',
    workloads = [],
    baselines = [],
    thresholds = [],
    scalingModel = {},
    reliabilityModel = {},
    provenance = [],
    metadata = {}
  }) {
    if (!id) throw new Error('PerformanceModel requires id');
    this.id = id;
    this.name = name || id;
    this.workloads = Object.freeze(workloads.map(w => w instanceof WorkloadModel ? w : new WorkloadModel(w)));
    this.baselines = Object.freeze(baselines.map(b => b instanceof PerformanceBaseline ? b : new PerformanceBaseline(b)));
    this.thresholds = Object.freeze(thresholds.map(t => t instanceof PerformanceThreshold ? t : new PerformanceThreshold(t)));
    this.scalingModel = Object.freeze({ ...scalingModel });
    this.reliabilityModel = Object.freeze({ ...reliabilityModel });
    this.provenance = Object.freeze([...provenance]);
    this.metadata = Object.freeze({ ...metadata });
    Object.freeze(this);
  }

  getWorkload(id) {
    return this.workloads.find(w => w.id === id) || null;
  }

  getBaseline(id) {
    return this.baselines.find(b => b.id === id) || null;
  }

  getThreshold(id) {
    return this.thresholds.find(t => t.id === id) || null;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      workloads: this.workloads.map(w => w.toJSON()),
      baselines: this.baselines.map(b => b.toJSON()),
      thresholds: this.thresholds.map(t => t.toJSON()),
      scalingModel: { ...this.scalingModel },
      reliabilityModel: { ...this.reliabilityModel },
      provenance: [...this.provenance],
      metadata: { ...this.metadata }
    };
  }

  static fromJSON(json) {
    return new PerformanceModel(json);
  }
}
