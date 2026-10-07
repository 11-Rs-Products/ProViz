/**
 * Declarative Knowledge Query
 */
export class KnowledgeQuery {
  constructor({
    queryKind = 'FIND_NEIGHBORS', // FIND_NEIGHBORS, FIND_EVIDENCE, FIND_CAUSES, FIND_IMPACT, FIND_PATH, FIND_GAPS
    targetEntityId,
    relation = null,
    entityKind = null,
    maxDepth = 10,
    maxResults = 100,
    predicates = []
  } = {}) {
    this.queryKind = queryKind;
    this.targetEntityId = targetEntityId;
    this.relation = relation;
    this.entityKind = entityKind;
    this.maxDepth = maxDepth;
    this.maxResults = maxResults;
    this.predicates = Object.freeze([...predicates]);
    Object.freeze(this);
  }

  toJSON() {
    return {
      queryKind: this.queryKind,
      targetEntityId: this.targetEntityId,
      relation: this.relation,
      entityKind: this.entityKind,
      maxDepth: this.maxDepth,
      maxResults: this.maxResults
    };
  }
}

/**
 * Executes declarative graph queries with bounded query budgets and indexed retrieval
 */
export class KnowledgeQueryEngine {
  constructor(knowledgeGraph) {
    this.knowledgeGraph = knowledgeGraph;
  }

  executeQuery(query) {
    const q = query instanceof KnowledgeQuery ? query : new KnowledgeQuery(query);

    switch (q.queryKind) {
      case 'FIND_NEIGHBORS': {
        const neighbors = this.knowledgeGraph.getNeighbors(q.targetEntityId, { relation: q.relation });
        return neighbors.slice(0, q.maxResults);
      }

      case 'FIND_EVIDENCE': {
        const ancestors = this.knowledgeGraph.getAncestors(q.targetEntityId, { maxDepth: q.maxDepth });
        return ancestors.filter(a => a.kind === 'EVIDENCE' || a.kind === 'PROOF').slice(0, q.maxResults);
      }

      case 'FIND_CAUSES': {
        const ancestors = this.knowledgeGraph.getAncestors(q.targetEntityId, { relation: 'CAUSES', maxDepth: q.maxDepth });
        return ancestors.slice(0, q.maxResults);
      }

      case 'FIND_IMPACT': {
        const descendants = this.knowledgeGraph.getDescendants(q.targetEntityId, { maxDepth: q.maxDepth });
        return descendants.slice(0, q.maxResults);
      }

      case 'FIND_BY_KIND': {
        const entities = this.knowledgeGraph.getEntitiesByKind(q.entityKind);
        return entities.slice(0, q.maxResults);
      }

      default:
        return [];
    }
  }
}
