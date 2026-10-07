/**
 * ProjectHealthQuery.js
 * Query engine to query multidimensional health history, filter dimensions, and detect anomalies.
 */

export class ProjectHealthQuery {
  /**
   * @param {import('./ProjectHealthHistory.js').ProjectHealthHistory} history
   */
  constructor(history) {
    this.history = history;
  }

  getDimensionTrajectory(dimension) {
    const snapshots = this.history.getSnapshots();
    return snapshots.map(s => ({
      revision: s.revision,
      timestamp: s.timestamp,
      score: s.health.getScore(dimension)
    }));
  }

  getDeclineAlerts(thresholdDrop = 0.05) {
    const snapshots = this.history.getSnapshots();
    const alerts = [];

    for (let i = 1; i < snapshots.length; i++) {
      const prev = snapshots[i - 1];
      const curr = snapshots[i];

      for (const [dim, currVal] of Object.entries(curr.health.dimensions)) {
        const prevVal = prev.health.getScore(dim);
        const drop = prevVal - currVal;
        if (drop >= thresholdDrop) {
          alerts.push({
            revision: curr.revision,
            dimension: dim,
            previousScore: prevVal,
            currentScore: currVal,
            drop: Number(drop.toFixed(4)),
            message: `Health drop alert: ${dim} dropped by ${(drop * 100).toFixed(1)}% at revision ${curr.revision}`
          });
        }
      }
    }

    return alerts;
  }
}
