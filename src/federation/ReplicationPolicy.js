/**
 * Replication policies for high-risk verification properties
 */
export const ReplicationPolicy = Object.freeze({
  NONE: 'NONE',
  ON_FAILURE: 'ON_FAILURE',
  HIGH_RISK: 'HIGH_RISK',
  FORMAL_CONFIRMATION: 'FORMAL_CONFIRMATION',
  RANDOM_AUDIT: 'RANDOM_AUDIT',
  FULL_REPLICATION: 'FULL_REPLICATION'
});

export class ReplicationPlanner {
  static planReplication(task, policy = ReplicationPolicy.NONE, availableAgents = []) {
    if (policy === ReplicationPolicy.NONE) {
      return [];
    }

    const capableAgents = availableAgents.filter(a => a.agentId !== task.agentId && a.isAvailable());

    if (policy === ReplicationPolicy.FULL_REPLICATION) {
      return capableAgents.map(agent => ({
        taskId: `${task.taskId}-rep-${agent.agentId}`,
        replicatedFrom: task.taskId,
        agentId: agent.agentId,
        purpose: 'FULL_INDEPENDENT_AUDIT'
      }));
    }

    if (policy === ReplicationPolicy.HIGH_RISK || policy === ReplicationPolicy.FORMAL_CONFIRMATION) {
      const replicas = capableAgents.slice(0, 2);
      return replicas.map(agent => ({
        taskId: `${task.taskId}-rep-${agent.agentId}`,
        replicatedFrom: task.taskId,
        agentId: agent.agentId,
        purpose: 'HIGH_RISK_CONFIRMATION'
      }));
    }

    if (policy === ReplicationPolicy.RANDOM_AUDIT && capableAgents.length > 0) {
      const selected = capableAgents[0];
      return [{
        taskId: `${task.taskId}-audit-${selected.agentId}`,
        replicatedFrom: task.taskId,
        agentId: selected.agentId,
        purpose: 'RANDOM_AUDIT'
      }];
    }

    return [];
  }
}
