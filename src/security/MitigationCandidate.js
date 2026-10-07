/**
 * MitigationCandidate.js
 * Represents a synthesized defensive patch or security mitigation.
 */

export class MitigationCandidate {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {string} options.counterexampleId
   * @param {string} options.strategy - SANITIZATION, AUTHZ_GUARD, INPUT_VALIDATION, RATE_LIMITING, ISOLATION
   * @param {string} options.targetFile
   * @param {string} options.patchContent
   * @param {number} [options.effectiveness=0.95]
   * @param {Object} [options.metadata={}]
   */
  constructor({
    id,
    counterexampleId,
    strategy = 'INPUT_VALIDATION',
    targetFile,
    patchContent,
    effectiveness = 0.95,
    metadata = {}
  }) {
    if (!id || !counterexampleId || !targetFile || !patchContent) {
      throw new Error('MitigationCandidate requires id, counterexampleId, targetFile, and patchContent');
    }
    this.id = id;
    this.counterexampleId = counterexampleId;
    this.strategy = strategy;
    this.targetFile = targetFile;
    this.patchContent = patchContent;
    this.effectiveness = Math.max(0.0, Math.min(1.0, Number(effectiveness) || 0.95));
    this.metadata = Object.freeze({ ...metadata });
    Object.freeze(this);
  }

  toJSON() {
    return {
      id: this.id,
      counterexampleId: this.counterexampleId,
      strategy: this.strategy,
      targetFile: this.targetFile,
      patchContent: this.patchContent,
      effectiveness: this.effectiveness,
      metadata: { ...this.metadata }
    };
  }

  static fromJSON(json) {
    return new MitigationCandidate(json);
  }
}
