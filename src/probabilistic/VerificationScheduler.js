import { VerificationRun } from './VerificationRun.js';
import { VerificationStatus, VerificationTrigger } from './VerificationPolicy.js';

export class VerificationScheduler {
  constructor(policy) {
    this.policy = policy;
    this.pendingTriggers = [];
    this.runHistory = [];
  }

  scheduleTrigger(trigger, context = {}) {
    this.pendingTriggers.push({ trigger, context, timestamp: Date.now() });
    return this;
  }

  hasPendingTriggers() {
    return this.pendingTriggers.length > 0;
  }

  getNextTrigger() {
    return this.pendingTriggers.shift() || null;
  }

  recordRun(run) {
    this.runHistory.push(run);
    return this;
  }

  toJSON() {
    return {
      pendingCount: this.pendingTriggers.length,
      historyCount: this.runHistory.length,
      lastRun: this.runHistory[this.runHistory.length - 1]?.toJSON() || null
    };
  }
}
