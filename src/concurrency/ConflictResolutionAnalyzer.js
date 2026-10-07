/**
 * ConflictResolutionAnalyzer.js
 * Evaluates conflict resolution strategies (LWW, CRDT, merge functions, vector clocks).
 */

export class ConflictResolutionAnalyzer {
  /**
   * Resolves concurrent updates using Last-Write-Wins (LWW) or custom merge strategy.
   * @param {Array<{ key: string, value: any, timestamp: number, nodeId: string, vectorClock?: Object }>} updates
   * @param {Object} [strategy={ type: 'LWW' }]
   * @returns {{ resolvedState: Object, conflictsResolved: number }}
   */
  resolveUpdates(updates, strategy = { type: 'LWW' }) {
    const resolvedState = {};
    let conflictsResolved = 0;

    const keyUpdates = new Map();
    for (const update of updates) {
      if (!keyUpdates.has(update.key)) {
        keyUpdates.set(update.key, []);
      }
      keyUpdates.get(update.key).push(update);
    }

    for (const [key, upList] of keyUpdates.entries()) {
      if (upList.length === 1) {
        resolvedState[key] = upList[0].value;
      } else {
        conflictsResolved += upList.length - 1;
        if (strategy.type === 'LWW') {
          // Highest timestamp wins; tie-break by nodeId
          const winner = upList.reduce((best, curr) => {
            if (curr.timestamp > best.timestamp) return curr;
            if (curr.timestamp === best.timestamp && curr.nodeId > best.nodeId) return curr;
            return best;
          }, upList[0]);
          resolvedState[key] = winner.value;
        } else if (strategy.type === 'CRDT_SET_UNION') {
          // Set union of array values
          const set = new Set();
          for (const u of upList) {
            if (Array.isArray(u.value)) {
              u.value.forEach(item => set.add(item));
            } else {
              set.add(u.value);
            }
          }
          resolvedState[key] = Array.from(set);
        } else if (typeof strategy.merge === 'function') {
          resolvedState[key] = strategy.merge(upList);
        }
      }
    }

    return {
      resolvedState,
      conflictsResolved
    };
  }
}
