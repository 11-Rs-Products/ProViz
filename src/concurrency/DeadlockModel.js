/**
 * DeadlockModel.js
 * Models wait-for graphs and resource-allocation conditions for deadlock analysis.
 */

export const DeadlockCondition = Object.freeze({
  MUTUAL_EXCLUSION: 'MUTUAL_EXCLUSION',
  HOLD_AND_WAIT: 'HOLD_AND_WAIT',
  NO_PREEMPTION: 'NO_PREEMPTION',
  CIRCULAR_WAIT: 'CIRCULAR_WAIT'
});

export class WaitForGraph {
  constructor() {
    /** @type {Map<string, Set<string>>} contextId -> Set of contextIds being waited on */
    this.edges = new Map();
    /** @type {Map<string, string>} edge "c1->c2" -> resourceId / lockId */
    this.resourceMap = new Map();
  }

  addWait(waitingContextId, holdingContextId, resourceId = null) {
    if (waitingContextId === holdingContextId) return;
    if (!this.edges.has(waitingContextId)) {
      this.edges.set(waitingContextId, new Set());
    }
    this.edges.get(waitingContextId).add(holdingContextId);
    if (resourceId) {
      this.resourceMap.set(`${waitingContextId}->${holdingContextId}`, resourceId);
    }
  }

  getContexts() {
    const contexts = new Set(this.edges.keys());
    for (const targets of this.edges.values()) {
      for (const t of targets) contexts.add(t);
    }
    return Array.from(contexts);
  }

  getWaitingOn(contextId) {
    return Array.from(this.edges.get(contextId) || []);
  }

  toJSON() {
    const edgeList = [];
    for (const [from, targets] of this.edges.entries()) {
      for (const to of targets) {
        edgeList.push({
          from,
          to,
          resourceId: this.resourceMap.get(`${from}->${to}`) || null
        });
      }
    }
    return { edges: edgeList };
  }
}
