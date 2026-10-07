/**
 * Query utilities for querying federated verification state
 */
export class FederationQueries {
  constructor(session) {
    this.session = session;
  }

  getAgentsByKind(kind) {
    return this.session.federation.registry.getAgents().filter(a => a.kind === kind);
  }

  getHealthyAgents() {
    return this.session.federation.registry.getAgents().filter(a => a.isAvailable());
  }

  getQuarantinedAgents() {
    return this.session.federation.registry.getAgents().filter(a => a.isQuarantined());
  }

  getCompletedTasks() {
    return this.session.tasks.filter(t => t.status === 'COMPLETED');
  }

  getFailedTasks() {
    return this.session.tasks.filter(t => t.status === 'FAILED');
  }

  getConflicts() {
    return [...this.session.conflicts];
  }

  getDecisionsForGoal(goalId) {
    return this.session.decisions.filter(d => d.goalId === goalId);
  }
}
