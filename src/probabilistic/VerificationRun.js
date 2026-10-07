import { VerificationStatus } from './VerificationPolicy.js';

export class VerificationRun {
  constructor({
    id,
    trigger,
    policy,
    startTime = Date.now(),
    endTime = null,
    status = VerificationStatus.CREATED,
    propertiesChecked = 0,
    propertiesVerified = 0,
    propertiesUncertain = 0,
    evidenceCollected = [],
    stoppingReason = ''
  }) {
    this.id = id || `run:${Date.now()}`;
    this.trigger = trigger;
    this.policy = policy;
    this.startTime = startTime;
    this.endTime = endTime;
    this.status = status;
    this.propertiesChecked = propertiesChecked;
    this.propertiesVerified = propertiesVerified;
    this.propertiesUncertain = propertiesUncertain;
    this.evidenceCollected = Object.freeze([...evidenceCollected]);
    this.stoppingReason = stoppingReason;
    Object.freeze(this);
  }

  toJSON() {
    return {
      id: this.id,
      trigger: this.trigger,
      status: this.status,
      startTime: this.startTime,
      endTime: this.endTime,
      durationMs: this.endTime ? this.endTime - this.startTime : null,
      propertiesChecked: this.propertiesChecked,
      propertiesVerified: this.propertiesVerified,
      propertiesUncertain: this.propertiesUncertain,
      evidenceCount: this.evidenceCollected.length,
      stoppingReason: this.stoppingReason
    };
  }
}
