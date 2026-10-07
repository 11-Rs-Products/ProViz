/**
 * DependencyEdge.js
 * Represents a multi-dimensional dependency link between two semantic entities.
 */

import { DependencyKind } from './DependencyKind.js';

export class DependencyEdge {
  /**
   * @param {Object} options
   * @param {string} options.id - Deterministic dependency ID
   * @param {string} options.sourceId - Dependent node ID
   * @param {string} options.targetId - Dependency target node ID
   * @param {string} options.kind - DependencyKind
   * @param {number} [options.strength=1.0] - Dependency strength [0.0, 1.0]
   * @param {string} [options.direction='FORWARD'] - FORWARD / REVERSE / BIDIRECTIONAL
   * @param {string} [options.scope='GLOBAL'] - Local / Module / Package / Global
   * @param {Object} [options.conditions=null] - Gating condition or constraint
   * @param {Array<string>} [options.provenance=[]] - Lineage IDs
   * @param {number} [options.confidence=1.0] - Confidence score
   */
  constructor({
    id,
    sourceId,
    targetId,
    kind = DependencyKind.DATA_FLOW,
    strength = 1.0,
    direction = 'FORWARD',
    scope = 'GLOBAL',
    conditions = null,
    provenance = [],
    confidence = 1.0
  }) {
    if (!id || typeof id !== 'string') {
      throw new Error('DependencyEdge requires a valid id');
    }
    if (!sourceId || !targetId) {
      throw new Error('DependencyEdge requires valid sourceId and targetId');
    }

    this.id = id;
    this.sourceId = sourceId;
    this.targetId = targetId;
    this.kind = kind;
    this.strength = Math.max(0.0, Math.min(1.0, Number(strength) || 1.0));
    this.direction = direction;
    this.scope = scope;
    this.conditions = conditions ? Object.freeze({ ...conditions }) : null;
    this.provenance = Object.freeze([...provenance]);
    this.confidence = Math.max(0.0, Math.min(1.0, Number(confidence) || 1.0));

    Object.freeze(this);
  }

  toJSON() {
    return {
      id: this.id,
      sourceId: this.sourceId,
      targetId: this.targetId,
      kind: this.kind,
      strength: this.strength,
      direction: this.direction,
      scope: this.scope,
      conditions: this.conditions,
      provenance: [...this.provenance],
      confidence: this.confidence
    };
  }

  static fromJSON(json) {
    return new DependencyEdge(json);
  }
}
