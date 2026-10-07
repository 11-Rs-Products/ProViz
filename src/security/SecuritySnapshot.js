/**
 * SecuritySnapshot.js
 * Checkpoint and restore security state, threat models, attack graphs, evidence, and mitigations.
 */

export class SecuritySnapshot {
  /**
   * @param {Object} options
   * @param {string} options.snapshotId
   * @param {string} options.threatModelId
   * @param {Object} options.threatModelState
   * @param {Object} options.attackGraphState
   * @param {Array<Object>} [options.evidenceList=[]]
   * @param {Array<Object>} [options.mitigations=[]]
   * @param {number} [options.timestamp=Date.now()]
   */
  constructor({
    snapshotId,
    threatModelId,
    threatModelState = {},
    attackGraphState = {},
    evidenceList = [],
    mitigations = [],
    timestamp = Date.now()
  }) {
    if (!snapshotId || !threatModelId) {
      throw new Error('SecuritySnapshot requires snapshotId and threatModelId');
    }
    this.snapshotId = snapshotId;
    this.threatModelId = threatModelId;
    this.threatModelState = Object.freeze({ ...threatModelState });
    this.attackGraphState = Object.freeze({ ...attackGraphState });
    this.evidenceList = Object.freeze([...evidenceList]);
    this.mitigations = Object.freeze([...mitigations]);
    this.timestamp = timestamp;
    Object.freeze(this);
  }

  toJSON() {
    return {
      snapshotId: this.snapshotId,
      threatModelId: this.threatModelId,
      threatModelState: { ...this.threatModelState },
      attackGraphState: { ...this.attackGraphState },
      evidenceList: [...this.evidenceList],
      mitigations: [...this.mitigations],
      timestamp: this.timestamp
    };
  }

  static fromJSON(json) {
    return new SecuritySnapshot(json);
  }
}
