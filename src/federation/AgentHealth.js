/**
 * Real-time health statistics of an agent
 */
export class AgentHealth {
  constructor({
    agentId,
    availability = 1.0,
    latencyMs = 50,
    failureRate = 0.0,
    timeoutRate = 0.0,
    determinism = 1.0,
    evidenceQuality = 0.9,
    resourceEfficiency = 0.8,
    status = 'HEALTHY',
    lastHeartbeat = Date.now()
  } = {}) {
    this.agentId = agentId;
    this.availability = Math.max(0, Math.min(1, availability));
    this.latencyMs = latencyMs;
    this.failureRate = Math.max(0, Math.min(1, failureRate));
    this.timeoutRate = Math.max(0, Math.min(1, timeoutRate));
    this.determinism = Math.max(0, Math.min(1, determinism));
    this.evidenceQuality = Math.max(0, Math.min(1, evidenceQuality));
    this.resourceEfficiency = Math.max(0, Math.min(1, resourceEfficiency));
    this.status = status;
    this.lastHeartbeat = lastHeartbeat;
    Object.freeze(this);
  }

  get isHealthy() {
    return this.status === 'HEALTHY' && this.failureRate < 0.2 && this.timeoutRate < 0.1;
  }

  get healthScore() {
    return (
      this.availability * 0.25 +
      (1 - this.failureRate) * 0.25 +
      (1 - this.timeoutRate) * 0.15 +
      this.determinism * 0.15 +
      this.evidenceQuality * 0.2
    );
  }

  toJSON() {
    return {
      agentId: this.agentId,
      availability: this.availability,
      latencyMs: this.latencyMs,
      failureRate: this.failureRate,
      timeoutRate: this.timeoutRate,
      determinism: this.determinism,
      evidenceQuality: this.evidenceQuality,
      resourceEfficiency: this.resourceEfficiency,
      status: this.status,
      lastHeartbeat: this.lastHeartbeat,
      isHealthy: this.isHealthy,
      healthScore: this.healthScore
    };
  }

  static fromJSON(json = {}) {
    return new AgentHealth(json);
  }
}
