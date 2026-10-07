/**
 * StateTransition.js
 * Explicit record of an atomic state transition between revisions.
 */

export class StateTransition {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {import('./StateRevision.js').StateRevision} options.fromRevision
   * @param {import('./StateRevision.js').StateRevision} options.toRevision
   * @param {string} options.cause
   * @param {Object} [options.delta={}]
   * @param {Object} [options.provenance={}]
   * @param {number} [options.timestamp]
   */
  constructor({
    id,
    fromRevision,
    toRevision,
    cause,
    delta = {},
    provenance = {},
    timestamp = Date.now()
  }) {
    if (!fromRevision || !toRevision || !cause) {
      throw new Error('StateTransition requires fromRevision, toRevision, and cause');
    }
    this.id = id || `TRANS_${fromRevision.sequenceNumber}_TO_${toRevision.sequenceNumber}_${Date.now()}`;
    this.fromRevision = fromRevision;
    this.toRevision = toRevision;
    this.cause = cause;
    this.delta = Object.freeze({ ...delta });
    this.provenance = Object.freeze({ ...provenance });
    this.timestamp = timestamp;
    Object.freeze(this);
  }

  toJSON() {
    return {
      id: this.id,
      fromRevision: this.fromRevision.toJSON(),
      toRevision: this.toRevision.toJSON(),
      cause: this.cause,
      delta: this.delta,
      provenance: this.provenance,
      timestamp: this.timestamp
    };
  }

  static fromJSON(json) {
    return new StateTransition({
      id: json.id,
      fromRevision: json.fromRevision,
      toRevision: json.toRevision,
      cause: json.cause,
      delta: json.delta,
      provenance: json.provenance,
      timestamp: json.timestamp
    });
  }
}
