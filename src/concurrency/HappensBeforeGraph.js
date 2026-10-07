/**
 * HappensBeforeGraph.js
 * Transitive execution-order graph computing A ->_HB B and concurrency queries.
 */

export class HappensBeforeGraph {
  constructor() {
    /** @type {Map<string, Set<string>>} Direct edges eventA -> Set<eventB> */
    this.edges = new Map();
    /** @type {Map<string, import('./HappensBeforeRelation.js').HappensBeforeRelation>} */
    this.relations = new Map();
    /** @type {Set<string>} All event IDs */
    this.events = new Set();
    /** @type {Map<string, Set<string>>|null} Transitive closure cache */
    this._reachability = null;
  }

  addEvent(eventId) {
    this.events.add(eventId);
    if (!this.edges.has(eventId)) {
      this.edges.set(eventId, new Set());
    }
  }

  addRelation(relation) {
    const { fromEventId, toEventId } = relation;
    this.addEvent(fromEventId);
    this.addEvent(toEventId);

    this.edges.get(fromEventId).add(toEventId);
    this.relations.set(`${fromEventId}->${toEventId}`, relation);
    this._reachability = null; // Invalidate cache
  }

  addEdge(fromId, toId, kind = 'PROGRAM_ORDER') {
    this.addEvent(fromId);
    this.addEvent(toId);
    this.edges.get(fromId).add(toId);
    this._reachability = null;
  }

  _computeReachability() {
    if (this._reachability !== null) return this._reachability;
    
    const reach = new Map();
    for (const ev of this.events) {
      reach.set(ev, new Set());
    }

    // Direct edges
    for (const [from, targets] of this.edges.entries()) {
      const fromSet = reach.get(from);
      for (const t of targets) {
        fromSet.add(t);
      }
    }

    // Warshall-like transitive closure / BFS per node
    for (const start of this.events) {
      const visited = reach.get(start);
      const queue = Array.from(visited);
      const seen = new Set(queue);

      while (queue.length > 0) {
        const curr = queue.shift();
        const neighbors = this.edges.get(curr) || [];
        for (const n of neighbors) {
          if (!seen.has(n)) {
            seen.add(n);
            visited.add(n);
            queue.push(n);
          }
        }
      }
    }

    this._reachability = reach;
    return reach;
  }

  happensBefore(eventA, eventB) {
    if (eventA === eventB) return false;
    const reach = this._computeReachability();
    const reachableFromA = reach.get(eventA);
    return reachableFromA ? reachableFromA.has(eventB) : false;
  }

  areConcurrent(eventA, eventB) {
    if (eventA === eventB) return false;
    return !this.happensBefore(eventA, eventB) && !this.happensBefore(eventB, eventA);
  }

  getAllEvents() {
    return Array.from(this.events);
  }

  toJSON() {
    const edgeList = [];
    for (const [from, toSet] of this.edges.entries()) {
      for (const to of toSet) {
        const rel = this.relations.get(`${from}->${to}`);
        edgeList.push({
          from,
          to,
          kind: rel ? rel.kind : 'CUSTOM'
        });
      }
    }
    return {
      eventCount: this.events.size,
      edges: edgeList
    };
  }
}
