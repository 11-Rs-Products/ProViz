import { Uncertainty } from './Uncertainty.js';
import { UncertaintyKind } from './UncertaintyKind.js';

export class UncertaintyPropagator {
  /**
   * Propagate uncertainty across a dependency chain.
   * e.g. U(C) = 1 - (1 - U(A)) * (1 - U(B)) or max/min depending on relation
   */
  static propagateSequential(uncertainties = []) {
    if (uncertainties.length === 0) {
      return new Uncertainty({ kind: UncertaintyKind.UNKNOWN, score: 1.0 });
    }

    let certaintyProduct = 1.0;
    const sources = [];
    let dominantKind = UncertaintyKind.UNKNOWN;
    let maxScore = -1;

    for (const u of uncertainties) {
      const certainty = 1.0 - u.score;
      certaintyProduct *= certainty;
      sources.push(...u.sources);
      if (u.score > maxScore) {
        maxScore = u.score;
        dominantKind = u.kind;
      }
    }

    const combinedScore = 1.0 - certaintyProduct;
    return new Uncertainty({
      kind: dominantKind,
      score: combinedScore,
      sources,
      description: `Propagated sequential uncertainty from ${uncertainties.length} stages`
    });
  }

  static propagateParallel(uncertainties = []) {
    // Redundant observations reduce overall uncertainty: U_total = prod(U_i)
    if (uncertainties.length === 0) {
      return new Uncertainty({ kind: UncertaintyKind.UNKNOWN, score: 1.0 });
    }

    let uProduct = 1.0;
    const sources = [];
    for (const u of uncertainties) {
      uProduct *= u.score;
      sources.push(...u.sources);
    }

    return new Uncertainty({
      kind: uncertainties[0].kind,
      score: uProduct,
      sources,
      description: `Propagated parallel uncertainty from ${uncertainties.length} redundant paths`
    });
  }
}
