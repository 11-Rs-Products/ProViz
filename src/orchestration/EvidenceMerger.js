import { EvidenceMergePolicy } from './EvidenceMergePolicy.js';
import { EvidenceMerge } from './EvidenceMerge.js';
import { ExecutionConflict } from './ExecutionConflict.js';
import { ConflictResolver } from './ConflictResolver.js';

export class EvidenceMerger {
  constructor({ policy = EvidenceMergePolicy.PRESERVE_CONFLICT } = {}) {
    this.policy = policy;
    this.mergeHistory = [];
  }

  merge(baseEvidenceList = [], workerResults = []) {
    const merged = [...baseEvidenceList];
    const conflicts = [];
    const evidenceBySubject = new Map();

    for (const ev of baseEvidenceList) {
      const subj = ev.subject || 'root';
      if (!evidenceBySubject.has(subj)) evidenceBySubject.set(subj, []);
      evidenceBySubject.get(subj).push(ev);
    }

    for (const res of workerResults) {
      if (!Array.isArray(res.evidenceGenerated)) continue;
      for (const ev of res.evidenceGenerated) {
        const subj = ev.subject || 'root';
        if (!evidenceBySubject.has(subj)) evidenceBySubject.set(subj, []);

        const existingList = evidenceBySubject.get(subj);
        let hasConflict = false;

        for (const existing of existingList) {
          if (existing.polarity && ev.polarity && existing.polarity !== ev.polarity) {
            const rawConflict = new ExecutionConflict({
              subject: subj,
              evidenceA: existing,
              evidenceB: ev,
              conflictType: 'POLARITY_MISMATCH'
            });
            const resolvedConflict = ConflictResolver.resolve(rawConflict, this.policy);
            conflicts.push(resolvedConflict);
            hasConflict = true;
          }
        }

        existingList.push(ev);
        merged.push(ev);
      }
    }

    const mergeRecord = new EvidenceMerge({
      mergedEvidence: merged,
      conflicts,
      policy: this.policy
    });

    this.mergeHistory.push(mergeRecord);
    return mergeRecord;
  }

  getMergeHistory() {
    return this.mergeHistory;
  }
}
