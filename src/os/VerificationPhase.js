/**
 * VerificationPhase.js
 * Enum of unified verification pipeline execution phases.
 */

export const VerificationPhase = Object.freeze({
  OBSERVE: 'OBSERVE',
  DETECT: 'DETECT',
  MODEL: 'MODEL',
  ASSESS_IMPACT: 'ASSESS_IMPACT',
  GENERATE_OBLIGATIONS: 'GENERATE_OBLIGATIONS',
  PRIORITIZE: 'PRIORITIZE',
  VERIFY: 'VERIFY',
  DIAGNOSE: 'DIAGNOSE',
  REPAIR: 'REPAIR',
  REVERIFY: 'REVERIFY',
  GOVERN: 'GOVERN',
  CERTIFY: 'CERTIFY',
  SYNC_KNOWLEDGE: 'SYNC_KNOWLEDGE',
  UPDATE_STATE: 'UPDATE_STATE'
});
