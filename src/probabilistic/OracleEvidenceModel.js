export const OracleStabilityClassification = Object.freeze({
  STABLE: 'STABLE',
  LIKELY_STABLE: 'LIKELY_STABLE',
  UNCERTAIN: 'UNCERTAIN',
  CONFLICTING: 'CONFLICTING',
  INSUFFICIENTLY_OBSERVED: 'INSUFFICIENTLY_OBSERVED'
});

export class OracleEvidenceModel {
  constructor({
    oracleId,
    passCount = 0,
    failCount = 0,
    unknownCount = 0,
    environmentDependenceDetected = false,
    metamorphicSupportCount = 0,
    mutationKillsCount = 0,
    regressionSupportCount = 0,
    totalEvaluations = 0
  }) {
    this.oracleId = oracleId;
    this.passCount = passCount;
    this.failCount = failCount;
    this.unknownCount = unknownCount;
    this.environmentDependenceDetected = environmentDependenceDetected;
    this.metamorphicSupportCount = metamorphicSupportCount;
    this.mutationKillsCount = mutationKillsCount;
    this.regressionSupportCount = regressionSupportCount;
    this.totalEvaluations = totalEvaluations || (passCount + failCount + unknownCount);
    Object.freeze(this);
  }

  toJSON() {
    return {
      oracleId: this.oracleId,
      passCount: this.passCount,
      failCount: this.failCount,
      unknownCount: this.unknownCount,
      environmentDependenceDetected: this.environmentDependenceDetected,
      metamorphicSupportCount: this.metamorphicSupportCount,
      mutationKillsCount: this.mutationKillsCount,
      regressionSupportCount: this.regressionSupportCount,
      totalEvaluations: this.totalEvaluations
    };
  }
}
