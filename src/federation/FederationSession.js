import { Federation } from './Federation.js';
import { FederationManager } from './FederationManager.js';
import { AgentHealthMonitor } from './AgentHealthMonitor.js';
import { DelegationEngine } from './DelegationEngine.js';
import { FederationEvidenceGraph } from './FederationEvidenceGraph.js';
import { FederationSnapshot } from './FederationSnapshot.js';
import { FederationQueries } from './FederationQueries.js';

/**
 * Live stateful session tracking multi-agent verification execution
 */
export class FederationSession {
  constructor({
    sessionId,
    federation = new Federation(),
    manager = null,
    healthMonitor = new AgentHealthMonitor(),
    delegationEngine = null,
    evidenceGraph = new FederationEvidenceGraph()
  } = {}) {
    this.sessionId = sessionId || `fed-session-${Math.random().toString(36).slice(2, 9)}`;
    this.federation = federation;
    this.manager = manager || new FederationManager(this.federation.registry);
    this.healthMonitor = healthMonitor;
    this.delegationEngine = delegationEngine || new DelegationEngine({ registry: this.federation.registry });
    this.evidenceGraph = evidenceGraph;

    this.tasks = [];
    this.evidence = [];
    this.conflicts = [];
    this.decisions = [];
    this.trace = [];
    this.queries = new FederationQueries(this);
  }

  addTask(task) {
    this.tasks.push(task);
    this.recordTrace('TASK_ADDED', { taskId: task.taskId, agentId: task.agentId });
    return task;
  }

  recordDecision(decision) {
    this.decisions.push(decision);
    this.recordTrace('DELEGATION_DECISION', decision.toJSON());
    return decision;
  }

  recordEvidence(ev) {
    this.evidence.push(ev);
    this.recordTrace('EVIDENCE_RECORDED', ev);
    return ev;
  }

  recordConflict(conflict) {
    this.conflicts.push(conflict);
    this.recordTrace('CONFLICT_RECORDED', conflict.toJSON ? conflict.toJSON() : conflict);
    return conflict;
  }

  recordTrace(event, data) {
    this.trace.push({
      event,
      data,
      timestamp: Date.now()
    });
  }

  createSnapshot() {
    return new FederationSnapshot({
      federation: typeof this.federation?.toJSON === 'function' ? this.federation.toJSON() : this.federation,
      tasks: this.tasks.map(t => (t.toJSON ? t.toJSON() : t)),
      evidence: [...this.evidence],
      conflicts: this.conflicts.map(c => (c.toJSON ? c.toJSON() : c)),
      decisions: this.decisions.map(d => (d.toJSON ? d.toJSON() : d)),
      health: this.healthMonitor.getAllHealth().map(h => h.toJSON())
    });
  }

  restoreSnapshot(snapshot) {
    if (!snapshot) return;
    this.tasks = snapshot.tasks ? [...snapshot.tasks] : [];
    this.evidence = snapshot.evidence ? [...snapshot.evidence] : [];
    this.conflicts = snapshot.conflicts ? [...snapshot.conflicts] : [];
    this.decisions = snapshot.decisions ? [...snapshot.decisions] : [];
    this.recordTrace('SNAPSHOT_RESTORED', { snapshotId: snapshot.snapshotId });
  }
}
