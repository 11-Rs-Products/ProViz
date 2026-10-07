/**
 * IndependenceAnalyzer.js
 * Determines whether two concurrent operations commute (are independent).
 * E.g., accesses on distinct variables or concurrent read-read accesses commute.
 */

export class IndependenceAnalyzer {
  /**
   * Checks whether eventA and eventB commute / are independent.
   * @param {Object} eventA
   * @param {Object} eventB
   * @returns {boolean}
   */
  areIndependent(eventA, eventB) {
    if (!eventA || !eventB) return false;
    // Operations in the same context/thread have program order dependency
    if (eventA.contextId && eventB.contextId && eventA.contextId === eventB.contextId) {
      return false;
    }

    // If accessing different resources/variables, they commute
    const resA = eventA.resourceId || eventA.target;
    const resB = eventB.resourceId || eventB.target;
    if (resA && resB && resA !== resB) {
      return true;
    }

    // If both are pure read operations on the same resource, they commute
    const isWriteA = eventA.isWrite || eventA.type === 'WRITE' || eventA.kind === 'WRITE';
    const isWriteB = eventB.isWrite || eventB.type === 'WRITE' || eventB.kind === 'WRITE';

    if (!isWriteA && !isWriteB) {
      return true;
    }

    return false;
  }
}
