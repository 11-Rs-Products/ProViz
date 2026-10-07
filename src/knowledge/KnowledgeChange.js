/**
 * Types of semantic changes occurring in the verification workspace
 */
export const KnowledgeChangeKind = Object.freeze({
  SOURCE_CHANGED: 'SOURCE_CHANGED',
  TYPE_CHANGED: 'TYPE_CHANGED',
  DEPENDENCY_CHANGED: 'DEPENDENCY_CHANGED',
  TEST_CHANGED: 'TEST_CHANGED',
  SPECIFICATION_CHANGED: 'SPECIFICATION_CHANGED',
  ENVIRONMENT_CHANGED: 'ENVIRONMENT_CHANGED',
  SOLVER_CHANGED: 'SOLVER_CHANGED',
  AGENT_CHANGED: 'AGENT_CHANGED',
  PATCH_APPLIED: 'PATCH_APPLIED',
  REPAIR_REJECTED: 'REPAIR_REJECTED',
  CONTRACT_CHANGED: 'CONTRACT_CHANGED'
});

export const ImpactStatus = Object.freeze({
  VALID: 'VALID',
  STALE: 'STALE',
  INVALID: 'INVALID',
  PARTIALLY_INVALID: 'PARTIALLY_INVALID',
  REQUIRES_REVERIFICATION: 'REQUIRES_REVERIFICATION',
  UNAFFECTED: 'UNAFFECTED'
});

export class KnowledgeChange {
  constructor({
    changeId,
    changeKind = KnowledgeChangeKind.SOURCE_CHANGED,
    targetEntityId,
    details = {},
    timestamp = Date.now()
  } = {}) {
    this.changeId = changeId || `change-${Math.random().toString(36).slice(2, 9)}`;
    this.changeKind = changeKind;
    this.targetEntityId = targetEntityId;
    this.details = Object.freeze({ ...details });
    this.timestamp = timestamp;
    Object.freeze(this);
  }

  toJSON() {
    return {
      changeId: this.changeId,
      changeKind: this.changeKind,
      targetEntityId: this.targetEntityId,
      details: { ...this.details },
      timestamp: this.timestamp
    };
  }

  static fromJSON(json = {}) {
    return new KnowledgeChange(json);
  }
}
