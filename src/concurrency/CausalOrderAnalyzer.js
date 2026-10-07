/**
 * CausalOrderAnalyzer.js
 * Analyzes whether observed or candidate execution traces violate causal ordering.
 */

export class CausalOrderAnalyzer {
  /**
   * Analyzes an execution trace against a happens-before graph to detect causal inversions.
   * @param {Array<{ id: string, timestamp?: number, contextId?: string }>} trace
   * @param {import('./HappensBeforeGraph.js').HappensBeforeGraph} hbGraph
   * @returns {Array<{ priorEvent: string, laterEvent: string, violation: string }>}
   */
  analyzeTrace(trace, hbGraph) {
    const violations = [];
    const eventIndexMap = new Map();
    trace.forEach((event, idx) => {
      eventIndexMap.set(event.id, idx);
    });

    for (let i = 0; i < trace.length; i++) {
      for (let j = i + 1; j < trace.length; j++) {
        const evA = trace[i].id;
        const evB = trace[j].id;

        // If evB happened before evA in the causal graph, but appears after evA in the trace:
        if (hbGraph.happensBefore(evB, evA)) {
          violations.push({
            priorEvent: evA,
            laterEvent: evB,
            violation: `Event ${evB} causally precedes ${evA} (B ->_HB A), but was executed after ${evA} at trace indices [${i}, ${j}].`
          });
        }
      }
    }

    return violations;
  }
}
