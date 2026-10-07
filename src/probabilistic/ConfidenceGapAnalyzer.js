export class ConfidenceGapAnalyzer {
  /**
   * Identifies subjects with large gap between current confidence and target confidence.
   */
  static analyzeGaps(subjectConfidenceMap = new Map(), targetConfidence = 0.95) {
    const gaps = [];

    for (const [subject, currentScore] of subjectConfidenceMap.entries()) {
      const gap = Math.max(0.0, targetConfidence - currentScore);
      if (gap > 0.05) {
        gaps.push({ subject, currentScore, targetConfidence, gap });
      }
    }

    return gaps.sort((a, b) => b.gap - a.gap);
  }
}
