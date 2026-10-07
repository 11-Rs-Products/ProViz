import { EvidenceSet } from './EvidenceSet.js';
import { EvidenceGraph } from './EvidenceGraph.js';
import { BehaviorModelBuilder } from './BehaviorModelBuilder.js';
import { ConfidenceCalibrator } from './ConfidenceCalibrator.js';
import { AnomalyDetector } from './AnomalyDetector.js';
import { RareBehaviorDetector } from './RareBehaviorDetector.js';
import { FlakinessAnalyzer } from './FlakinessAnalyzer.js';
import { StatisticalRegressionDetector } from './StatisticalRegressionDetector.js';
import { ProbabilisticSpecificationValidator } from './ProbabilisticSpecificationValidator.js';
import { OracleConfidenceEstimator } from './OracleConfidenceEstimator.js';
import { UncertaintyExplorer } from './UncertaintyExplorer.js';
import { ProbabilisticQueries } from './ProbabilisticQueries.js';
import { VerificationHealth } from './VerificationHealth.js';
import { BehaviorHealth } from './BehaviorHealth.js';
import { SpecificationHealth } from './SpecificationHealth.js';
import { OracleHealth } from './OracleHealth.js';
import { ExplorationHealth } from './ExplorationHealth.js';
import { RiskModel } from './RiskModel.js';
import { RiskFactor } from './RiskFactor.js';
import { ProbabilisticSnapshot } from './ProbabilisticSnapshot.js';
import { ProbabilisticPlan } from './ProbabilisticPlan.js';
import { ProbabilisticCampaign } from './ProbabilisticCampaign.js';
import { EvidenceConflictResolver } from './EvidenceConflictResolver.js';

export class ProbabilisticEngine {
  constructor() {
    this.evidenceSet = new EvidenceSet();
    this.evidenceGraph = new EvidenceGraph();
    this.distributions = new Map(); // subject -> BehaviorDistribution
    this.confidences = new Map(); // subject -> ConfidenceCalibrationResult
    this.specifications = new Map(); // specId -> { evidenceModel, probability }
    this.oracles = new Map(); // oracleId -> OracleConfidence
    this.stateModels = new Map(); // subject -> ProbabilisticStateModel
    this.transitionModels = new Map(); // subject -> ProbabilisticTransitionModel
    this.anomalies = [];
    this.rareBehaviors = [];
    this.flakyTests = [];
    this.statisticalRegressions = [];
    this.freshnessRecords = [];
    this.campaigns = new Map();
    this.activeCampaign = null;
    this.queries = new ProbabilisticQueries(this);
  }

  addEvidence(evidence) {
    this.evidenceSet = this.evidenceSet.add(evidence);
    return this;
  }

  addEvidenceBatch(evidenceList = []) {
    this.evidenceSet = this.evidenceSet.addAll(evidenceList);
    return this;
  }

  createCampaign(options = {}) {
    const plan = new ProbabilisticPlan(options);
    const campaign = new ProbabilisticCampaign({ plan, evidenceSet: this.evidenceSet });
    this.campaigns.set(campaign.id, campaign);
    this.activeCampaign = campaign;
    return campaign;
  }

  getBehaviorDistribution(subject) {
    if (this.distributions.has(subject)) {
      return this.distributions.get(subject);
    }
    // Compute on-demand if evidence exists
    const evList = this.evidenceSet.getBySubject(subject);
    if (evList.length === 0) return null;

    const builder = new BehaviorModelBuilder(subject, 'default');
    for (const ev of evList) {
      if (ev.observation?.outcome) {
        builder.addObservation(ev.observation.outcome, ev);
      }
    }
    const dist = builder.build();
    this.distributions.set(subject, dist);
    return dist;
  }

  calibrateConfidence(subject) {
    const evList = this.evidenceSet.getBySubject(subject);
    const conflicts = EvidenceConflictResolver.resolve(subject, evList).conflicts;
    const result = ConfidenceCalibrator.calibrate(subject, evList, conflicts);
    this.confidences.set(subject, result);
    return result;
  }

  validateSpecification(specId, coverage = 0.0) {
    const evList = this.evidenceSet.getAll().filter(e => e.relatedSpecification === specId);
    const res = ProbabilisticSpecificationValidator.validate(specId, evList, coverage);
    this.specifications.set(specId, res);
    return res;
  }

  estimateOracleConfidence(oracleEvidenceModel) {
    const res = OracleConfidenceEstimator.estimate(oracleEvidenceModel);
    this.oracles.set(oracleEvidenceModel.oracleId, res);
    return res;
  }

  analyzeFlakiness(testId, runOutcomes = [], envFactors = []) {
    const res = FlakinessAnalyzer.analyze(testId, runOutcomes, envFactors);
    const existingIdx = this.flakyTests.findIndex(t => t.testId === testId);
    if (existingIdx >= 0) this.flakyTests[existingIdx] = res;
    else this.flakyTests.push(res);
    return res;
  }

  detectExceptionRegression(subject, bExc, bTot, cExc, cTot) {
    const regr = StatisticalRegressionDetector.detectExceptionRateRegression(subject, bExc, bTot, cExc, cTot);
    if (regr) {
      this.statisticalRegressions.push(regr);
    }
    return regr;
  }

  getNextBestExperiment(candidates = [], policy = { favorUncertaintyReduction: true }) {
    if (candidates.length === 0) {
      // Synthesize candidates from low confidence subjects
      for (const [sub, conf] of this.confidences.entries()) {
        candidates.push({
          subject: sub,
          confidenceScore: conf.score,
          uncertaintyScore: 1.0 - conf.score,
          novelty: 0.5,
          coverageGain: 0.5
        });
      }
    }
    const ranked = UncertaintyExplorer.selectTargets(candidates, policy);
    return ranked[0] || null;
  }

  getHealth() {
    const bHealth = new BehaviorHealth({
      subject: 'overall',
      anomaliesCount: this.anomalies.length,
      rareBehaviorsCount: this.rareBehaviors.length,
      shiftsCount: this.statisticalRegressions.length,
      isHealthy: this.anomalies.length === 0 && this.statisticalRegressions.length === 0
    });

    const specVals = Array.from(this.specifications.values());
    const sHealth = new SpecificationHealth({
      totalSpecifications: specVals.length,
      verifiedCount: specVals.filter(v => v.evidenceModel.confidence === 'VERY_HIGH' || v.evidenceModel.confidence === 'FORMALLY_ESTABLISHED').length,
      uncertainCount: specVals.filter(v => v.evidenceModel.confidence === 'LOW' || v.evidenceModel.confidence === 'MEDIUM').length,
      conflictingCount: specVals.filter(v => v.evidenceModel.confidence === 'CONFLICTING').length,
      violatedCount: specVals.filter(v => v.evidenceModel.isViolated()).length
    });

    const oVals = Array.from(this.oracles.values());
    const oHealth = new OracleHealth({
      totalOracles: oVals.length,
      stableCount: oVals.filter(o => o.confidence === 'VERY_HIGH' || o.confidence === 'HIGH').length,
      uncertainCount: oVals.filter(o => o.confidence === 'MEDIUM' || o.confidence === 'LOW').length,
      flakyCount: this.flakyTests.filter(t => t.isFlaky()).length
    });

    const eHealth = new ExplorationHealth({
      totalInputsExplored: this.evidenceSet.size,
      noveltyRate: 0.75,
      coverage: 0.85,
      uncertaintyReductionRate: 0.65
    });

    return new VerificationHealth({
      behaviorHealth: bHealth,
      specificationHealth: sHealth,
      oracleHealth: oHealth,
      explorationHealth: eHealth,
      compositeHealthScore: bHealth.isHealthy ? 0.95 : 0.65
    });
  }

  getOverallRisk(subject = 'overall') {
    const factors = [];
    if (this.statisticalRegressions.length > 0) {
      factors.push(new RiskFactor({ name: 'REGRESSION_HISTORY', score: 0.8, weight: 2.0 }));
    }
    if (this.anomalies.length > 0) {
      factors.push(new RiskFactor({ name: 'RARE_UNEXPECTED_BEHAVIOR', score: 0.6, weight: 1.5 }));
    }
    return RiskModel.evaluate(subject, factors);
  }

  getSnapshot() {
    const distObj = {};
    for (const [k, v] of this.distributions.entries()) distObj[k] = v.toJSON();
    const confObj = {};
    for (const [k, v] of this.confidences.entries()) confObj[k] = v.toJSON();

    return new ProbabilisticSnapshot({
      programIdentity: 'proviz-app',
      evidenceGraph: this.evidenceGraph,
      distributions: distObj,
      confidenceStates: confObj,
      randomSeed: 42
    });
  }
}
