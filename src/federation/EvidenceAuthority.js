import { AgentTrustLevel } from './AgentTrustLevel.js';

/**
 * Determines permitted evidence types per trust level and protects formal proof invariants.
 */
export class EvidenceAuthority {
  static getPermittedEvidenceKinds(trustLevel) {
    switch (trustLevel) {
      case AgentTrustLevel.FORMAL:
        return Object.freeze([
          'FORMAL_PROOF',
          'THEOREM',
          'UNSAT_CORE',
          'EXHAUSTIVE_BOUND',
          'SYMBOLIC_MODEL',
          'INVARIANT_PROOF',
          'COUNTEREXAMPLE',
          'TEST_RESULT',
          'EMPIRICAL_OBSERVATION'
        ]);
      case AgentTrustLevel.VERIFIED:
        return Object.freeze([
          'SYMBOLIC_MODEL',
          'INVARIANT_PROOF',
          'SOUND_STATIC_ANALYSIS',
          'COUNTEREXAMPLE',
          'TEST_RESULT',
          'EMPIRICAL_OBSERVATION'
        ]);
      case AgentTrustLevel.TRUSTED:
        return Object.freeze([
          'CONCOLIC_TRACE',
          'DYNAMIC_INVARIANT',
          'MUTATION_KILL',
          'REPAIR_CANDIDATE',
          'COUNTEREXAMPLE',
          'TEST_RESULT',
          'EMPIRICAL_OBSERVATION'
        ]);
      case AgentTrustLevel.STANDARD:
        return Object.freeze([
          'TEST_RESULT',
          'RUNTIME_OBSERVATION',
          'METAMORPHIC_PASS',
          'MUTATION_SURVIVOR',
          'EMPIRICAL_OBSERVATION'
        ]);
      case AgentTrustLevel.EXPERIMENTAL:
      case AgentTrustLevel.UNTRUSTED:
      case AgentTrustLevel.UNKNOWN:
      default:
        return Object.freeze([
          'HEURISTIC_HINT',
          'EMPIRICAL_OBSERVATION',
          'UNVERIFIED_PROPOSAL'
        ]);
    }
  }

  static canProduceEvidence(trustLevel, evidenceKind) {
    const permitted = this.getPermittedEvidenceKinds(trustLevel);
    return permitted.includes(evidenceKind);
  }

  static isFormalEvidence(evidenceKind) {
    return [
      'FORMAL_PROOF',
      'THEOREM',
      'UNSAT_CORE',
      'EXHAUSTIVE_BOUND',
      'INVARIANT_PROOF'
    ].includes(evidenceKind);
  }

  static sanitizeEvidence(agent, evidence) {
    if (!evidence) return null;
    const kind = evidence.evidenceKind || evidence.kind || 'EMPIRICAL_OBSERVATION';
    const trustLevel = agent?.trustProfile?.trustLevel || AgentTrustLevel.UNKNOWN;

    // Safety Invariant: empirical or untrusted agents cannot produce formal proofs
    if (this.isFormalEvidence(kind) && trustLevel !== AgentTrustLevel.FORMAL && trustLevel !== AgentTrustLevel.VERIFIED) {
      return {
        ...evidence,
        evidenceKind: 'EMPIRICAL_OBSERVATION',
        originalRequestedKind: kind,
        sanitizedReason: `Trust level ${trustLevel} is not authorized to assert formal evidence '${kind}'`
      };
    }
    return evidence;
  }
}
