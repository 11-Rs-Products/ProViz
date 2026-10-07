import { ExecutionConflict } from './ExecutionConflict.js';

export class ConflictResolver {
  static resolve(conflict, policy = 'PRESERVE_CONFLICT') {
    const { evidenceA, evidenceB, subject } = conflict;

    // Safety Invariant: Formal evidence cannot be silenced by empirical observation noise
    const isFormalA = evidenceA?.strength === 'FORMAL' || evidenceA?.kind === 'STATIC_PROOF';
    const isFormalB = evidenceB?.strength === 'FORMAL' || evidenceB?.kind === 'STATIC_PROOF';

    if (isFormalA && !isFormalB) {
      return new ExecutionConflict({
        subject,
        evidenceA,
        evidenceB,
        conflictType: 'FORMAL_VS_EMPIRICAL',
        resolution: 'RETAIN_FORMAL_AND_FLAG_ANOMALY'
      });
    }

    if (!isFormalA && isFormalB) {
      return new ExecutionConflict({
        subject,
        evidenceA,
        evidenceB,
        conflictType: 'FORMAL_VS_EMPIRICAL',
        resolution: 'RETAIN_FORMAL_AND_FLAG_ANOMALY'
      });
    }

    return new ExecutionConflict({
      subject,
      evidenceA,
      evidenceB,
      conflictType: 'EMPIRICAL_DISCORDANCE',
      resolution: 'RECORD_CONFLICT_FOR_REOBSERVATION'
    });
  }
}
