/**
 * SemanticEdge.js
 * Immutable directed edge representing a semantic relationship between two SemanticNodes.
 */

const EMPTY_ARR = Object.freeze([]);
const EMPTY_OBJ = Object.freeze({});

export class SemanticEdge {
  /**
   * @param {Object} options
   * @param {string} options.id - Deterministic edge identifier
   * @param {string} options.sourceId - Source SemanticNode ID
   * @param {string} options.targetId - Target SemanticNode ID
   * @param {string} options.relation - SemanticRelationKind
   * @param {number} [options.strength=1.0] - Relationship weight [0.0, 1.0]
   * @param {string} [options.scope='GLOBAL'] - Local / Module / Package / Global
   * @param {Object} [options.conditions=null] - Dynamic or conditional constraints
   * @param {Array<string>} [options.provenance=[]] - Artifact lineage references
   * @param {number} [options.confidence=1.0] - Probabilistic confidence
   * @param {Object} [options.attributes={}] - Extensible metadata
   */
  constructor({
    id,
    sourceId,
    targetId,
    relation,
    strength = 1.0,
    scope = 'GLOBAL',
    conditions = null,
    provenance = null,
    confidence = 1.0,
    attributes = null
  }) {
    if (!id || typeof id !== 'string') {
      throw new Error('SemanticEdge requires a valid string id');
    }
    if (!sourceId || !targetId) {
      throw new Error('SemanticEdge requires valid sourceId and targetId');
    }
    if (!relation) {
      throw new Error('SemanticEdge requires a relation');
    }

    this.id = id;
    this.sourceId = sourceId;
    this.targetId = targetId;
    this.relation = relation;
    this.strength = typeof strength === 'number' ? (strength > 1 ? 1 : strength < 0 ? 0 : strength) : 1.0;
    this.scope = scope;
    this.conditions = conditions ? Object.freeze({ ...conditions }) : null;
    this.provenance = provenance && provenance.length > 0 ? Object.freeze([...provenance]) : EMPTY_ARR;
    this.confidence = typeof confidence === 'number' ? (confidence > 1 ? 1 : confidence < 0 ? 0 : confidence) : 1.0;
    this.attributes = attributes && Object.keys(attributes).length > 0 ? Object.freeze({ ...attributes }) : EMPTY_OBJ;

    Object.freeze(this);
  }

  toJSON() {
    return {
      id: this.id,
      sourceId: this.sourceId,
      targetId: this.targetId,
      relation: this.relation,
      strength: this.strength,
      scope: this.scope,
      conditions: this.conditions,
      provenance: [...this.provenance],
      confidence: this.confidence,
      attributes: { ...this.attributes }
    };
  }

  static fromJSON(json) {
    return new SemanticEdge(json);
  }
}
