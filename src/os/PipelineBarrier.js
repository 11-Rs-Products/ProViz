/**
 * PipelineBarrier.js
 * Synchronization barrier ensuring all prerequisite phases or concurrent verification tasks complete before proceeding.
 */

export class PipelineBarrier {
  /**
   * @param {Object} options
   * @param {string} options.barrierId
   * @param {string[]} [options.requiredPhases=[]]
   */
  constructor({ barrierId, requiredPhases = [] }) {
    if (!barrierId) throw new Error('PipelineBarrier requires barrierId');
    this.barrierId = barrierId;
    this.requiredPhases = new Set(requiredPhases);
    this.completedPhases = new Set();
  }

  markPhaseCompleted(phase) {
    this.completedPhases.add(phase);
  }

  isSatisfied() {
    for (const req of this.requiredPhases) {
      if (!this.completedPhases.has(req)) return false;
    }
    return true;
  }
}
