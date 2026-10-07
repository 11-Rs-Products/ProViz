export class BehaviorHealth {
  constructor({
    subject,
    anomaliesCount = 0,
    rareBehaviorsCount = 0,
    shiftsCount = 0,
    isHealthy = true
  }) {
    this.subject = subject;
    this.anomaliesCount = anomaliesCount;
    this.rareBehaviorsCount = rareBehaviorsCount;
    this.shiftsCount = shiftsCount;
    this.isHealthy = isHealthy;
    Object.freeze(this);
  }

  toJSON() {
    return {
      subject: this.subject,
      anomaliesCount: this.anomaliesCount,
      rareBehaviorsCount: this.rareBehaviorsCount,
      shiftsCount: this.shiftsCount,
      isHealthy: this.isHealthy
    };
  }
}
