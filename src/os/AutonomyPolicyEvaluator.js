/**
 * AutonomyPolicyEvaluator.js
 * Evaluates requested autonomous actions against active AutonomyPolicySet and current runtime autonomy level.
 */

import { AutonomyPolicySet } from './AutonomyPolicySet.js';
import { AutonomyDecision, AutonomyOutcome } from './AutonomyDecision.js';

export class AutonomyPolicyEvaluator {
  /**
   * @param {AutonomyPolicySet} [policySet]
   * @param {string} [currentAutonomyLevel='LEVEL_3_AUTO_REPAIR']
   */
  constructor(policySet = new AutonomyPolicySet(), currentAutonomyLevel = 'LEVEL_3_AUTO_REPAIR') {
    this.policySet = policySet;
    this.currentAutonomyLevel = currentAutonomyLevel;
  }

  setAutonomyLevel(level) {
    this.currentAutonomyLevel = level;
  }

  /**
   * Evaluate permission for an operation
   * @param {string} operation
   * @param {Object} [context={}]
   * @param {string} [context.risk='LOW']
   */
  evaluate(operation, context = {}) {
    const policy = this.policySet.getPolicyForOperation(operation);
    const risk = context.risk || 'LOW';

    // Level 0: Observe Only
    if (this.currentAutonomyLevel === 'LEVEL_0_OBSERVE_ONLY') {
      if (operation !== 'OBSERVE' && operation !== 'ANALYZE') {
        return new AutonomyDecision({
          operation,
          outcome: AutonomyOutcome.PROHIBITED,
          reason: 'Runtime configured in LEVEL_0_OBSERVE_ONLY mode',
          currentAutonomyLevel: this.currentAutonomyLevel
        });
      }
    }

    // High risk or explicit policy approval requirement
    if (policy?.requiresHumanApproval || risk === 'HIGH' || risk === 'CRITICAL') {
      return new AutonomyDecision({
        operation,
        outcome: AutonomyOutcome.REQUIRES_HUMAN_APPROVAL,
        reason: `High risk (${risk}) or policy requirement requires explicit operator approval`,
        requiredAutonomyLevel: policy ? policy.minAutonomyLevel : 'LEVEL_4_AUTO_REFACTOR',
        currentAutonomyLevel: this.currentAutonomyLevel
      });
    }

    return new AutonomyDecision({
      operation,
      outcome: AutonomyOutcome.ALLOWED,
      reason: `Operation permitted under ${this.currentAutonomyLevel}`,
      currentAutonomyLevel: this.currentAutonomyLevel
    });
  }
}
