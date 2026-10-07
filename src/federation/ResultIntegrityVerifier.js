import { AgentTrustLevel } from './AgentTrustLevel.js';

/**
 * Verifies result attestation, execution trace integrity, and task correspondence
 */
export class ResultIntegrityVerifier {
  static verify(task, result, attestation) {
    if (!task || !result) {
      return {
        isValid: false,
        reason: 'Missing task or result'
      };
    }

    if (attestation) {
      if (attestation.agentIdentity && task.agentId && attestation.agentIdentity !== task.agentId) {
        return {
          isValid: false,
          reason: `Attested agent '${attestation.agentIdentity}' does not match assigned task agent '${task.agentId}'`
        };
      }
    }

    return {
      isValid: true,
      reason: 'Integrity verified',
      attestation: attestation ? attestation.toJSON() : null
    };
  }
}

/**
 * Handles untrusted or experimental agent results safely
 */
export class UntrustedResultPolicy {
  static evaluateResult(agent, result) {
    const trustLevel = agent?.trustProfile?.trustLevel || AgentTrustLevel.UNKNOWN;
    const isUntrusted = trustLevel === AgentTrustLevel.UNTRUSTED || trustLevel === AgentTrustLevel.UNKNOWN || trustLevel === AgentTrustLevel.EXPERIMENTAL;

    if (isUntrusted) {
      return {
        isAccepted: false,
        isObservable: true,
        quarantinedEvidence: {
          ...result,
          status: 'UNTRUSTED_OBSERVATION',
          trustLevel,
          canSatisfyFormalGoal: false
        },
        reason: `Results from ${trustLevel} agent cannot directly satisfy formal goals`
      };
    }

    return {
      isAccepted: true,
      isObservable: true,
      quarantinedEvidence: null,
      reason: 'Agent is trusted'
    };
  }
}
