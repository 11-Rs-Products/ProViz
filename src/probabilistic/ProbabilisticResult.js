export class ProbabilisticResult {
  constructor({
    campaignId,
    status = 'COMPLETED',
    totalSamples = 0,
    distributions = new Map(),
    confidences = new Map(),
    anomalies = [],
    rareBehaviors = [],
    flakyTests = [],
    statisticalRegressions = [],
    stoppingReason = '',
    durationMs = 0
  }) {
    this.campaignId = campaignId;
    this.status = status;
    this.totalSamples = totalSamples;
    this.distributions = new Map(distributions);
    this.confidences = new Map(confidences);
    this.anomalies = Object.freeze([...anomalies]);
    this.rareBehaviors = Object.freeze([...rareBehaviors]);
    this.flakyTests = Object.freeze([...flakyTests]);
    this.statisticalRegressions = Object.freeze([...statisticalRegressions]);
    this.stoppingReason = stoppingReason;
    this.durationMs = durationMs;
    Object.freeze(this);
  }

  toJSON() {
    const distObj = {};
    for (const [k, v] of this.distributions.entries()) distObj[k] = v.toJSON ? v.toJSON() : v;
    const confObj = {};
    for (const [k, v] of this.confidences.entries()) confObj[k] = v.toJSON ? v.toJSON() : v;

    return {
      campaignId: this.campaignId,
      status: this.status,
      totalSamples: this.totalSamples,
      distributions: distObj,
      confidences: confObj,
      anomaliesCount: this.anomalies.length,
      rareBehaviorsCount: this.rareBehaviors.length,
      flakyTestsCount: this.flakyTests.length,
      statisticalRegressionsCount: this.statisticalRegressions.length,
      stoppingReason: this.stoppingReason,
      durationMs: this.durationMs
    };
  }
}
