/**
 * Multi-objective optimizer for federated verification workloads
 */
export class FederationOptimizer {
  static computeUtility({
    informationGain = 0.8,
    riskReduction = 0.9,
    evidenceQuality = 0.85,
    cost = 0.1,
    latency = 0.1,
    weights = {}
  }) {
    const wInfo = weights.informationGain ?? 1.5;
    const wRisk = weights.riskReduction ?? 2.0;
    const wQuality = weights.evidenceQuality ?? 1.8;
    const wCost = weights.cost ?? 0.5;
    const wLatency = weights.latency ?? 0.4;

    return (
      wInfo * informationGain +
      wRisk * riskReduction +
      wQuality * evidenceQuality -
      wCost * cost -
      wLatency * latency
    );
  }

  static optimizeSchedule(tasks = [], availableAgents = [], constraints = {}) {
    const assignments = [];

    // Sort tasks by priority descending
    const sortedTasks = [...tasks].sort((a, b) => (b.priority || 10) - (a.priority || 10));

    for (const task of sortedTasks) {
      let bestAgent = null;
      let maxUtil = -Infinity;

      for (const agent of availableAgents) {
        if (!agent.isAvailable()) continue;
        if (!agent.capabilities.matches(task.inputPayload)) continue;

        const util = this.computeUtility({
          informationGain: 0.8,
          riskReduction: task.priority / 10.0,
          evidenceQuality: agent.trustProfile.evidenceQuality,
          cost: (agent.resourceProfile.costPerOp || 1) / 10.0,
          latency: (agent.resourceProfile.avgLatencyMs || 50) / 1000.0
        });

        if (util > maxUtil) {
          maxUtil = util;
          bestAgent = agent;
        }
      }

      assignments.push({
        taskId: task.taskId,
        assignedAgentId: bestAgent ? bestAgent.agentId : task.agentId,
        utility: maxUtil > -Infinity ? maxUtil : 0.0
      });
    }

    return assignments;
  }
}
