/**
 * SemanticNode.js
 * Immutable representation of a semantic node in the Universal Semantic Program Model.
 */

export class SemanticNode {
  /**
   * @param {Object} options
   * @param {string} options.id - Stable deterministic identifier
   * @param {string} options.kind - SemanticEntityKind
   * @param {string} [options.name] - Human-readable symbol or name
   * @param {Object} [options.sourceRange] - { file, startLine, startCol, endLine, endCol }
   * @param {string} [options.owningScope] - ID of parent/owning scope
   * @param {Object} [options.typeInfo] - Type descriptors, generics, constraints
   * @param {Object} [options.cfgContext] - CFG node metadata, branch conditions
   * @param {Object} [options.dfgContext] - DFG def/use sets, SSA versions
   * @param {Object} [options.callContext] - Call sites, caller/callee context
   * @param {Object} [options.memoryRelationships] - Allocations, alias classes, escaping
   * @param {Object} [options.verificationState] - Status (VERIFIED, UNVERIFIED, FAILED, STALE)
   * @param {Array<string>} [options.specRelationships] - Connected contract/invariant IDs
   * @param {Array<string>} [options.provenanceRefs] - Lineage IDs
   * @param {Object} [options.environmentConstraints] - Target runtime, env vars
   * @param {Object} [options.attributes] - Arbitrary extensible metadata
   */
  constructor({
    id,
    kind,
    name = '',
    sourceRange = null,
    owningScope = null,
    typeInfo = null,
    cfgContext = null,
    dfgContext = null,
    callContext = null,
    memoryRelationships = null,
    verificationState = 'UNVERIFIED',
    specRelationships = [],
    provenanceRefs = [],
    environmentConstraints = null,
    attributes = {}
  }) {
    if (!id || typeof id !== 'string') {
      throw new Error('SemanticNode requires a non-empty string id');
    }
    if (!kind || typeof kind !== 'string') {
      throw new Error('SemanticNode requires a valid kind');
    }

    this.id = id;
    this.kind = kind;
    this.name = name;
    this.sourceRange = sourceRange ? Object.freeze({ ...sourceRange }) : null;
    this.owningScope = owningScope;
    this.typeInfo = typeInfo ? Object.freeze({ ...typeInfo }) : null;
    this.cfgContext = cfgContext ? Object.freeze({ ...cfgContext }) : null;
    this.dfgContext = dfgContext ? Object.freeze({ ...dfgContext }) : null;
    this.callContext = callContext ? Object.freeze({ ...callContext }) : null;
    this.memoryRelationships = memoryRelationships ? Object.freeze({ ...memoryRelationships }) : null;
    this.verificationState = verificationState;
    this.specRelationships = Object.freeze([...specRelationships]);
    this.provenanceRefs = Object.freeze([...provenanceRefs]);
    this.environmentConstraints = environmentConstraints ? Object.freeze({ ...environmentConstraints }) : null;
    this.attributes = Object.freeze({ ...attributes });

    Object.freeze(this);
  }

  withAttribute(key, value) {
    return new SemanticNode({
      ...this,
      attributes: { ...this.attributes, [key]: value }
    });
  }

  withVerificationState(newState) {
    return new SemanticNode({
      ...this,
      verificationState: newState
    });
  }

  withTypeInfo(newTypeInfo) {
    return new SemanticNode({
      ...this,
      typeInfo: { ...this.typeInfo, ...newTypeInfo }
    });
  }

  toJSON() {
    return {
      id: this.id,
      kind: this.kind,
      name: this.name,
      sourceRange: this.sourceRange,
      owningScope: this.owningScope,
      typeInfo: this.typeInfo,
      cfgContext: this.cfgContext,
      dfgContext: this.dfgContext,
      callContext: this.callContext,
      memoryRelationships: this.memoryRelationships,
      verificationState: this.verificationState,
      specRelationships: [...this.specRelationships],
      provenanceRefs: [...this.provenanceRefs],
      environmentConstraints: this.environmentConstraints,
      attributes: { ...this.attributes }
    };
  }

  static fromJSON(json) {
    return new SemanticNode(json);
  }
}
