/**
 * Transformation.js
 * Immutable canonical representation of a software transformation.
 */

import { TransformationKind } from './TransformationKind.js';

const EMPTY_ARR = Object.freeze([]);
const EMPTY_OBJ = Object.freeze({});

export class Transformation {
  /**
   * @param {Object} options
   * @param {string} options.transformationId - Stable deterministic transformation identifier
   * @param {string} options.kind - TransformationKind
   * @param {string} [options.sourceScope=''] - ID of scope/entity to transform
   * @param {string} [options.targetScope=''] - Target scope after transformation
   * @param {Array<string>} [options.preconditions=[]] - Precondition rule IDs
   * @param {Array<string>} [options.postconditions=[]] - Postcondition rule IDs
   * @param {string} [options.semanticIntent=''] - Narrative explanation of intent
   * @param {Array<string>} [options.preservationRequirements=[]] - Property kinds that must not change
   * @param {Object} [options.expectedImpact=null] - Projected impact metrics
   * @param {Array<string>} [options.constraints=[]] - Hard/Soft constraint IDs
   * @param {Array<string>} [options.provenance=[]] - Lineage IDs from Stage 28
   * @param {Object} [options.metadata={}]
   */
  constructor({
    transformationId,
    kind = TransformationKind.CUSTOM,
    sourceScope = '',
    targetScope = '',
    preconditions = null,
    postconditions = null,
    semanticIntent = '',
    preservationRequirements = null,
    expectedImpact = null,
    constraints = null,
    provenance = null,
    metadata = null
  }) {
    if (!transformationId || typeof transformationId !== 'string') {
      throw new Error('Transformation requires a valid string transformationId');
    }
    if (!kind) {
      throw new Error('Transformation requires a kind');
    }

    this.transformationId = transformationId;
    this.kind = kind;
    this.sourceScope = sourceScope;
    this.targetScope = targetScope;
    this.preconditions = preconditions && preconditions.length > 0 ? Object.freeze([...preconditions]) : EMPTY_ARR;
    this.postconditions = postconditions && postconditions.length > 0 ? Object.freeze([...postconditions]) : EMPTY_ARR;
    this.semanticIntent = semanticIntent;
    this.preservationRequirements = preservationRequirements && preservationRequirements.length > 0
      ? Object.freeze([...preservationRequirements])
      : EMPTY_ARR;
    this.expectedImpact = expectedImpact ? Object.freeze({ ...expectedImpact }) : EMPTY_OBJ;
    this.constraints = constraints && constraints.length > 0 ? Object.freeze([...constraints]) : EMPTY_ARR;
    this.provenance = provenance && provenance.length > 0 ? Object.freeze([...provenance]) : EMPTY_ARR;
    this.metadata = metadata ? Object.freeze({ ...metadata }) : EMPTY_OBJ;

    Object.freeze(this);
  }

  toJSON() {
    return {
      transformationId: this.transformationId,
      kind: this.kind,
      sourceScope: this.sourceScope,
      targetScope: this.targetScope,
      preconditions: [...this.preconditions],
      postconditions: [...this.postconditions],
      semanticIntent: this.semanticIntent,
      preservationRequirements: [...this.preservationRequirements],
      expectedImpact: this.expectedImpact,
      constraints: [...this.constraints],
      provenance: [...this.provenance],
      metadata: this.metadata
    };
  }

  static fromJSON(json) {
    return new Transformation(json);
  }
}
