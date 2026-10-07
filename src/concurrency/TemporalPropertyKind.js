/**
 * TemporalPropertyKind.js
 * Canonical temporal logic property kinds and operators.
 */

export const TemporalPropertyKind = Object.freeze({
  ALWAYS: 'ALWAYS', // G p (Globally)
  EVENTUALLY: 'EVENTUALLY', // F p (Finally / In the future)
  UNTIL: 'UNTIL', // p U q
  NEXT: 'NEXT', // X p
  RESPONSE: 'RESPONSE', // G (p -> F q)
  PRECEDENCE: 'PRECEDENCE', // G (q -> O p) or ~q W p
  ABSENCE: 'ABSENCE', // G (~p)
  BOUNDED_RESPONSE: 'BOUNDED_RESPONSE', // G (p -> F<=T q)
  BOUNDED_WAIT: 'BOUNDED_WAIT', // G (p -> G<=T ~q)
  STABILITY: 'STABILITY', // F G p
  RECOVERY: 'RECOVERY' // G (failure -> F<=R recovery)
});
