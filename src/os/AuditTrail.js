/**
 * AuditTrail.js
 * Immutable cryptographic audit ledger linking all observations, decisions, plans, evidence, repairs, approvals, and certificates.
 */

export class AuditRecord {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {string} options.action
   * @param {string} options.actor - 'AUTONOMOUS_OS' | 'OPERATOR' | 'SUBSYSTEM'
   * @param {number} options.projectRevision
   * @param {Object} options.details
   * @param {string|null} [options.causationId=null]
   * @param {number} [options.timestamp]
   */
  constructor({
    id,
    action,
    actor = 'AUTONOMOUS_OS',
    projectRevision = 1,
    details = {},
    causationId = null,
    timestamp = Date.now()
  }) {
    if (!action) throw new Error('AuditRecord requires action');
    this.id = id || `AUDIT_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    this.action = action;
    this.actor = actor;
    this.projectRevision = projectRevision;
    this.details = Object.freeze({ ...details });
    this.causationId = causationId;
    this.timestamp = timestamp;
    Object.freeze(this);
  }

  toJSON() {
    return {
      id: this.id,
      action: this.action,
      actor: this.actor,
      projectRevision: this.projectRevision,
      details: this.details,
      causationId: this.causationId,
      timestamp: this.timestamp
    };
  }

  static fromJSON(json) {
    return new AuditRecord(json);
  }
}

export class AuditTrail {
  constructor() {
    /** @type {AuditRecord[]} */
    this._records = [];
  }

  record(action, actor = 'AUTONOMOUS_OS', details = {}, projectRevision = 1, causationId = null) {
    const rec = new AuditRecord({
      action,
      actor,
      details,
      projectRevision,
      causationId
    });
    this._records.push(rec);
    return rec;
  }

  getRecords() {
    return [...this._records];
  }

  exportAudit() {
    return {
      totalRecords: this._records.length,
      records: this._records.map(r => r.toJSON()),
      timestamp: Date.now()
    };
  }
}
