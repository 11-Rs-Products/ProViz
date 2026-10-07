export class AnomalyScore {
  constructor({
    score = 0.0, // 0.0 (completely normal) to 1.0 (extreme anomaly)
    threshold = 0.8,
    isAnomaly = false,
    rarityScore = 0.0,
    divergenceScore = 0.0
  }) {
    this.score = score;
    this.threshold = threshold;
    this.isAnomaly = isAnomaly || score >= threshold;
    this.rarityScore = rarityScore;
    this.divergenceScore = divergenceScore;
    Object.freeze(this);
  }

  toJSON() {
    return {
      score: this.score,
      threshold: this.threshold,
      isAnomaly: this.isAnomaly,
      rarityScore: this.rarityScore,
      divergenceScore: this.divergenceScore
    };
  }
}
