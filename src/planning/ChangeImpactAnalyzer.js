import { ChangeImpact } from './ChangeImpact.js';

export class ChangeImpactAnalyzer {
  /**
   * Deterministically separates affected vs unaffected verification evidence upon change.
   */
  static analyze(changedFiles = [], evidenceList = [], dependencyGraph = null) {
    const affectedFunctions = [];
    const affectedProps = [];
    const staleIds = [];
    const preservedIds = [];

    for (const ev of evidenceList) {
      const subject = ev.subject || '';
      const isAffected = changedFiles.some(f => subject.includes(f) || f.includes(subject));

      if (isAffected) {
        staleIds.push(ev.id);
        affectedFunctions.push(subject);
      } else {
        preservedIds.push(ev.id);
      }
    }

    const total = evidenceList.length;
    const impactScore = total > 0 ? staleIds.length / total : 0.0;

    return new ChangeImpact({
      changedFiles,
      affectedFunctions: Array.from(new Set(affectedFunctions)),
      affectedProperties: affectedProps,
      staleEvidenceIds: staleIds,
      preservedEvidenceIds: preservedIds,
      impactScore
    });
  }
}
