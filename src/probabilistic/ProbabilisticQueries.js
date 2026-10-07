import { ProbabilisticSnapshot } from './ProbabilisticSnapshot.js';

export class ProbabilisticQueries {
  constructor(engine) {
    this.engine = engine;
  }

  getBehaviorProbability(subject, behaviorId) {
    const dist = this.engine.getBehaviorDistribution(subject);
    if (!dist) return 0.0;
    return dist.probabilityOf(behaviorId);
  }

  getSpecificationConfidence(specId) {
    const val = this.engine.specifications.get(specId);
    return val ? val.evidenceModel.confidence : 'UNKNOWN';
  }

  getSpecificationUncertainty(specId) {
    const val = this.engine.specifications.get(specId);
    return val ? val.evidenceModel.uncertainty : null;
  }

  getOracleConfidence(oracleId) {
    const est = this.engine.oracles.get(oracleId);
    return est ? est.confidence : 'UNKNOWN';
  }

  getEvidenceFor(subject) {
    return this.engine.evidenceSet.getBySubject(subject);
  }

  getConflictingEvidence(subject) {
    const conf = this.engine.confidences.get(subject);
    return conf ? conf.conflicts : [];
  }

  getRareBehaviors() {
    return this.engine.rareBehaviors;
  }

  getAnomalies() {
    return this.engine.anomalies;
  }

  getFlakyTests() {
    return this.engine.flakyTests;
  }

  getBehaviorDistribution(subject) {
    return this.engine.getBehaviorDistribution(subject);
  }

  getStateProbabilities(subject) {
    const model = this.engine.stateModels.get(subject);
    return model ? model.getAllStateProbabilities() : [];
  }

  getTransitionProbabilities(subject) {
    const model = this.engine.transitionModels.get(subject);
    return model ? model.getAllTransitions() : [];
  }

  getStatisticalRegressions() {
    return this.engine.statisticalRegressions;
  }

  getEvidenceFreshness() {
    return this.engine.freshnessRecords;
  }

  getVerificationHealth() {
    return this.engine.getHealth();
  }

  getVerificationRisk() {
    return this.engine.getOverallRisk();
  }

  getNextBestExperiment() {
    return this.engine.getNextBestExperiment();
  }
}
