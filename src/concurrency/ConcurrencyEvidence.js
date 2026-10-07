/**
 * ConcurrencyEvidence.js
 * Structured evidence model preserving assumptions, solver provenance, bounds, and traces.
 */

export const EvidenceType = Object.freeze({
  FORMAL_PROOF: 'FORMAL_PROOF',
  MODEL_CHECK: 'MODEL_CHECK',
  SYMBOLIC_SCHEDULE: 'SYMBOLIC_SCHEDULE',
  CONCRETE_SCHEDULE: 'CONCRETE_SCHEDULE',
  RACE_TRACE: 'RACE_TRACE',
  DEADLOCK_TRACE: 'DEADLOCK_TRACE',
  TEMPORAL_TRACE: 'TEMPORAL_TRACE',
  DISTRIBUTED_HISTORY: 'DISTRIBUTED_HISTORY',
  FAULT_INJECTION: 'FAULT_INJECTION',
  EMPIRICAL_TRACE: 'EMPIRICAL_TRACE'
});

export class ConcurrencyEvidence {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {string} options.type
   * @param {Object} [options.bounds={}]
   * @param {Array<string>} [options.assumptions=[]]
   * @param {Object} [options.solverInfo={}]
   * @param {Array<Object>|Object} [options.traceData={}]
   * @param {number} [options.timestamp=Date.now()]
   */
  constructor({
    id,
    type,
    bounds = {},
    assumptions = [],
    solverInfo = {},
    traceData = {},
    timestamp = Date.now()
  }) {
    if (!id || !type) throw new Error('ConcurrencyEvidence requires id and type');
    this.id = id;
    this.type = type;
    this.bounds = Object.freeze({ ...bounds });
    this.assumptions = Object.freeze([...assumptions]);
    this.solverInfo = Object.freeze({ ...solverInfo });
    this.traceData = Object.freeze(Array.isArray(traceData) ? [...traceData] : { ...traceData });
    this.timestamp = timestamp;
    Object.freeze(this);
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      bounds: { ...this.bounds },
      assumptions: [...this.assumptions],
      solverInfo: { ...this.solverInfo },
      traceData: Array.isArray(this.traceData) ? [...this.traceData] : { ...this.traceData },
      timestamp: this.timestamp
    };
  }

  static fromJSON(json) {
    return new ConcurrencyEvidence(json);
  }
}
