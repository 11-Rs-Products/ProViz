import { KnowledgeRelationKind } from './KnowledgeRelationKind.js';

/**
 * Immutable semantic relationship edge in the verification knowledge graph
 */
export class KnowledgeEdge {
  constructor({
    id = null,
    source,
    target,
    relation = KnowledgeRelationKind.DEPENDS_ON,
    confidence = 1.0,
    evidenceReferences = [],
    provenance = null,
    scope = 'GLOBAL',
    environment = null,
    temporalValidity = { validFrom: Date.now(), validUntil: null },
    derivationStage = 1,
    metadata = {}
  } = {}) {
    if (!source || !target) {
      throw new Error('KnowledgeEdge requires source and target');
    }

    this.id = id || `${source}-${relation}->${target}`;
    this.source = source;
    this.target = target;
    this.relation = relation;
    this.confidence = Math.max(0, Math.min(1, confidence));
    this.evidenceReferences = Object.freeze([...new Set(evidenceReferences)]);
    this.provenance = provenance;
    this.scope = scope;
    this.environment = environment;
    this.temporalValidity = Object.freeze({
      validFrom: temporalValidity?.validFrom ?? Date.now(),
      validUntil: temporalValidity?.validUntil ?? null
    });
    this.derivationStage = derivationStage;
    this.metadata = Object.freeze({ ...metadata });
    Object.freeze(this);
  }

  isCurrentlyValid() {
    if (this.temporalValidity.validUntil === null) return true;
    return Date.now() <= this.temporalValidity.validUntil;
  }

  toJSON() {
    return {
      id: this.id,
      source: this.source,
      target: this.target,
      relation: this.relation,
      confidence: this.confidence,
      evidenceReferences: [...this.evidenceReferences],
      provenance: this.provenance,
      scope: this.scope,
      environment: this.environment,
      temporalValidity: { ...this.temporalValidity },
      derivationStage: this.derivationStage,
      metadata: { ...this.metadata }
    };
  }

  static fromJSON(json = {}) {
    return new KnowledgeEdge(json);
  }
}
