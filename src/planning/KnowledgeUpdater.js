import { VerificationFact } from './VerificationFact.js';

export class KnowledgeUpdater {
  constructor(knowledgeBase = null) {
    this.knowledgeBase = knowledgeBase;
  }

  ingestEvidence(evidenceList = []) {
    if (!this.knowledgeBase) return;
    KnowledgeUpdater.updateFromEvidence(this.knowledgeBase, evidenceList);
  }

  static updateFromEvidence(knowledgeBase, evidenceList = []) {
    for (const ev of evidenceList) {
      knowledgeBase.addFact(
        new VerificationFact({
          subject: ev.subject,
          fact: ev.fact || `${ev.kind || 'EVIDENCE'}_${ev.polarity || 'TRUE'}`,
          confidence: ev.confidence?.score ?? ev.confidence ?? 0.5,
          sources: ev.sources || [ev.source || 'runtime']
        })
      );
    }
  }
}
