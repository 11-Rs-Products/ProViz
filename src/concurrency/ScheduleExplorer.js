/**
 * ScheduleExplorer.js
 * Performs bounded schedule exploration with partial-order reduction, depth bounds, and state hashing.
 */

import { ScheduleGenerator } from './ScheduleGenerator.js';
import { PartialOrderReducer } from './PartialOrderReducer.js';

export class ScheduleExplorer {
  /**
   * @param {Object} [options={}]
   * @param {ScheduleGenerator} [options.generator]
   * @param {PartialOrderReducer} [options.reducer]
   */
  constructor({
    generator = new ScheduleGenerator(),
    reducer = new PartialOrderReducer()
  } = {}) {
    this.generator = generator;
    this.reducer = reducer;
  }

  /**
   * Explores schedules up to maxSchedules and maxDepth, applying POR if enabled.
   * @param {Map<string, Array<Object>>|Object} contextEventsMap
   * @param {Object} [options={}]
   * @param {number} [options.maxSchedules=100]
   * @param {number} [options.maxDepth=50]
   * @param {boolean} [options.usePOR=true]
   * @returns {{ exploredCount: number, schedules: Array<import('./Schedule.js').Schedule>, prunedCount: number }}
   */
  explore(contextEventsMap, { maxSchedules = 100, maxDepth = 50, usePOR = true } = {}) {
    // Truncate per-context event lists to maxDepth
    const boundedMap = {};
    const entries = contextEventsMap instanceof Map
      ? Array.from(contextEventsMap.entries())
      : Object.entries(contextEventsMap);

    for (const [ctxId, events] of entries) {
      boundedMap[ctxId] = events.slice(0, maxDepth);
    }

    const generated = this.generator.generateInterleavings(boundedMap, { maxSchedules });
    let finalSchedules = generated;
    let prunedCount = 0;

    if (usePOR) {
      finalSchedules = this.reducer.reduceSchedules(generated);
      prunedCount = generated.length - finalSchedules.length;
    }

    return {
      exploredCount: generated.length,
      prunedCount,
      schedules: finalSchedules
    };
  }
}
