/**
 * VerificationPhaseResult.js
 * Result artifact produced by a single pipeline phase execution.
 */

export class VerificationPhaseResult {
  /**
   * @param {Object} options
   * @param {string} options.phase - from VerificationPhase
   * @param {boolean} options.isSuccess
   * @param {Object} [options.output={}]
   * @param {string[]} [options.errors=[]]
   * @param {number} [options.durationMs=0]
   */
  constructor({
    phase,
    isSuccess,
    output = {},
    errors = [],
    durationMs = 0
  }) {
    if (!phase) throw new Error('VerificationPhaseResult requires phase');
    this.phase = phase;
    this.isSuccess = Boolean(isSuccess);
    this.output = Object.freeze({ ...output });
    this.errors = Object.freeze([...errors]);
    this.durationMs = durationMs;
    this.timestamp = Date.now();
    Object.freeze(this);
  }

  toJSON() {
    return {
      phase: this.phase,
      isSuccess: this.isSuccess,
      output: this.output,
      errors: [...this.errors],
      durationMs: this.durationMs,
      timestamp: this.timestamp
    };
  }

  static fromJSON(json) {
    return new VerificationPhaseResult(json);
  }
}
