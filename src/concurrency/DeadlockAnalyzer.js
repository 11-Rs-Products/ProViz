/**
 * DeadlockAnalyzer.js
 * Analyzes wait-for graphs and lock allocations to detect deadlocks.
 */

export class DeadlockAnalyzer {
  /**
   * Detects deadlock cycles in a WaitForGraph.
   * @param {import('./DeadlockModel.js').WaitForGraph} wfg
   * @returns {Array<{ cycle: Array<string>, resources: Array<string>, severity: string, message: string }>}
   */
  detectDeadlocks(wfg) {
    const contexts = wfg.getContexts();
    const deadlocks = [];
    const visited = new Set();
    const recStack = [];

    const dfs = (curr) => {
      visited.add(curr);
      recStack.push(curr);

      const waitingOn = wfg.getWaitingOn(curr);
      for (const next of waitingOn) {
        if (!visited.has(next)) {
          dfs(next);
        } else if (recStack.includes(next)) {
          const cycleStartIndex = recStack.indexOf(next);
          const cycle = [...recStack.slice(cycleStartIndex), next];

          const resources = [];
          for (let i = 0; i < cycle.length - 1; i++) {
            const key = `${cycle[i]}->${cycle[i + 1]}`;
            const res = wfg.resourceMap.get(key);
            if (res) resources.push(res);
          }

          deadlocks.push({
            cycle,
            resources,
            severity: 'CRITICAL',
            message: `Deadlock cycle detected: contexts [${cycle.join(' -> ')}] are circularly waiting on resources [${resources.join(', ')}].`
          });
        }
      }

      recStack.pop();
    };

    for (const ctx of contexts) {
      if (!visited.has(ctx)) {
        dfs(ctx);
      }
    }

    return deadlocks;
  }
}
