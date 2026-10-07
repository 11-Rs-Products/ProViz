/**
 * LockOrderAnalyzer.js
 * Detects lock inversion cycles and potential deadlocks from lock order graphs.
 */

export class LockOrderAnalyzer {
  /**
   * Detects all elementary cycles in the given LockOrderGraph.
   * @param {import('./LockOrderGraph.js').LockOrderGraph} graph
   * @returns {Array<{ cycle: Array<string>, contexts: Array<string>, severity: string, message: string }>}
   */
  analyzeCycles(graph) {
    const allLocks = graph.getAllLocks();
    const cycles = [];
    const visited = new Set();
    const recStack = [];

    const dfs = (curr) => {
      visited.add(curr);
      recStack.push(curr);

      const neighbors = graph.getDirectDependencies(curr);
      for (const next of neighbors) {
        if (!visited.has(next)) {
          dfs(next);
        } else if (recStack.includes(next)) {
          const cycleStartIndex = recStack.indexOf(next);
          const cyclePath = [...recStack.slice(cycleStartIndex), next];
          
          // Collect contexts involved
          const contexts = new Set();
          for (let i = 0; i < cyclePath.length - 1; i++) {
            const edgeKey = `${cyclePath[i]}->${cyclePath[i + 1]}`;
            const ctxs = graph.contextsPerEdge.get(edgeKey);
            if (ctxs) {
              for (const c of ctxs) contexts.add(c);
            }
          }

          cycles.push({
            cycle: cyclePath,
            contexts: Array.from(contexts),
            severity: 'CRITICAL',
            message: `Lock inversion detected: ${cyclePath.join(' -> ')} creates potential deadlock.`
          });
        }
      }

      recStack.pop();
    };

    for (const lock of allLocks) {
      if (!visited.has(lock)) {
        dfs(lock);
      }
    }

    return cycles;
  }
}
