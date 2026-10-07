/**
 * EscalationManager.js
 * Manages human escalation events, preserving reason, affected scope, and unblocking triggers.
 */

import { EscalationReason } from './EscalationReason.js';

export class EscalationManager {
  constructor() {
    /** @type {Object[]} */
    this._escalations = [];
  }

  escalate(options) {
    const {
      reason = EscalationReason.HIGH_RISK_REPAIR,
      details = '',
      affectedScope = [],
      evidence = {}
    } = options;

    const record = {
      id: `ESC_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
      reason,
      details,
      affectedScope: [...affectedScope],
      evidence: { ...evidence },
      isResolved: false,
      timestamp: Date.now()
    };

    this._escalations.push(record);
    return record;
  }

  resolveEscalation(escalationId, resolution = '') {
    const esc = this._escalations.find(e => e.id === escalationId);
    if (esc) {
      esc.isResolved = true;
      esc.resolution = resolution;
      esc.resolvedTimestamp = Date.now();
      return true;
    }
    return false;
  }

  getPendingEscalations() {
    return this._escalations.filter(e => !e.isResolved);
  }

  getAllEscalations() {
    return [...this._escalations];
  }
}
