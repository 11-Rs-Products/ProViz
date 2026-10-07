export class ConfidenceDependency {
  constructor({
    sourceId,
    targetId,
    weight = 1.0,
    impactFactor = 1.0
  }) {
    this.sourceId = sourceId;
    this.targetId = targetId;
    this.weight = weight;
    this.impactFactor = impactFactor;
    Object.freeze(this);
  }

  toJSON() {
    return {
      sourceId: this.sourceId,
      targetId: this.targetId,
      weight: this.weight,
      impactFactor: this.impactFactor
    };
  }
}
