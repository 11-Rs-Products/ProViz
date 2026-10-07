/**
 * Policy and manager for quarantining unreliable or misbehaving agents
 */
export class AgentQuarantine {
  constructor({ maxFailureRate = 0.5, maxTimeoutRate = 0.3 } = {}) {
    this.maxFailureRate = maxFailureRate;
    this.maxTimeoutRate = maxTimeoutRate;
    this._quarantined = new Map();
  }

  shouldQuarantine(agentHealth) {
    if (!agentHealth) return false;
    return (
      agentHealth.failureRate >= this.maxFailureRate ||
      agentHealth.timeoutRate >= this.maxTimeoutRate ||
      agentHealth.status === 'UNHEALTHY'
    );
  }

  quarantine(agentId, reason) {
    this._quarantined.set(agentId, {
      agentId,
      reason,
      quarantinedAt: Date.now()
    });
  }

  release(agentId) {
    return this._quarantined.delete(agentId);
  }

  isQuarantined(agentId) {
    return this._quarantined.has(agentId);
  }

  getQuarantinedAgents() {
    return Array.from(this._quarantined.values());
  }
}
