/**
 * OrphanRequirementAnalyzer.js
 * Identifies high-level requirements that lack downstream formal specification or implementation.
 */

export class OrphanRequirementAnalyzer {
  /**
   * @param {import('./TraceabilityMatrix.js').TraceabilityMatrix} matrix
   */
  analyze(matrix) {
    if (!matrix) throw new Error('OrphanRequirementAnalyzer requires matrix');
    const orphans = matrix.links.filter(l => l.implementationIds.length === 0);
    return {
      timestamp: Date.now(),
      totalRequirements: matrix.links.length,
      orphanRequirementCount: orphans.length,
      orphanRequirementIds: orphans.map(l => l.requirementId),
      hasOrphans: orphans.length > 0
    };
  }
}
