import { AgentHealth } from './AgentHealth.js';

/**
 * Continuously tracks agent execution telemetry and updates health profiles
 */
export class AgentHealthMonitor {
  constructor() {
    this._healthMap = new Map();
    this._metricsHistory = new Map();
  }

  recordHeartbeat(agentId) {
    const current = this._healthMap.get(agentId) || new AgentHealth({ agentId });
    const updated = new AgentHealth({
      ...current.toJSON(),
      lastHeartbeat: Date.now(),
      status: current.failureRate > 0.4 ? 'DEGRADED' : 'HEALTHY'
    });
    this._healthMap.set(agentId, updated);
    return updated;
  }

  recordExecution(agentId, { success = true, isTimeout = false, latencyMs = 50, evidenceScore = 1.0 } = {}) {
    const history = this._metricsHistory.get(agentId) || { total: 0, failures: 0, timeouts: 0, latencies: [] };
    history.total += 1;
    if (!success) history.failures += 1;
    if (isTimeout) history.timeouts += 1;
    history.latencies.push(latencyMs);
    if (history.latencies.length > 50) history.latencies.shift();
    this._metricsHistory.set(agentId, history);

    const failureRate = history.failures / history.total;
    const timeoutRate = history.timeouts / history.total;
    const avgLatency = history.latencies.reduce((a, b) => a + b, 0) / history.latencies.length;

    let status = 'HEALTHY';
    if (failureRate > 0.5 || timeoutRate > 0.3) {
      status = 'UNHEALTHY';
    } else if (failureRate > 0.2 || timeoutRate > 0.1) {
      status = 'DEGRADED';
    }

    const health = new AgentHealth({
      agentId,
      availability: status === 'UNHEALTHY' ? 0.2 : 1.0,
      latencyMs: avgLatency,
      failureRate,
      timeoutRate,
      evidenceQuality: evidenceScore,
      status,
      lastHeartbeat: Date.now()
    });

    this._healthMap.set(agentId, health);
    return health;
  }

  getHealth(agentId) {
    return this._healthMap.get(agentId) || new AgentHealth({ agentId });
  }

  getAllHealth() {
    return Array.from(this._healthMap.values());
  }
}
