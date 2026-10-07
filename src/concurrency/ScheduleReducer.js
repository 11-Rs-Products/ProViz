/**
 * ScheduleReducer.js
 * Minimizes failing schedules while preserving the failure condition (delta debugging).
 */

import { Schedule } from './Schedule.js';

export class ScheduleReducer {
  /**
   * Minimizes a failing schedule by removing unnecessary intermediate events.
   * @param {Schedule} failingSchedule
   * @param {Function} testFailurePredicate Returns true if schedule still produces the failure
   * @returns {Schedule} Minimal failing schedule
   */
  minimizeSchedule(failingSchedule, testFailurePredicate) {
    let current = failingSchedule;
    let improved = true;

    while (improved) {
      improved = false;
      for (let i = 0; i < current.events.length; i++) {
        // Try candidate without event i
        const candidate = current.withoutEventIndex(i);
        if (candidate.events.length > 0 && testFailurePredicate(candidate)) {
          current = candidate;
          improved = true;
          break; // restart reduction with smaller schedule
        }
      }
    }

    return current;
  }
}
