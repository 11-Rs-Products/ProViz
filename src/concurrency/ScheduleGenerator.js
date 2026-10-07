/**
 * ScheduleGenerator.js
 * Generates alternative interleavings of concurrent execution contexts.
 */

import { Schedule } from './Schedule.js';

export class ScheduleGenerator {
  /**
   * Generates interleaving schedules from a map of contextId -> Array<Event>.
   * Preserves per-context sequential order while exploring valid concurrent interleavings.
   * @param {Map<string, Array<Object>>|Object} contextEventsMap
   * @param {Object} [options={}]
   * @param {number} [options.maxSchedules=50]
   * @returns {Array<Schedule>}
   */
  generateInterleavings(contextEventsMap, { maxSchedules = 50 } = {}) {
    const entries = contextEventsMap instanceof Map
      ? Array.from(contextEventsMap.entries())
      : Object.entries(contextEventsMap);

    const contexts = entries.map(([id, list]) => ({
      id,
      events: [...list],
      index: 0
    }));

    const totalEvents = contexts.reduce((sum, c) => sum + c.events.length, 0);
    const results = [];
    let scheduleCount = 0;

    const backtrack = (currentScheduleEvents) => {
      if (results.length >= maxSchedules) return;

      if (currentScheduleEvents.length === totalEvents) {
        scheduleCount++;
        results.push(new Schedule({
          id: `schedule-${scheduleCount}`,
          events: [...currentScheduleEvents]
        }));
        return;
      }

      for (let i = 0; i < contexts.length; i++) {
        const ctx = contexts[i];
        if (ctx.index < ctx.events.length) {
          const ev = ctx.events[ctx.index];
          ctx.index++;
          currentScheduleEvents.push(ev);

          backtrack(currentScheduleEvents);

          currentScheduleEvents.pop();
          ctx.index--;
        }
      }
    };

    backtrack([]);
    return results;
  }
}
