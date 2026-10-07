/**
 * LockOrderGraph.js
 * Directed graph representing Lock A -> Lock B acquisition order.
 */

export class LockOrderGraph {
  constructor() {
    /** @type {Map<string, Set<string>>} lockId -> Set of lockIds acquired while holding it */
    this.edges = new Map();
    /** @type {Map<string, Set<string>>} edgeKey "A->B" -> Set of contextIds */
    this.contextsPerEdge = new Map();
  }

  addLockOrder(lockA, lockB, contextId = null) {
    if (lockA === lockB) return;
    if (!this.edges.has(lockA)) {
      this.edges.set(lockA, new Set());
    }
    this.edges.get(lockA).add(lockB);

    const edgeKey = `${lockA}->${lockB}`;
    if (!this.contextsPerEdge.has(edgeKey)) {
      this.contextsPerEdge.set(edgeKey, new Set());
    }
    if (contextId) {
      this.contextsPerEdge.get(edgeKey).add(contextId);
    }
  }

  getDirectDependencies(lockId) {
    return Array.from(this.edges.get(lockId) || []);
  }

  getAllLocks() {
    const locks = new Set(this.edges.keys());
    for (const targets of this.edges.values()) {
      for (const target of targets) locks.add(target);
    }
    return Array.from(locks);
  }

  toJSON() {
    const serializedEdges = [];
    for (const [from, toSet] of this.edges.entries()) {
      for (const to of toSet) {
        const edgeKey = `${from}->${to}`;
        const contexts = Array.from(this.contextsPerEdge.get(edgeKey) || []);
        serializedEdges.push({ from, to, contexts });
      }
    }
    return { edges: serializedEdges };
  }
}
