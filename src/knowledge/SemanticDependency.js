/**
 * Explicit semantic dependency representation
 */
export class SemanticDependency {
  constructor({
    sourceEntityId,
    targetEntityId,
    dependencyKind = 'ASSUMPTION', // ASSUMPTION, TEST_VALIDATION, CONTRACT_REQUIREMENT, REPAIR_EFFECT, MUTATION_WEAKNESS
    description = '',
    criticality = 'HIGH'
  } = {}) {
    this.sourceEntityId = sourceEntityId;
    this.targetEntityId = targetEntityId;
    this.dependencyKind = dependencyKind;
    this.description = description;
    this.criticality = criticality;
    Object.freeze(this);
  }

  toJSON() {
    return {
      sourceEntityId: this.sourceEntityId,
      targetEntityId: this.targetEntityId,
      dependencyKind: this.dependencyKind,
      description: this.description,
      criticality: this.criticality
    };
  }
}

/**
 * Analyzes deep semantic dependencies across proofs, contracts, tests, mutations, and repairs
 */
export class SemanticDependencyAnalyzer {
  constructor(knowledgeGraph) {
    this.knowledgeGraph = knowledgeGraph;
  }

  findDependencies(entityId) {
    const dependencies = [];
    const incoming = this.knowledgeGraph.getIncomingEdges(entityId);
    const outgoing = this.knowledgeGraph.getOutgoingEdges(entityId);

    for (const edge of incoming) {
      dependencies.push(new SemanticDependency({
        sourceEntityId: edge.source,
        targetEntityId: entityId,
        dependencyKind: edge.relation,
        description: `Entity '${entityId}' ${edge.relation.toLowerCase()} '${edge.source}'`
      }));
    }

    for (const edge of outgoing) {
      dependencies.push(new SemanticDependency({
        sourceEntityId: entityId,
        targetEntityId: edge.target,
        dependencyKind: edge.relation,
        description: `Entity '${entityId}' leads via ${edge.relation.toLowerCase()} to '${edge.target}'`
      }));
    }

    return dependencies;
  }

  getProofAssumptions(proofEntityId) {
    const ancestors = this.knowledgeGraph.getAncestors(proofEntityId, { maxDepth: 10 });
    return ancestors.filter(a => a.kind === 'CONTRACT' || a.kind === 'INVARIANT' || a.kind === 'CONSTRAINT');
  }

  getValidatingTests(propertyEntityId) {
    const ancestors = this.knowledgeGraph.getAncestors(propertyEntityId, { maxDepth: 10 });
    const descendants = this.knowledgeGraph.getDescendants(propertyEntityId, { maxDepth: 10 });
    const all = [...ancestors, ...descendants];
    return all.filter(a => a.kind === 'TEST' || a.kind === 'TEST_ORACLE');
  }
}
