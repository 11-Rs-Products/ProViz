import { VerificationWorker } from './VerificationWorker.js';
import { VerificationTaskKind } from './VerificationTaskKind.js';

export class MutationWorker extends VerificationWorker {
  constructor(options = {}) {
    super({
      name: 'MutationWorker',
      supportedKinds: [
        VerificationTaskKind.MUTATION_ANALYSIS,
        VerificationTaskKind.MUTANT_KILLING
      ],
      ...options
    });
  }

  async performExecution(task, context = {}) {
    return {
      outcome: 'MUTANT_KILLED',
      evidenceGenerated: [{
        kind: 'MUTATION_KILL',
        subject: task.subject,
        polarity: 'TRUE'
      }],
      confidenceDelta: 0.50,
      uncertaintyReduction: 0.50,
      executionCostMs: 30
    };
  }
}
