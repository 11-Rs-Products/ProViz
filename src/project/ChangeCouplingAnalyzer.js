/**
 * ChangeCouplingAnalyzer.js
 * Discovers logical/temporal coupling: entities frequently modified together in commits.
 */

export class ChangeCouplingAnalyzer {
  /**
   * @param {import('./ProjectChangeHistory.js').ProjectChangeHistory} changeHistory
   * @param {number} [minCoOccurrences=2]
   */
  analyze(changeHistory, minCoOccurrences = 2) {
    if (!changeHistory) throw new Error('ChangeCouplingAnalyzer requires changeHistory');
    const records = changeHistory.getRecords();
    const pairCounts = new Map();
    const entityCounts = new Map();

    for (const record of records) {
      const entities = record.modifiedEntities;
      for (const e of entities) {
        entityCounts.set(e, (entityCounts.get(e) || 0) + 1);
      }
      for (let i = 0; i < entities.length; i++) {
        for (let j = i + 1; j < entities.length; j++) {
          const e1 = entities[i] < entities[j] ? entities[i] : entities[j];
          const e2 = entities[i] < entities[j] ? entities[j] : entities[i];
          const key = `${e1} <-> ${e2}`;
          pairCounts.set(key, (pairCounts.get(key) || 0) + 1);
        }
      }
    }

    const couplings = [];
    for (const [key, count] of pairCounts.entries()) {
      if (count >= minCoOccurrences) {
        const [e1, e2] = key.split(' <-> ');
        const c1 = entityCounts.get(e1) || count;
        const c2 = entityCounts.get(e2) || count;
        // Jaccard similarity
        const jaccard = count / (c1 + c2 - count);

        couplings.push({
          entityA: e1,
          entityB: e2,
          coChangeCount: count,
          jaccardSimilarity: Number(jaccard.toFixed(4)),
          isStronglyCoupled: jaccard >= 0.5
        });
      }
    }

    couplings.sort((a, b) => b.coChangeCount - a.coChangeCount);

    return {
      timestamp: Date.now(),
      coupledPairsCount: couplings.length,
      couplings
    };
  }
}
