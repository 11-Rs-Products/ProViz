/**
 * VerificationEvent.js
 * Immutable event record preserving eventId, timestamp, source, projectRevision, scope, causation, correlation, and payload.
 */

import { VerificationEventKind } from './VerificationEventKind.js';

export class VerificationEvent {
  /**
   * @param {Object} options
   * @param {string} [options.eventId]
   * @param {string} options.kind - from VerificationEventKind
   * @param {string} [options.source='OS']
   * @param {number} [options.projectRevision=1]
   * @param {string[]} [options.scope=[]]
   * @param {string|null} [options.causationId=null]
   * @param {string|null} [options.correlationId=null]
   * @param {Object} [options.payload={}]
   * @param {Object} [options.provenance={}]
   * @param {number} [options.timestamp]
   */
  constructor({
    eventId,
    kind,
    source = 'OS',
    projectRevision = 1,
    scope = [],
    causationId = null,
    correlationId = null,
    payload = {},
    provenance = {},
    timestamp = Date.now()
  }) {
    if (!kind) throw new Error('VerificationEvent requires kind');
    this.eventId = eventId || `EVT_${kind}_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    this.kind = kind;
    this.source = source;
    this.projectRevision = projectRevision;
    this.scope = Object.freeze([...scope]);
    this.causationId = causationId;
    this.correlationId = correlationId || this.eventId;
    this.payload = Object.freeze({ ...payload });
    this.provenance = Object.freeze({ ...provenance });
    this.timestamp = timestamp;
    Object.freeze(this);
  }

  toJSON() {
    return {
      eventId: this.eventId,
      kind: this.kind,
      source: this.source,
      projectRevision: this.projectRevision,
      scope: [...this.scope],
      causationId: this.causationId,
      correlationId: this.correlationId,
      payload: this.payload,
      provenance: this.provenance,
      timestamp: this.timestamp
    };
  }

  static fromJSON(json) {
    return new VerificationEvent(json);
  }
}
