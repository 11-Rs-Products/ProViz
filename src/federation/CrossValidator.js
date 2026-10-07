import { EvidenceAuthority } from './EvidenceAuthority.js';

/**
 * Validates verification results and evidence across independent agents
 */
export class CrossValidator {
  static validate({ sourceAgent, validatorAgent, evidence, validatorResult, scopeMatch = true }) {
    if (!evidence || !validatorResult) {
      return {
        status: 'UNVALIDATED',
        reason: 'Missing evidence or validator result',
        evidence
      };
    }

    const isSourceFormal = EvidenceAuthority.isFormalEvidence(evidence.evidenceKind || evidence.kind);
    const isValidatorFormal = EvidenceAuthority.isFormalEvidence(validatorResult.evidenceKind || validatorResult.kind);

    // If source is formal proof and scopes do not match, empirical disagreement cannot invalidate formal proof
    if (isSourceFormal && !scopeMatch && !isValidatorFormal) {
      return {
        status: 'CONFIRMED',
        reason: 'Formal proof holds within its scope; empirical test mismatch outside scope does not invalidate proof',
        evidence,
        preservedFormalStatus: true
      };
    }

    // Direct agreement
    const sourceStatus = evidence.status || (evidence.counterexample ? 'COUNTEREXAMPLE_FOUND' : 'PROVED');
    const targetStatus = validatorResult.status || (validatorResult.counterexample ? 'COUNTEREXAMPLE_FOUND' : 'PROVED');

    if (sourceStatus === targetStatus) {
      return {
        status: 'CONFIRMED',
        reason: `Validator confirmed status '${sourceStatus}'`,
        evidence
      };
    }

    // Partial confirmation (e.g. static proof confirmed by dynamic test passing)
    if (sourceStatus === 'PROVED' && (targetStatus === 'PASS' || targetStatus === 'ALL_TESTS_PASSED')) {
      return {
        status: 'CONFIRMED',
        reason: 'Runtime tests confirmed static proof without counterexamples',
        evidence
      };
    }

    // Formal proof vs empirical test disagreement within scope
    if (isSourceFormal && !isValidatorFormal && scopeMatch) {
      return {
        status: 'PARTIALLY_CONFIRMED',
        reason: 'Formal proof holds; empirical test anomaly flagged for investigation without invalidating proof semantics',
        evidence,
        investigationRequired: true
      };
    }

    // Genuine disagreement
    return {
      status: 'DISAGREEMENT',
      reason: `Source concluded '${sourceStatus}' but validator concluded '${targetStatus}'`,
      evidence,
      validatorResult
    };
  }
}
