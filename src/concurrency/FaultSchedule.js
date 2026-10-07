/**
 * FaultSchedule.js
 * Represents a sequence of temporal faults injected over time.
 */

export class FaultSchedule {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {string} [options.name='']
   * @param {Array<import('./DistributedFault.js').DistributedFault>} [options.faults=[]]
   * @param {number} [options.maxDuration=1000]
   */
  constructor({
    id,
    name = '',
    faults = [],
    maxDuration = 1000
  }) {
    if (!id) throw new Error('FaultSchedule requires id');
    this.id = id;
    this.name = name || id;
    this.faults = Object.freeze([...faults].sort((a, b) => a.triggerTime - b.triggerTime));
    this.maxDuration = maxDuration;
    Object.freeze(this);
  }

  getActiveFaultsAt(timestamp) {
    return this.faults.filter(f => {
      const start = f.triggerTime;
      const end = f.triggerTime + f.duration;
      return timestamp >= start && (f.duration === 0 ? timestamp === start : timestamp <= end);
    });
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      faultsCount: this.faults.length,
      faults: this.faults.map(f => f.toJSON ? f.toJSON() : f),
      maxDuration: this.maxDuration
    };
  }
}
