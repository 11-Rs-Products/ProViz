/**
 * ContinuousVerificationState.js
 * Immutable representation of the current project verification state.
 */

export class ContinuousVerificationState {
  /**
   * @param {Object} options
   * @param {string} options.sourceRevision
   * @param {Object} [options.semanticSnapshot=null]
   * @param {Object} [options.verificationSnapshot=null]
   * @param {Object} [options.securitySnapshot=null]
   * @param {Object} [options.performanceSnapshot=null]
   * @param {Object} [options.concurrencySnapshot=null]
   * @param {Object} [options.testState=null]
   * @param {Object} [options.knowledgeState=null]
   * @param {Array<Object>} [options.openFindings=[]]
   * @param {Array<Object>} [options.resolvedFindings=[]]
   * @param {number} [options.verificationDebt=0]
   * @param {number} [options.confidence=1.0]
   * @param {number} [options.staleness=0]
   * @param {number} [options.timestamp=Date.now()]
   */
  constructor({
    sourceRevision,
    semanticSnapshot = null,
    verificationSnapshot = null,
    securitySnapshot = null,
    performanceSnapshot = null,
    concurrencySnapshot = null,
    testState = null,
    knowledgeState = null,
    openFindings = [],
    resolvedFindings = [],
    verificationDebt = 0,
    confidence = 1.0,
    staleness = 0,
    timestamp = Date.now()
  }) {
    if (!sourceRevision) throw new Error('ContinuousVerificationState requires sourceRevision');
    this.sourceRevision = sourceRevision;
    this.semanticSnapshot = semanticSnapshot;
    this.verificationSnapshot = verificationSnapshot;
    this.securitySnapshot = securitySnapshot;
    this.performanceSnapshot = performanceSnapshot;
    this.concurrencySnapshot = concurrencySnapshot;
    this.testState = testState;
    this.knowledgeState = knowledgeState;
    this.openFindings = Object.freeze([...openFindings]);
    this.resolvedFindings = Object.freeze([...resolvedFindings]);
    this.verificationDebt = verificationDebt;
    this.confidence = Math.max(0, Math.min(1.0, confidence));
    this.staleness = staleness;
    this.timestamp = timestamp;
    Object.freeze(this);
  }

  withRevision(revision) {
    return new ContinuousVerificationState({
      sourceRevision: revision,
      semanticSnapshot: this.semanticSnapshot,
      verificationSnapshot: this.verificationSnapshot,
      securitySnapshot: this.securitySnapshot,
      performanceSnapshot: this.performanceSnapshot,
      concurrencySnapshot: this.concurrencySnapshot,
      testState: this.testState,
      knowledgeState: this.knowledgeState,
      openFindings: this.openFindings,
      resolvedFindings: this.resolvedFindings,
      verificationDebt: this.verificationDebt,
      confidence: this.confidence,
      staleness: this.staleness + 1,
      timestamp: Date.now()
    });
  }

  withFindings({ open = this.openFindings, resolved = this.resolvedFindings, debt = this.verificationDebt }) {
    return new ContinuousVerificationState({
      sourceRevision: this.sourceRevision,
      semanticSnapshot: this.semanticSnapshot,
      verificationSnapshot: this.verificationSnapshot,
      securitySnapshot: this.securitySnapshot,
      performanceSnapshot: this.performanceSnapshot,
      concurrencySnapshot: this.concurrencySnapshot,
      testState: this.testState,
      knowledgeState: this.knowledgeState,
      openFindings: open,
      resolvedFindings: resolved,
      verificationDebt: debt,
      confidence: this.confidence,
      staleness: this.staleness,
      timestamp: Date.now()
    });
  }

  toJSON() {
    return {
      sourceRevision: this.sourceRevision,
      openFindingsCount: this.openFindings.length,
      openFindings: [...this.openFindings],
      resolvedFindingsCount: this.resolvedFindings.length,
      verificationDebt: this.verificationDebt,
      confidence: this.confidence,
      staleness: this.staleness,
      timestamp: this.timestamp
    };
  }
}
