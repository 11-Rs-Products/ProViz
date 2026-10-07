import { KnowledgeRelationKind } from './KnowledgeRelationKind.js';

const EMPTY_ARR = Object.freeze([]);
const EMPTY_OBJ = Object.freeze({});

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
    evidenceReferences = null,
    provenance = null,
    scope = 'GLOBAL',
    environment = null,
    temporalValidity = null,
    derivationStage = 1,
    metadata = null
  } = {}) {
    if (!source || !target) {
      throw new Error('KnowledgeEdge requires source and target');
    }

    this.id = id || `${source}-${relation}->${target}`;
    this.source = source;
    this.target = target;
    this.relation = relation;
    this.confidence = typeof confidence === 'number' ? (confidence > 1 ? 1 : confidence < 0 ? 0 : confidence) : 1.0;
    this.evidenceReferences = evidenceReferences && evidenceReferences.length > 0 ? Object.freeze([...new Set(evidenceReferences)]) : EMPTY_ARR;
    this.provenance = provenance;
    this.scope = scope;
    this.environment = environment;
    this.temporalValidity = temporalValidity ? Object.freeze({
      validFrom: temporalValidity.validFrom ?? Date.now(),
      validUntil: temporalValidity.validUntil ?? null
    }) : Object.freeze({ validFrom: Date.now(), validUntil: null });
    this.derivationStage = derivationStage;
    this.metadata = metadata && Object.keys(metadata).length > 0 ? Object.freeze({ ...metadata }) : EMPTY_OBJ;
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
