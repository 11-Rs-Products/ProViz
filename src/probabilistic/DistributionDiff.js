export const DistributionShiftClassification = Object.freeze({
  NO_CHANGE: 'NO_CHANGE',
  POSSIBLE_SHIFT: 'POSSIBLE_SHIFT',
  SIGNIFICANT_SHIFT: 'SIGNIFICANT_SHIFT',
  NEW_BEHAVIOR: 'NEW_BEHAVIOR',
  DISAPPEARED_BEHAVIOR: 'DISAPPEARED_BEHAVIOR',
  FREQUENCY_SHIFT: 'FREQUENCY_SHIFT',
  VARIANCE_SHIFT: 'VARIANCE_SHIFT',
  UNKNOWN: 'UNKNOWN'
});

export class DistributionDiff {
  constructor({
    subject,
    classification = DistributionShiftClassification.UNKNOWN,
    divergenceScore = 0.0, // e.g. Total Variation Distance or Jensen-Shannon
    probabilityDifferences = {}, // outcomeId -> diff
    newBehaviors = [],
    disappearedBehaviors = [],
    isSignificant = false
  }) {
    this.subject = subject;
    this.classification = classification;
    this.divergenceScore = divergenceScore;
    this.probabilityDifferences = Object.freeze({ ...probabilityDifferences });
    this.newBehaviors = Object.freeze([...newBehaviors]);
    this.disappearedBehaviors = Object.freeze([...disappearedBehaviors]);
    this.isSignificant = isSignificant;
    Object.freeze(this);
  }

  toJSON() {
    return {
      subject: this.subject,
      classification: this.classification,
      divergenceScore: this.divergenceScore,
      probabilityDifferences: this.probabilityDifferences,
      newBehaviors: this.newBehaviors,
      disappearedBehaviors: this.disappearedBehaviors,
      isSignificant: this.isSignificant
    };
  }
}
