export class BehaviorClusterDistribution {
  constructor({
    observationId,
    clusterProbabilities = new Map() // clusterId -> probability
  }) {
    this.observationId = observationId;
    this.clusterProbabilities = new Map(clusterProbabilities);
    Object.freeze(this);
  }

  getProbability(clusterId) {
    return this.clusterProbabilities.get(clusterId) || 0.0;
  }

  toJSON() {
    const obj = {};
    for (const [k, v] of this.clusterProbabilities.entries()) obj[k] = v;
    return {
      observationId: this.observationId,
      probabilities: obj
    };
  }
}
