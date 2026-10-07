/**
 * VerificationBarrier.js
 * Prevents downstream verification stages or repairs from executing until prerequisite upstream evidence is satisfied.
 */

export class VerificationBarrier {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {Array<string>} options.requiredObligationIds
   * @param {string} [options.name='']
   */
  constructor({ id, requiredObligationIds = [], name = '' }) {
    if (!id) throw new Error('VerificationBarrier requires id');
    this.id = id;
    this.requiredObligationIds = Object.freeze([...requiredObligationIds]);
    this.name = name || id;
    Object.freeze(this);
  }

  /**
   * Checks whether the barrier is unlocked by completed obligations.
   * @param {Set<string>|Array<string>} completedObligationIds
   * @returns {boolean}
   */
  isPassed(completedObligationIds) {
    const set = completedObligationIds instanceof Set ? completedObligationIds : new Set(completedObligationIds);
    return this.requiredObligationIds.every(reqId => set.has(reqId));
  }

  getMissingObligations(completedObligationIds) {
    const set = completedObligationIds instanceof Set ? completedObligationIds : new Set(completedObligationIds);
    return this.requiredObligationIds.filter(reqId => !set.has(reqId));
  }
}
