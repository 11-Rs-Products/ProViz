/**
 * ReplicationAnalyzer.js
 * Analyzes replica convergence, sync lag, and divergence across distributed nodes.
 */

export class ReplicationAnalyzer {
  /**
   * Evaluates replica convergence across nodes.
   * @param {Map<string, Object>|Object} replicaStates nodeId -> state object
   * @returns {{ converged: boolean, divergenceSummary: Object, replicas: Array<string> }}
   */
  checkConvergence(replicaStates) {
    const entries = replicaStates instanceof Map
      ? Array.from(replicaStates.entries())
      : Object.entries(replicaStates);

    if (entries.length <= 1) {
      return {
        converged: true,
        divergenceSummary: {},
        replicas: entries.map(([n]) => n)
      };
    }

    const firstStateStr = JSON.stringify(entries[0][1]);
    const divergence = {};
    let converged = true;

    for (let i = 1; i < entries.length; i++) {
      const [nodeId, state] = entries[i];
      const stateStr = JSON.stringify(state);
      if (stateStr !== firstStateStr) {
        converged = false;
        divergence[nodeId] = {
          expected: entries[0][1],
          actual: state
        };
      }
    }

    return {
      converged,
      divergenceSummary: divergence,
      replicas: entries.map(([n]) => n)
    };
  }
}
