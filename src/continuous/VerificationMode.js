/**
 * VerificationMode.js
 * Trigger modes and verification intensity presets.
 */

export const VerificationTriggerMode = Object.freeze({
  ON_CHANGE: 'ON_CHANGE',
  ON_SAVE: 'ON_SAVE',
  ON_COMMIT: 'ON_COMMIT',
  ON_BRANCH: 'ON_BRANCH',
  ON_PULL_REQUEST: 'ON_PULL_REQUEST',
  SCHEDULED: 'SCHEDULED',
  CONTINUOUS: 'CONTINUOUS',
  MANUAL: 'MANUAL'
});

export const VerificationIntensity = Object.freeze({
  FAST: 'FAST', // Canary + minimal unit checks
  BALANCED: 'BALANCED', // Changed functions + direct dependencies + security/perf checks
  THOROUGH: 'THOROUGH', // Full transitive blast radius + concolic + mutation
  EXHAUSTIVE: 'EXHAUSTIVE' // Complete whole-system revalidation + model checking + all fault schedules
});
