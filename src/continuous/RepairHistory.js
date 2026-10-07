/**
 * RepairHistory.js
 * Tracks the complete log of attempted, applied, validated, and rolled-back automated repairs.
 */

export class RepairHistory {
  constructor() {
    /** @type {Array<Object>} */
    this.records = [];
  }

  recordRepair({
    repairId,
    targetEntity,
    patch,
    reason,
    checkpointId,
    validationResults,
    status = 'APPLIED',
    decision = 'ACCEPTED',
    timestamp = Date.now()
  }) {
    const record = {
      id: `record-${Date.now()}-${this.records.length + 1}`,
      repairId,
      targetEntity,
      patch,
      reason,
      checkpointId,
      validationResults,
      status,
      decision,
      timestamp
    };
    this.records.push(record);
    return record;
  }

  getRecord(recordId) {
    return this.records.find(r => r.id === recordId || r.repairId === recordId) || null;
  }

  getAllRecords() {
    return [...this.records];
  }

  toJSON() {
    return {
      recordCount: this.records.length,
      records: [...this.records]
    };
  }
}
