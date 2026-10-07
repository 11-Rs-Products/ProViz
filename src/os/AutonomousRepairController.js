/**
 * AutonomousRepairController.js
 * High-level coordinator for autonomous program repair validating across preservation, security, performance, concurrency, regression, and governance gates.
 */

import { AutonomousTransaction, TransactionManager } from './AutonomousTransaction.js';
import { AutonomyPolicyEvaluator } from './AutonomyPolicyEvaluator.js';

export class AutonomousRepairController {
  /**
   * @param {Object} [options]
   * @param {TransactionManager} [options.transactionManager]
   * @param {AutonomyPolicyEvaluator} [options.autonomyEvaluator]
   */
  constructor(options = {}) {
    this.transactionManager = options.transactionManager || new TransactionManager();
    this.autonomyEvaluator = options.autonomyEvaluator || new AutonomyPolicyEvaluator();
  }

  /**
   * Execute verified autonomous repair transaction
   * @param {Object} finding
   * @param {Object} candidateRepair
   * @param {Object} [gateContext={}]
   */
  async executeRepair(finding, candidateRepair, gateContext = {}) {
    const baseRevision = gateContext.currentRevision || 1;
    const tx = this.transactionManager.beginTransaction(baseRevision, gateContext.checkpointState || {});

    // 1. Autonomy Policy Check
    const autonomyDecision = this.autonomyEvaluator.evaluate('AUTO_REPAIR', { risk: candidateRepair.risk || 'LOW' });
    if (!autonomyDecision.isAllowed) {
      if (autonomyDecision.requiresHumanApproval) {
        return {
          status: 'ESCALATED',
          transactionId: tx.id,
          reason: autonomyDecision.reason,
          candidateRepair
        };
      }
      this.transactionManager.rollbackTransaction(tx.id);
      return {
        status: 'REJECTED_POLICY',
        transactionId: tx.id,
        reason: autonomyDecision.reason
      };
    }

    // 2. Multi-Gate Validation (Preservation, Security, Performance, Concurrency, Regression, Governance)
    const gates = {
      preservationPassed: gateContext.preservationPassed !== false,
      securityGatePassed: gateContext.securityGatePassed !== false,
      performanceGatePassed: gateContext.performanceGatePassed !== false,
      concurrencyGatePassed: gateContext.concurrencyGatePassed !== false,
      regressionPassed: gateContext.regressionPassed !== false,
      governancePassed: gateContext.governancePassed !== false
    };

    const allGatesPassed = Object.values(gates).every(Boolean);

    if (allGatesPassed) {
      this.transactionManager.commitTransaction(tx.id);
      return {
        status: 'COMMITTED',
        transactionId: tx.id,
        gates,
        repairId: candidateRepair.id,
        timestamp: Date.now()
      };
    } else {
      const rollbackRes = this.transactionManager.rollbackTransaction(tx.id, gateContext.stateCoordinator);
      return {
        status: 'ROLLED_BACK',
        transactionId: tx.id,
        gates,
        rollback: rollbackRes,
        reason: 'One or more verification gates failed during candidate repair validation'
      };
    }
  }
}
