/**
 * First-class representation of contradictory solver results
 */
export class SolverDisagreement {
  constructor({
    constraint,
    solverResults = [],
    conflictingStatuses = [],
    details = {},
    timestamp = Date.now()
  } = {}) {
    this.constraint = constraint;
    this.solverResults = Object.freeze([...solverResults]);
    this.conflictingStatuses = Object.freeze([...new Set(conflictingStatuses)]);
    this.details = Object.freeze({ ...details });
    this.timestamp = timestamp;
    Object.freeze(this);
  }

  toJSON() {
    return {
      constraint: this.constraint,
      solverResults: this.solverResults,
      conflictingStatuses: [...this.conflictingStatuses],
      details: { ...this.details },
      timestamp: this.timestamp
    };
  }
}
