/**
 * RaceAnalyzer.js
 * Detects data races when two conflicting memory accesses are not ordered by happens-before.
 * Criterion: Conflict(A, B) && !HB(A, B) && !HB(B, A)
 */

import { AccessConflict } from './AccessConflict.js';

export class RaceAnalyzer {
  /**
   * Analyzes memory accesses and happens-before graph to detect data races.
   * @param {Array<import('./MemoryAccess.js').MemoryAccess>} accesses
   * @param {import('./HappensBeforeGraph.js').HappensBeforeGraph} hbGraph
   * @returns {Array<{ accessA: import('./MemoryAccess.js').MemoryAccess, accessB: import('./MemoryAccess.js').MemoryAccess, resourceId: string, type: string, message: string }>}
   */
  detectRaces(accesses, hbGraph) {
    const races = [];

    for (let i = 0; i < accesses.length; i++) {
      for (let j = i + 1; j < accesses.length; j++) {
        const accA = accesses[i];
        const accB = accesses[j];

        const conflict = AccessConflict.check(accA, accB);
        if (!conflict) continue;

        // Check if there is an ordering in happens-before graph
        const aHbB = hbGraph.happensBefore(accA.id, accB.id);
        const bHbA = hbGraph.happensBefore(accB.id, accA.id);

        if (!aHbB && !bHbA) {
          races.push({
            accessA: accA,
            accessB: accB,
            resourceId: conflict.resourceId,
            type: conflict.type,
            severity: 'CRITICAL',
            message: `Data race detected on resource '${conflict.resourceId}': context ${accA.contextId} (${accA.kind}) and context ${accB.contextId} (${accB.kind}) are concurrent without synchronization.`
          });
        }
      }
    }

    return races;
  }
}
