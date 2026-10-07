/**
 * ProjectHealthDiff.js
 * Compares two ProjectHealthSnapshots to calculate exact score deltas across all health dimensions.
 */

export class ProjectHealthDiff {
  /**
   * Compare two snapshots
   * @param {import('./ProjectHealthSnapshot.js').ProjectHealthSnapshot} baseSnapshot
   * @param {import('./ProjectHealthSnapshot.js').ProjectHealthSnapshot} targetSnapshot
   */
  static diff(baseSnapshot, targetSnapshot) {
    if (!baseSnapshot || !targetSnapshot) {
      throw new Error('ProjectHealthDiff requires baseSnapshot and targetSnapshot');
    }

    const baseScore = baseSnapshot.health.getCompositeScore();
    const targetScore = targetSnapshot.health.getCompositeScore();
    const delta = Number((targetScore - baseScore).toFixed(4));

    const dimensionDiffs = {};
    for (const [dim, targetVal] of Object.entries(targetSnapshot.health.dimensions)) {
      const baseVal = baseSnapshot.health.getScore(dim);
      dimensionDiffs[dim] = Number((targetVal - baseVal).toFixed(4));
    }

    return {
      baseRevision: baseSnapshot.revision,
      targetRevision: targetSnapshot.revision,
      compositeScoreDelta: delta,
      dimensionDiffs,
      isImproved: delta > 0.01,
      isDegraded: delta < -0.01,
      timestamp: Date.now()
    };
  }
}
