/**
 * ApprovalRequest.js
 * Pending request requiring explicit operator authorization before execution.
 */

import { ApprovalKind } from './ApprovalKind.js';

export class ApprovalRequest {
  /**
   * @param {Object} options
   * @param {string} [options.id]
   * @param {string} options.kind - from ApprovalKind
   * @param {string} options.title
   * @param {string} options.rationale
   * @param {string[]} [options.affectedScope=[]]
   * @param {string} [options.risk='HIGH']
   * @param {Object} [options.payload={}]
   * @param {number} [options.timestamp]
   */
  constructor({
    id,
    kind = ApprovalKind.HIGH_RISK_REPAIR,
    title,
    rationale,
    affectedScope = [],
    risk = 'HIGH',
    payload = {},
    timestamp = Date.now()
  }) {
    if (!title || !rationale) throw new Error('ApprovalRequest requires title and rationale');
    this.id = id || `APP_REQ_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    this.kind = kind;
    this.title = title;
    this.rationale = rationale;
    this.affectedScope = Object.freeze([...affectedScope]);
    this.risk = risk;
    this.payload = Object.freeze({ ...payload });
    this.timestamp = timestamp;
    this.status = 'PENDING'; // 'PENDING' | 'APPROVED' | 'REJECTED'
    Object.freeze(this);
  }

  toJSON() {
    return {
      id: this.id,
      kind: this.kind,
      title: this.title,
      rationale: this.rationale,
      affectedScope: [...this.affectedScope],
      risk: this.risk,
      payload: this.payload,
      status: this.status,
      timestamp: this.timestamp
    };
  }

  static fromJSON(json) {
    return new ApprovalRequest(json);
  }
}
