import { FederationFailureType } from './FederationFailure.js';

export const RecoveryStrategy = Object.freeze({
  REDIRECT: 'REDIRECT',
  RETRY: 'RETRY',
  REPLICATE: 'REPLICATE',
  CROSS_VALIDATE: 'CROSS_VALIDATE',
  DEGRADE: 'DEGRADE',
  ABORT: 'ABORT'
});

/**
 * Determines and executes recovery policies for federation failures
 */
export class FederationRecovery {
  static determineStrategy(failure, attemptCount = 0) {
    if (!failure) return RecoveryStrategy.ABORT;

    switch (failure.failureType) {
      case FederationFailureType.AGENT_OFFLINE:
        return RecoveryStrategy.REDIRECT;

      case FederationFailureType.AGENT_TIMEOUT:
        return attemptCount < 2 ? RecoveryStrategy.RETRY : RecoveryStrategy.REDIRECT;

      case FederationFailureType.INVALID_RESULT:
      case FederationFailureType.INCONSISTENT_RESULT:
        return RecoveryStrategy.CROSS_VALIDATE;

      case FederationFailureType.RESOURCE_FAILURE:
        return RecoveryStrategy.DEGRADE;

      case FederationFailureType.ENVIRONMENT_FAILURE:
      case FederationFailureType.PROTOCOL_FAILURE:
        return RecoveryStrategy.REDIRECT;

      default:
        return attemptCount < 1 ? RecoveryStrategy.RETRY : RecoveryStrategy.ABORT;
    }
  }

  static applyRecovery({ failure, strategy, fallbackAgents = [], retryTask }) {
    switch (strategy) {
      case RecoveryStrategy.REDIRECT: {
        const nextAgent = fallbackAgents.find(a => a.agentId !== failure.agentId && a.isAvailable());
        return {
          recovered: Boolean(nextAgent),
          strategy,
          targetAgentId: nextAgent ? nextAgent.agentId : null,
          action: nextAgent ? 'REASSIGNED' : 'NO_FALLBACK_AVAILABLE'
        };
      }

      case RecoveryStrategy.RETRY:
        return {
          recovered: true,
          strategy,
          targetAgentId: failure.agentId,
          action: 'RETRY_INITIATED'
        };

      case RecoveryStrategy.CROSS_VALIDATE:
        return {
          recovered: true,
          strategy,
          targetAgentId: failure.agentId,
          action: 'CROSS_VALIDATION_SCHEDULED'
        };

      case RecoveryStrategy.DEGRADE:
        return {
          recovered: true,
          strategy,
          action: 'GRACEFUL_DEGRADATION'
        };

      case RecoveryStrategy.ABORT:
      default:
        return {
          recovered: false,
          strategy,
          action: 'EXECUTION_ABORTED'
        };
    }
  }
}
