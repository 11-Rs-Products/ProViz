/**
 * ChangeFrequencyAnalyzer.js
 * Calculates change velocity and churn frequency per entity.
 */

export class ChangeFrequencyAnalyzer {
  /**
   * @param {import('./ProjectChangeHistory.js').ProjectChangeHistory} changeHistory
   */
  analyze(changeHistory) {
    if (!changeHistory) throw new Error('ChangeFrequencyAnalyzer requires changeHistory');
    const records = changeHistory.getRecords();
    const frequencyMap = new Map();
    const regressionMap = new Map();

    for (const record of records) {
      for (const entityId of record.modifiedEntities) {
        frequencyMap.set(entityId, (frequencyMap.get(entityId) || 0) + 1);
        if (record.causedRegression) {
          regressionMap.set(entityId, (regressionMap.get(entityId) || 0) + 1);
        }
      }
    }

    const totalChanges = Math.max(1, records.length);
    const frequencies = [];

    for (const [entityId, count] of frequencyMap.entries()) {
      const regressions = regressionMap.get(entityId) || 0;
      frequencies.push({
        entityId,
        changeCount: count,
        frequencyRatio: Number((count / totalChanges).toFixed(4)),
        regressionCount: regressions,
        regressionRate: Number((regressions / count).toFixed(4)),
        isHighChurn: (count / totalChanges) >= 0.2
      });
    }

    frequencies.sort((a, b) => b.changeCount - a.changeCount);

    return {
      timestamp: Date.now(),
      totalChangesRecorded: records.length,
      frequencies
    };
  }
}
