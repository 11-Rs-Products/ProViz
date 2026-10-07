export class WorkspaceMerge {
  static mergeEvidence(baseEvidenceList = [], workerResults = []) {
    const getKey = (e) => e.id || e.evidenceId || `${e.kind || 'EV'}_${e.subject || 'root'}_${e.polarity || ''}`;
    const merged = [...baseEvidenceList];
    const seenIds = new Set(baseEvidenceList.map(getKey));

    for (const res of workerResults) {
      if (Array.isArray(res.evidenceGenerated)) {
        for (const ev of res.evidenceGenerated) {
          const key = getKey(ev);
          if (!seenIds.has(key)) {
            seenIds.add(key);
            merged.push(ev);
          }
        }
      }
    }

    return merged;
  }
}
