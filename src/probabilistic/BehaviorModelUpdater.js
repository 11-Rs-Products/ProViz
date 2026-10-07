import { BehaviorModelBuilder } from './BehaviorModelBuilder.js';
import { BehaviorOutcome } from './BehaviorOutcome.js';

export class BehaviorModelUpdater {
  static update(existingDistribution, newObservations = [], newEvidence = []) {
    const builder = new BehaviorModelBuilder(
      existingDistribution.subject,
      existingDistribution.inputRegion
    );

    // Replay existing outcomes
    for (const p of existingDistribution.getAllOutcomes()) {
      builder.addObservations(p.outcome, p.observedFrequency, p.supportingEvidence);
    }

    // Add new observations
    for (let i = 0; i < newObservations.length; i++) {
      const obs = newObservations[i];
      const ev = newEvidence[i] || null;
      if (obs instanceof BehaviorOutcome) {
        builder.addObservation(obs, ev);
      } else {
        const outcome = new BehaviorOutcome(obs);
        builder.addObservation(outcome, ev);
      }
    }

    return builder.build();
  }
}
