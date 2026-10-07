import { VerificationPolicy } from './VerificationPolicy.js';

export class ProbabilisticPlan {
  constructor({
    seed = 42,
    targetSubjects = [],
    policy = new VerificationPolicy(),
    priorPolicy = { type: 'Beta', alpha: 1.0, beta: 1.0 },
    stoppingCriteria = []
  } = {}) {
    this.seed = seed;
    this.targetSubjects = Object.freeze([...targetSubjects]);
    this.policy = policy;
    this.priorPolicy = Object.freeze({ ...priorPolicy });
    this.stoppingCriteria = Object.freeze([...stoppingCriteria]);
    Object.freeze(this);
  }

  toJSON() {
    return {
      seed: this.seed,
      targetSubjects: this.targetSubjects,
      policy: this.policy.toJSON(),
      priorPolicy: this.priorPolicy,
      stoppingCriteriaCount: this.stoppingCriteria.length
    };
  }
}
