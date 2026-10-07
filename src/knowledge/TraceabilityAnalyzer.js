/**
 * Links high-level specifications to low-level implementation, tests, and evidence
 */
export class SpecificationLink {
  constructor({
    specificationId,
    targetKind = 'FUNCTION', // FUNCTION, CONTRACT, INVARIANT, TEST, PROOF, EVIDENCE
    targetEntityId,
    traceabilityStatus = 'COVERED', // COVERED, PARTIAL, UNCOVERED, VIOLATED
    metadata = {}
  } = {}) {
    this.specificationId = specificationId;
    this.targetKind = targetKind;
    this.targetEntityId = targetEntityId;
    this.traceabilityStatus = traceabilityStatus;
    this.metadata = Object.freeze({ ...metadata });
    Object.freeze(this);
  }

  toJSON() {
    return {
      specificationId: this.specificationId,
      targetKind: this.targetKind,
      targetEntityId: this.targetEntityId,
      traceabilityStatus: this.traceabilityStatus,
      metadata: { ...this.metadata }
    };
  }
}

/**
 * Bidirectional traceability analyzer between specifications, implementation, tests, and evidence
 */
export class TraceabilityAnalyzer {
  constructor(knowledgeGraph) {
    this.knowledgeGraph = knowledgeGraph;
  }

  getTraceability(specificationEntityId) {
    const descendants = this.knowledgeGraph.getDescendants(specificationEntityId, { maxDepth: 10 });
    const links = [];

    for (const d of descendants) {
      links.push(new SpecificationLink({
        specificationId: specificationEntityId,
        targetKind: d.kind,
        targetEntityId: d.id,
        traceabilityStatus: 'COVERED'
      }));
    }

    return {
      specificationId: specificationEntityId,
      implementationArtifacts: descendants.filter(d => ['FUNCTION', 'STATEMENT', 'VARIABLE', 'EXPRESSION'].includes(d.kind)),
      tests: descendants.filter(d => ['TEST', 'TEST_INPUT', 'TEST_ORACLE'].includes(d.kind)),
      evidence: descendants.filter(d => ['EVIDENCE', 'PROOF', 'INVARIANT'].includes(d.kind)),
      links
    };
  }

  getAffectedSpecifications(implementationEntityId) {
    const ancestors = this.knowledgeGraph.getAncestors(implementationEntityId, { maxDepth: 10 });
    return ancestors.filter(a => a.kind === 'SPECIFICATION' || a.kind === 'PROPERTY');
  }
}
