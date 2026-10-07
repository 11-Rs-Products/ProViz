/**
 * PartialOrderReducer.js
 * Reduces equivalent concurrent schedules using partial-order reduction (POR) and sleep sets.
 */

import { IndependenceAnalyzer } from './IndependenceAnalyzer.js';

export class PartialOrderReducer {
  constructor(independenceAnalyzer = new IndependenceAnalyzer()) {
    this.independenceAnalyzer = independenceAnalyzer;
  }

  /**
   * Filters a list of schedules by removing equivalent interleavings of independent events.
   * @param {Array<import('./Schedule.js').Schedule>} schedules
   * @returns {Array<import('./Schedule.js').Schedule>}
   */
  reduceSchedules(schedules) {
    if (schedules.length <= 1) return schedules;

    const uniqueSignatures = new Set();
    const reduced = [];

    for (const schedule of schedules) {
      const sig = this._computeCanonicalSignature(schedule.events);
      if (!uniqueSignatures.has(sig)) {
        uniqueSignatures.add(sig);
        reduced.push(schedule);
      }
    }

    return reduced;
  }

  /**
   * Computes a canonical signature for a sequence of events based on dependent pairs.
   * @private
   */
  _computeCanonicalSignature(events) {
    // A simple representation: for every pair of dependent events (e1, e2), record order (e1 < e2)
    const orderConstraints = [];
    for (let i = 0; i < events.length; i++) {
      for (let j = i + 1; j < events.length; j++) {
        const evA = events[i];
        const evB = events[j];
        if (!this.independenceAnalyzer.areIndependent(evA, evB)) {
          orderConstraints.push(`${evA.id}<${evB.id}`);
        }
      }
    }
    return orderConstraints.sort().join(';');
  }
}
