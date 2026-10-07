import { VerificationTask } from './VerificationTask.js';

export class SpeculativeTask extends VerificationTask {
  constructor(options = {}) {
    super({
      ...options,
      isSpeculative: true,
      cancellationTrigger: options.cancellationTrigger || 'GOAL_SATISFIED'
    });
  }
}
