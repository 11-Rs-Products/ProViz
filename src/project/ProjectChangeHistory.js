/**
 * ProjectChangeHistory.js
 * Records and indexes historical commit/change records across project entities.
 */

export class ChangeRecord {
  /**
   * @param {Object} options
   * @param {string} options.changeId
   * @param {string} [options.author='']
   * @param {number} [options.timestamp]
   * @param {string[]} [options.modifiedEntities=[]]
   * @param {boolean} [options.causedRegression=false]
   * @param {number} [options.blastRadius=0]
   * @param {Object} [options.metadata={}]
   */
  constructor({
    changeId,
    author = '',
    timestamp = Date.now(),
    modifiedEntities = [],
    causedRegression = false,
    blastRadius = 0,
    metadata = {}
  }) {
    if (!changeId) throw new Error('ChangeRecord requires changeId');
    this.changeId = changeId;
    this.author = author;
    this.timestamp = timestamp;
    this.modifiedEntities = Object.freeze([...modifiedEntities]);
    this.causedRegression = Boolean(causedRegression);
    this.blastRadius = blastRadius;
    this.metadata = Object.freeze({ ...metadata });
    Object.freeze(this);
  }

  toJSON() {
    return {
      changeId: this.changeId,
      author: this.author,
      timestamp: this.timestamp,
      modifiedEntities: [...this.modifiedEntities],
      causedRegression: this.causedRegression,
      blastRadius: this.blastRadius,
      metadata: { ...this.metadata }
    };
  }

  static fromJSON(json) {
    return new ChangeRecord(json);
  }
}

export class ProjectChangeHistory {
  constructor() {
    /** @type {ChangeRecord[]} */
    this._records = [];
  }

  recordChange(changeData) {
    const record = changeData instanceof ChangeRecord ? changeData : new ChangeRecord(changeData);
    this._records.push(record);
    return record;
  }

  getRecords() {
    return [...this._records];
  }

  getChangesForEntity(entityId) {
    return this._records.filter(r => r.modifiedEntities.includes(entityId));
  }

  toJSON() {
    return {
      records: this._records.map(r => r.toJSON())
    };
  }

  static fromJSON(json) {
    const history = new ProjectChangeHistory();
    if (json.records) {
      for (const r of json.records) history.recordChange(ChangeRecord.fromJSON(r));
    }
    return history;
  }
}
