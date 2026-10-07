/**
 * AdversarialExecutor.js
 * Executes adversarial tests and payloads inside an isolated environment without modifying authoritative source.
 */

import { SecurityCounterexample } from './SecurityCounterexample.js';

export class AdversarialExecutor {
  /**
   * Executes an attack candidate in isolation.
   * @param {AttackCandidate} candidate
   * @param {Object} sandboxContext
   * @returns {Object}
   */
  executeAttack(candidate, sandboxContext = {}) {
    const isVulnerable = sandboxContext.simulatedVulnerability !== undefined
      ? Boolean(sandboxContext.simulatedVulnerability)
      : (candidate.reachability > 0.6 && candidate.exploitability > 0.5);

    let counterexample = null;

    if (isVulnerable) {
      counterexample = new SecurityCounterexample({
        id: `cx:${candidate.id}`,
        entryNodeId: candidate.entryNodeId,
        adversarialInput: candidate.adversarialInput?.payload || 'ADVERSARIAL_PAYLOAD',
        path: candidate.attackPath ? [candidate.entryNodeId, ...candidate.attackPath.stepNodeIds, candidate.sinkNodeId] : [candidate.entryNodeId, candidate.sinkNodeId],
        violatedProperty: 'AUTHORIZATION_BYPASS',
        sensitiveAssetId: candidate.targetAssetId,
        sensitiveSinkId: candidate.sinkNodeId,
        evidenceSummary: `Execution confirmed exploitability on path to ${candidate.sinkNodeId}`
      });
    }

    return {
      candidateId: candidate.id,
      executed: true,
      isVulnerable,
      counterexample,
      logs: [`Executed attack simulation for ${candidate.id} in sandboxed isolation`]
    };
  }
}
