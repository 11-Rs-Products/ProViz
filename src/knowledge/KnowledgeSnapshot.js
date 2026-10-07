/**
 * Deterministic immutable snapshot of the verification knowledge graph
 */
export class KnowledgeSnapshot {
  constructor({
    snapshotId,
    timestamp = Date.now(),
    entities = [],
    edges = [],
    metadata = {}
  } = {}) {
    this.snapshotId = snapshotId || `know-snap-${Math.random().toString(36).slice(2, 9)}`;
    this.timestamp = timestamp;
    this.entities = Object.freeze([...entities]);
    this.edges = Object.freeze([...edges]);
    this.metadata = Object.freeze({ ...metadata });
    Object.freeze(this);
  }

  toJSON() {
    return {
      snapshotId: this.snapshotId,
      timestamp: this.timestamp,
      entities: this.entities.map(e => (typeof e.toJSON === 'function' ? e.toJSON() : e)),
      edges: this.edges.map(e => (typeof e.toJSON === 'function' ? e.toJSON() : e)),
      metadata: { ...this.metadata }
    };
  }

  static fromJSON(json = {}) {
    return new KnowledgeSnapshot(json);
  }
}

/**
 * Computes semantic diff between two knowledge snapshots
 */
export class KnowledgeDiff {
  static diff(snapA, snapB) {
    const mapAEntities = new Map((snapA?.entities || []).map(e => [e.id, e]));
    const mapBEntities = new Map((snapB?.entities || []).map(e => [e.id, e]));
    const mapAEdges = new Map((snapA?.edges || []).map(e => [e.id, e]));
    const mapBEdges = new Map((snapB?.edges || []).map(e => [e.id, e]));

    const entitiesAdded = [];
    const entitiesRemoved = [];
    const edgesAdded = [];
    const edgesRemoved = [];

    for (const [id, e] of mapBEntities.entries()) {
      if (!mapAEntities.has(id)) entitiesAdded.push(e);
    }
    for (const [id, e] of mapAEntities.entries()) {
      if (!mapBEntities.has(id)) entitiesRemoved.push(e);
    }
    for (const [id, e] of mapBEdges.entries()) {
      if (!mapAEdges.has(id)) edgesAdded.push(e);
    }
    for (const [id, e] of mapAEdges.entries()) {
      if (!mapBEdges.has(id)) edgesRemoved.push(e);
    }

    return {
      entitiesAdded,
      entitiesRemoved,
      edgesAdded,
      edgesRemoved,
      hasChanges: (entitiesAdded.length + entitiesRemoved.length + edgesAdded.length + edgesRemoved.length) > 0
    };
  }
}
