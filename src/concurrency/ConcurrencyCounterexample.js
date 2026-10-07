/**
 * ConcurrencyCounterexample.js
 * Comprehensive diagnostic counterexample explaining race, deadlock, temporal, or consistency defect.
 */

export class ConcurrencyCounterexample {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {string} options.defectType 'RACE', 'DEADLOCK', 'LIVENESS', 'TEMPORAL', 'CONSISTENCY', 'ATOMICITY'
   * @param {Object} [options.initialState={}]
   * @param {Array<string>} [options.executionContexts=[]]
   * @param {import('./Schedule.js').Schedule|Array<Object>} [options.schedule=null]
   * @param {Array<Object>} [options.events=[]]
   * @param {Object} [options.failurePoint={}]
   * @param {string} [options.violatedProperty='']
   * @param {string} [options.explanation='']
   */
  constructor({
    id,
    defectType,
    initialState = {},
    executionContexts = [],
    schedule = null,
    events = [],
    failurePoint = {},
    violatedProperty = '',
    explanation = ''
  }) {
    if (!id || !defectType) throw new Error('ConcurrencyCounterexample requires id and defectType');
    this.id = id;
    this.defectType = defectType;
    this.initialState = Object.freeze({ ...initialState });
    this.executionContexts = Object.freeze([...executionContexts]);
    this.schedule = schedule;
    this.events = Object.freeze([...events]);
    this.failurePoint = Object.freeze({ ...failurePoint });
    this.violatedProperty = violatedProperty;
    this.explanation = explanation;
    Object.freeze(this);
  }

  toJSON() {
    return {
      id: this.id,
      defectType: this.defectType,
      initialState: { ...this.initialState },
      executionContexts: [...this.executionContexts],
      schedule: this.schedule && this.schedule.toJSON ? this.schedule.toJSON() : this.schedule,
      events: [...this.events],
      failurePoint: { ...this.failurePoint },
      violatedProperty: this.violatedProperty,
      explanation: this.explanation
    };
  }
}
