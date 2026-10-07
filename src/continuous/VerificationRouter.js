/**
 * VerificationRouter.js
 * Routes verification obligations to the appropriate specialized engines (Stages 15–33).
 */

import { ObligationKind } from './VerificationObligation.js';

export class VerificationRouter {
  /**
   * Routes an obligation to its corresponding target engine identifier.
   * @param {import('./VerificationObligation.js').VerificationObligation} obligation
   * @returns {{ engineId: string, engineName: string, stage: number }}
   */
  route(obligation) {
    const kind = obligation.kind;

    switch (kind) {
      case ObligationKind.NULL_SAFETY:
      case ObligationKind.TYPE_SAFETY:
        return { engineId: 'static', engineName: 'StaticVerificationEngine', stage: 15 };

      case ObligationKind.CONTRACT_PRESERVATION:
        return { engineId: 'specification', engineName: 'SpecificationEngine', stage: 22 };

      case ObligationKind.SECURITY_PROPERTY:
        return { engineId: 'security', engineName: 'SecurityEngine', stage: 31 };

      case ObligationKind.PERFORMANCE_THRESHOLD:
      case ObligationKind.RESOURCE_BOUND:
        return { engineId: 'performance', engineName: 'PerformanceEngine', stage: 32 };

      case ObligationKind.RACE_FREEDOM:
      case ObligationKind.DEADLOCK_FREEDOM:
      case ObligationKind.TEMPORAL_PROPERTY:
        return { engineId: 'concurrency', engineName: 'ConcurrencyEngine', stage: 33 };

      case ObligationKind.API_COMPATIBILITY:
        return { engineId: 'semantic', engineName: 'SemanticEngine', stage: 29 };

      case ObligationKind.TEST_ADEQUACY:
        return { engineId: 'regression', engineName: 'RegressionEngine', stage: 21 };

      case ObligationKind.RELIABILITY_BOUND:
        return { engineId: 'performance', engineName: 'PerformanceEngine', stage: 32 };

      default:
        return { engineId: 'federation', engineName: 'FederationEngine', stage: 27 };
    }
  }
}
