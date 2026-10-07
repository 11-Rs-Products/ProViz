/**
 * ResourceBoundAnalyzer.js
 * Verifies whether observed or derived resource usage complies with active ResourceBounds.
 */

export class ResourceBoundAnalyzer {
  /**
   * Checks resource bounds against a snapshot.
   * @param {Array<ResourceBound>} bounds
   * @param {ResourceUsageSnapshot} usageSnapshot
   * @returns {Object}
   */
  checkBounds(bounds = [], usageSnapshot = {}) {
    const violations = [];

    const fieldMap = {
      'CPU': usageSnapshot.cpuPercent,
      'CPU_USAGE': usageSnapshot.cpuPercent,
      'MEMORY': usageSnapshot.memoryBytes,
      'MEMORY_USAGE': usageSnapshot.memoryBytes,
      'FILE_DESCRIPTORS': usageSnapshot.fileDescriptors,
      'THREADS': usageSnapshot.threadCount,
      'QUEUE_DEPTH': usageSnapshot.queueDepth
    };

    for (const bound of bounds) {
      const val = fieldMap[bound.resourceType.toUpperCase()];
      if (val !== undefined && !bound.isSatisfied(val)) {
        violations.push({
          boundId: bound.id,
          resourceType: bound.resourceType,
          limit: bound.maxAllowed,
          observed: val,
          unit: bound.unit
        });
      }
    }

    const isCompliant = violations.length === 0;

    return {
      isCompliant,
      violations,
      violationCount: violations.length,
      summary: isCompliant ? 'All resource bounds satisfied' : `Resource bound violations: ${violations.length} limits exceeded`
    };
  }
}
