import { ProbabilisticPlan } from './ProbabilisticPlan.js';
import { ProbabilisticSession } from './ProbabilisticSession.js';
import { ProbabilisticResult } from './ProbabilisticResult.js';
import { VerificationStatus } from './VerificationPolicy.js';
import { EvidenceSet } from './EvidenceSet.js';
import { BehaviorModelBuilder } from './BehaviorModelBuilder.js';
import { ConfidenceCalibrator } from './ConfidenceCalibrator.js';
import { AnomalyDetector } from './AnomalyDetector.js';
import { RareBehaviorDetector } from './RareBehaviorDetector.js';

export class ProbabilisticCampaign {
  constructor({
    id,
    plan = new ProbabilisticPlan(),
    evidenceSet = new EvidenceSet()
  } = {}) {
    this.id = id || `campaign:${Date.now()}`;
    this.plan = plan;
    this.evidenceSet = evidenceSet;
    this.status = VerificationStatus.CREATED;
    this.session = new ProbabilisticSession({ campaignId: this.id });
    this.distributions = new Map(); // subject -> BehaviorDistribution
    this.confidences = new Map(); // subject -> ConfidenceCalibrationResult
    this.anomalies = [];
    this.rareBehaviors = [];
    this.flakyTests = [];
    this.statisticalRegressions = [];
  }

  addEvidence(evidence) {
    this.evidenceSet = this.evidenceSet.add(evidence);
    return this;
  }

  addEvidenceBatch(evidenceList = []) {
    this.evidenceSet = this.evidenceSet.addAll(evidenceList);
    return this;
  }

  run() {
    this.status = VerificationStatus.RUNNING;
    const start = Date.now();

    // Group evidence by subject
    const subjects = this.plan.targetSubjects.length > 0
      ? this.plan.targetSubjects
      : Array.from(new Set(this.evidenceSet.getAll().map(e => e.subject)));

    for (const sub of subjects) {
      const evForSub = this.evidenceSet.getBySubject(sub);
      const builder = new BehaviorModelBuilder(sub, 'default');

      for (const ev of evForSub) {
        if (ev.observation?.outcome) {
          builder.addObservation(ev.observation.outcome, ev);
        }
      }

      const dist = builder.build();
      this.distributions.set(sub, dist);

      const conf = ConfidenceCalibrator.calibrate(sub, evForSub);
      this.confidences.set(sub, conf);

      const anomalies = AnomalyDetector.detectFromDistribution(dist);
      this.anomalies.push(...anomalies);

      const rare = RareBehaviorDetector.detect(dist);
      this.rareBehaviors.push(...rare);
    }

    this.status = VerificationStatus.COMPLETED;
    this.session.end();

    return new ProbabilisticResult({
      campaignId: this.id,
      status: this.status,
      totalSamples: this.evidenceSet.size,
      distributions: this.distributions,
      confidences: this.confidences,
      anomalies: this.anomalies,
      rareBehaviors: this.rareBehaviors,
      flakyTests: this.flakyTests,
      statisticalRegressions: this.statisticalRegressions,
      stoppingReason: 'COMPLETED_ALL_SUBJECTS',
      durationMs: Date.now() - start
    });
  }

  toJSON() {
    return {
      id: this.id,
      status: this.status,
      plan: this.plan.toJSON(),
      evidenceCount: this.evidenceSet.size,
      session: this.session.toJSON()
    };
  }
}
