/**
 * SemanticMonitor.js
 * Continuously monitors code, environment, and verification events and generates SemanticChange instances.
 */

import { SemanticChange, SemanticChangeType } from './SemanticChange.js';

export class SemanticMonitor {
  constructor() {
    this._listeners = new Set();
    this._changeHistory = [];
  }

  on(listener) {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  notify(change) {
    if (!(change instanceof SemanticChange)) {
      change = new SemanticChange(change);
    }
    this._changeHistory.push(change);
    for (const listener of this._listeners) {
      try {
        listener(change);
      } catch (err) {
        console.error('SemanticMonitor listener error:', err);
      }
    }
  }

  recordSourceChange(targetId, oldValue, newValue) {
    const change = new SemanticChange({
      id: `change:src:${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: SemanticChangeType.MODIFIED,
      targetId,
      oldValue,
      newValue,
      details: { category: 'source_edit' }
    });
    this.notify(change);
    return change;
  }

  recordTypeChange(targetId, oldType, newType) {
    const change = new SemanticChange({
      id: `change:type:${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: SemanticChangeType.TYPE_CHANGED,
      targetId,
      oldValue: oldType,
      newValue: newType,
      details: { category: 'type_mutation' }
    });
    this.notify(change);
    return change;
  }

  recordEnvironmentChange(targetId, oldEnv, newEnv) {
    const change = new SemanticChange({
      id: `change:env:${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: SemanticChangeType.ENVIRONMENT_CHANGED,
      targetId,
      oldValue: oldEnv,
      newValue: newEnv,
      details: { category: 'environment_shift' }
    });
    this.notify(change);
    return change;
  }

  getChangeHistory() {
    return [...this._changeHistory];
  }
}
