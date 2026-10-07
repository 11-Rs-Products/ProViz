/**
 * ScalabilityModel.js
 * Models scalability characteristics across scaling workloads: Throughput(n), Latency(n), Memory(n), CPU(n).
 */

export const ScalingBehavior = Object.freeze({
  LINEAR: 'LINEAR',
  SUBLINEAR: 'SUBLINEAR',
  SUPERLINEAR: 'SUPERLINEAR',
  SATURATING: 'SATURATING',
  DEGRADING: 'DEGRADING',
  UNBOUNDED: 'UNBOUNDED',
  UNKNOWN: 'UNKNOWN'
});

export class ScalabilityModel {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {string} options.scalingBehavior - ScalingBehavior
   * @param {Array<{ concurrency: number, throughput: number, latencyMs: number }>} [options.dataPoints=[]]
   * @param {number} [options.saturationPoint=0]
   */
  constructor({
    id,
    scalingBehavior = ScalingBehavior.LINEAR,
    dataPoints = [],
    saturationPoint = 0
  }) {
    if (!id) throw new Error('ScalabilityModel requires id');
    this.id = id;
    this.scalingBehavior = scalingBehavior;
    this.dataPoints = Object.freeze([...dataPoints]);
    this.saturationPoint = saturationPoint;
    Object.freeze(this);
  }

  toJSON() {
    return {
      id: this.id,
      scalingBehavior: this.scalingBehavior,
      dataPoints: [...this.dataPoints],
      saturationPoint: this.saturationPoint
    };
  }

  static fromJSON(json) {
    return new ScalabilityModel(json);
  }
}
