/**
 * PipelinePlanner.js
 * Dynamically constructs optimized execution plans of VerificationPhases based on change risk and scope.
 */

import { VerificationPhase } from './VerificationPhase.js';

export class PipelinePlanner {
  /**
   * Plan pipeline phases
   * @param {Object} options
   * @param {string} [options.riskLevel='LOW'] - 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
   * @param {boolean} [options.needsRepair=false]
   * @param {boolean} [options.needsCertification=true]
   */
  plan(options = {}) {
    const { riskLevel = 'LOW', needsRepair = false, needsCertification = true } = options;

    const phases = [
      VerificationPhase.OBSERVE,
      VerificationPhase.DETECT,
      VerificationPhase.MODEL,
      VerificationPhase.ASSESS_IMPACT,
      VerificationPhase.GENERATE_OBLIGATIONS,
      VerificationPhase.PRIORITIZE,
      VerificationPhase.VERIFY
    ];

    if (needsRepair || riskLevel === 'HIGH' || riskLevel === 'CRITICAL') {
      phases.push(VerificationPhase.DIAGNOSE);
      phases.push(VerificationPhase.REPAIR);
      phases.push(VerificationPhase.REVERIFY);
    }

    phases.push(VerificationPhase.GOVERN);

    if (needsCertification) {
      phases.push(VerificationPhase.CERTIFY);
    }

    phases.push(VerificationPhase.SYNC_KNOWLEDGE);
    phases.push(VerificationPhase.UPDATE_STATE);

    return {
      planId: `PLAN_${Date.now()}`,
      riskLevel,
      phases,
      phaseCount: phases.length,
      estimatedDurationMs: phases.length * 20
    };
  }
}
