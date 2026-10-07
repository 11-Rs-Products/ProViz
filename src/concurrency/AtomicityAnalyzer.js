/**
 * AtomicityAnalyzer.js
 * Detects atomicity violations: interleaved conflicting accesses inside atomic regions,
 * check-then-act races, and broken critical sections.
 */

export class AtomicityAnalyzer {
  /**
   * Analyzes an execution trace against defined atomic regions.
   * @param {Array<{ id: string, contextId: string, resourceId?: string, isWrite?: boolean, kind?: string }>} trace
   * @param {Array<import('./AtomicRegion.js').AtomicRegion>} regions
   * @returns {Array<{ regionId: string, interveningEventId: string, contextId: string, violation: string }>}
   */
  detectViolations(trace, regions) {
    const violations = [];
    const eventIndexMap = new Map();
    trace.forEach((ev, idx) => eventIndexMap.set(ev.id, idx));

    for (const region of regions) {
      const startIndex = eventIndexMap.get(region.startEventId);
      const endIndex = eventIndexMap.get(region.endEventId);

      if (startIndex === undefined || endIndex === undefined || startIndex >= endIndex) {
        continue;
      }

      // Check all events between start and end
      for (let i = startIndex + 1; i < endIndex; i++) {
        const ev = trace[i];
        if (ev.contextId !== region.contextId) {
          // If the intervening event accesses any resource protected by the region
          if (region.resourceIds.length === 0 || (ev.resourceId && region.resourceIds.includes(ev.resourceId))) {
            violations.push({
              regionId: region.id,
              interveningEventId: ev.id,
              contextId: ev.contextId,
              resourceId: ev.resourceId,
              violation: `Atomicity violation in region '${region.id}' of context ${region.contextId}: context ${ev.contextId} performed intervening operation ${ev.id} on resource ${ev.resourceId || 'shared'}.`
            });
          }
        }
      }
    }

    return violations;
  }
}
