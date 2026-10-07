import { VerificationHealth } from './VerificationHealth.js';

export class VerificationHealthSnapshot {
  constructor({
    id,
    health = new VerificationHealth({}),
    summary = '',
    timestamp = Date.now()
  }) {
    this.id = id || `health-snap:${timestamp}`;
    this.health = health;
    this.summary = summary;
    this.timestamp = timestamp;
    Object.freeze(this);
  }

  toJSON() {
    return {
      id: this.id,
      health: this.health.toJSON(),
      summary: this.summary,
      timestamp: this.timestamp
    };
  }
}
