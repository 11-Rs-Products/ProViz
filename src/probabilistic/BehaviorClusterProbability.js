export class BehaviorClusterProbability {
  constructor({
    clusterId,
    observationId,
    probability = 0.0
  }) {
    this.clusterId = clusterId;
    this.observationId = observationId;
    this.probability = probability;
    Object.freeze(this);
  }

  toJSON() {
    return {
      clusterId: this.clusterId,
      observationId: this.observationId,
      probability: this.probability
    };
  }
}
