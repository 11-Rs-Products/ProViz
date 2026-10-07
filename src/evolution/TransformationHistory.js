/**
 * TransformationHistory.js
 * Immutable audit trail and provenance log of all transformation attempts, validations, and decisions.
 */

export class TransformationHistory {
  constructor() {
    this._entries = []; // Array of immutable history records
  }

  record({
    goal,
    candidate,
    decision,
    evidence = [],
    applied = false,
    rolledBack = false,
    metadata = {}
  }) {
    const entry = Object.freeze({
      entryId: `hist:${Date.now()}_${this._entries.length}`,
      timestamp: Date.now(),
      goalId: goal?.id || null,
      candidateId: candidate?.candidateId || null,
      decisionOutcome: decision?.outcome || null,
      reasons: decision?.reasons ? [...decision.reasons] : [],
      evidenceCount: evidence.length,
      applied,
      rolledBack,
      metadata: Object.freeze({ ...metadata })
    });

    this._entries.push(entry);
    return entry;
  }

  getEntries() {
    return [...this._entries];
  }

  getEntry(entryId) {
    return this._entries.find(e => e.entryId === entryId) || null;
  }

  getHistoryForGoal(goalId) {
    return this._entries.filter(e => e.goalId === goalId);
  }

  getHistoryForCandidate(candidateId) {
    return this._entries.filter(e => e.candidateId === candidateId);
  }
}
