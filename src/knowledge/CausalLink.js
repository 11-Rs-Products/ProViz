import { CausalRelationKind } from './CausalRelationKind.js';

/**
 * Represents a causal relationship between two verification entities with empirical strength
 */
export class CausalLink {
  constructor({
    causeId,
    effectId,
    causalKind = CausalRelationKind.DIRECT_CAUSE,
    causalStrength = 1.0,
    supportingEvidence = [],
    confidence = 1.0,
    scope = 'GLOBAL',
    environment = null,
    counterevidence = [],
    temporalOrdering = -1, // -1 means cause happened before effect
    metadata = {}
  } = {}) {
    if (!causeId || !effectId) {
      throw new Error('CausalLink requires causeId and effectId');
    }

    this.causeId = causeId;
    this.effectId = effectId;
    this.causalKind = causalKind;
    this.causalStrength = Math.max(0, Math.min(1, causalStrength));
    this.supportingEvidence = Object.freeze([...new Set(supportingEvidence)]);
    this.confidence = Math.max(0, Math.min(1, confidence));
    this.scope = scope;
    this.environment = environment;
    this.counterevidence = Object.freeze([...new Set(counterevidence)]);
    this.temporalOrdering = temporalOrdering;
    this.metadata = Object.freeze({ ...metadata });
    Object.freeze(this);
  }

  toJSON() {
    return {
      causeId: this.causeId,
      effectId: this.effectId,
      causalKind: this.causalKind,
      causalStrength: this.causalStrength,
      supportingEvidence: [...this.supportingEvidence],
      confidence: this.confidence,
      scope: this.scope,
      environment: this.environment,
      counterevidence: [...this.counterevidence],
      temporalOrdering: this.temporalOrdering,
      metadata: { ...this.metadata }
    };
  }

  static fromJSON(json = {}) {
    return new CausalLink(json);
  }
}
