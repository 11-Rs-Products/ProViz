/**
 * VerificationTaskStatus.js
 * Lifecycle status of continuous verification tasks.
 */

export const VerificationTaskStatus = Object.freeze({
  QUEUED: 'QUEUED',
  READY: 'READY',
  RUNNING: 'RUNNING',
  BLOCKED: 'BLOCKED',
  SUCCEEDED: 'SUCCEEDED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
  STALE: 'STALE',
  SUPERSEDED: 'SUPERSEDED'
});
