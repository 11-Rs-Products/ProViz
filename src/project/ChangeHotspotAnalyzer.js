/**
 * ChangeHotspotAnalyzer.js
 * Identifies components with disproportionate change volume combined with high regression rates or blast radius.
 */

import { ChangeFrequencyAnalyzer } from './ChangeFrequencyAnalyzer.js';

export class ChangeHotspotAnalyzer {
  constructor() {
    this.freqAnalyzer = new ChangeFrequencyAnalyzer();
  }

  /**
   * @param {import('./ProjectChangeHistory.js').ProjectChangeHistory} changeHistory
   */
  analyze(changeHistory) {
    if (!changeHistory) throw new Error('ChangeHotspotAnalyzer requires changeHistory');
    const freqRes = this.freqAnalyzer.analyze(changeHistory);
    const hotspots = [];

    for (const item of freqRes.frequencies) {
      if (item.isHighChurn || item.regressionCount > 0) {
        hotspots.push({
          entityId: item.entityId,
          changeCount: item.changeCount,
          regressionCount: item.regressionCount,
          regressionRate: item.regressionRate,
          isHighRiskHotspot: item.regressionRate > 0.2 || (item.changeCount >= 5 && item.regressionCount > 0)
        });
      }
    }

    hotspots.sort((a, b) => b.regressionCount - a.regressionCount || b.changeCount - a.changeCount);

    return {
      timestamp: Date.now(),
      changeHotspotCount: hotspots.length,
      hotspots
    };
  }
}
