/**
 * TemporalCounterexample.js
 * Represents a counterexample violating a temporal property with minimal trace snippet and reason.
 */

export class TemporalCounterexample {
  /**
   * @param {Object} options
   * @param {string} options.propertyId
   * @param {string} options.propertyKind
   * @param {number} options.violatingStepIndex
   * @param {Object} options.violatingEvent
   * @param {Array<Object>} [options.trace=[]]
   * @param {string} [options.reason='']
   */
  constructor({
    propertyId,
    propertyKind,
    violatingStepIndex,
    violatingEvent,
    trace = [],
    reason = ''
  }) {
    this.propertyId = propertyId;
    this.propertyKind = propertyKind;
    this.violatingStepIndex = violatingStepIndex;
    this.violatingEvent = violatingEvent;
    this.trace = Object.freeze([...trace]);
    this.reason = reason;
    Object.freeze(this);
  }

  toJSON() {
    return {
      propertyId: this.propertyId,
      propertyKind: this.propertyKind,
      violatingStepIndex: this.violatingStepIndex,
      violatingEvent: this.violatingEvent,
      traceLength: this.trace.length,
      trace: [...this.trace],
      reason: this.reason
    };
  }
}
