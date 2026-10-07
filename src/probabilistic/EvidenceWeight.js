import { EvidenceKind } from './EvidenceKind.js';
import { EvidenceStrength } from './EvidenceStrength.js';

export class EvidenceWeight {
  static getKindWeight(kind) {
    switch (kind) {
      case EvidenceKind.STATIC_PROOF:
      case EvidenceKind.SYMBOLIC_PROOF:
        return 1.0;
      case EvidenceKind.SYMBOLIC_COUNTEREXAMPLE:
        return 0.95;
      case EvidenceKind.CONCOLIC_EXECUTION:
        return 0.85;
      case EvidenceKind.REPAIR_VALIDATION:
      case EvidenceKind.REGRESSION_RESULT:
        return 0.80;
      case EvidenceKind.MUTATION_RESULT:
      case EvidenceKind.METAMORPHIC_RESULT:
      case EvidenceKind.SPECIFICATION_RESULT:
        return 0.75;
      case EvidenceKind.TEST_ASSERTION:
      case EvidenceKind.ORACLE_RESULT:
        return 0.70;
      case EvidenceKind.STATIC_ANALYSIS:
        return 0.60;
      case EvidenceKind.EXPLORATION_RESULT:
      case EvidenceKind.RUNTIME_OBSERVATION:
      case EvidenceKind.WATCH_OBSERVATION:
        return 0.40;
      case EvidenceKind.USER_ASSERTION:
        return 0.50;
      case EvidenceKind.ENVIRONMENT_OBSERVATION:
        return 0.30;
      default:
        return 0.20;
    }
  }

  static computeWeight(evidence) {
    const kindW = this.getKindWeight(evidence.kind);
    const strengthW = EvidenceStrength.weight(evidence.strength);
    const confVal = typeof evidence.confidence === 'number'
      ? evidence.confidence
      : (evidence.confidence?.score ?? 1.0);
    return kindW * strengthW * confVal;
  }
}
