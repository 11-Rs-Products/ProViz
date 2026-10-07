import { VerificationPolicy, VerificationStatus, VerificationTrigger } from './VerificationPolicy.js';
import { VerificationScheduler } from './VerificationScheduler.js';
import { VerificationRun } from './VerificationRun.js';

export class ContinuousVerification {
  constructor(policy = new VerificationPolicy()) {
    this.policy = policy;
    this.scheduler = new VerificationScheduler(policy);
    this.runs = [];
  }

  onSourceChanged(changedFiles = []) {
    this.scheduler.scheduleTrigger(VerificationTrigger.SOURCE_CHANGED, { changedFiles });
  }

  onRegressionDetected(regression) {
    this.scheduler.scheduleTrigger(VerificationTrigger.REGRESSION_OCCURRED, { regression });
  }

  onMutationSurvived(mutantId) {
    this.scheduler.scheduleTrigger(VerificationTrigger.MUTATION_SURVIVED, { mutantId });
  }

  executeNextRun(executorFn) {
    const triggerItem = this.scheduler.getNextTrigger();
    if (!triggerItem) return null;

    const start = Date.now();
    let result = { propertiesChecked: 0, propertiesVerified: 0, propertiesUncertain: 0, evidenceCollected: [] };

    if (typeof executorFn === 'function') {
      result = executorFn(triggerItem) || result;
    }

    const run = new VerificationRun({
      trigger: triggerItem.trigger,
      policy: this.policy,
      startTime: start,
      endTime: Date.now(),
      status: VerificationStatus.COMPLETED,
      propertiesChecked: result.propertiesChecked || 0,
      propertiesVerified: result.propertiesVerified || 0,
      propertiesUncertain: result.propertiesUncertain || 0,
      evidenceCollected: result.evidenceCollected || [],
      stoppingReason: 'TARGET_CRITERIA_SATISFIED'
    });

    this.scheduler.recordRun(run);
    this.runs.push(run);
    return run;
  }
}
