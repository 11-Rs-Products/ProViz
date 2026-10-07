/**
 * TransformationSession.js
 * Manages the lifecycle state machine of an autonomous transformation execution.
 */

export const SessionState = Object.freeze({
  CREATED: 'CREATED',
  PLANNED: 'PLANNED',
  SYNTHESIZING: 'SYNTHESIZING',
  VALIDATING: 'VALIDATING',
  VERIFYING: 'VERIFYING',
  COMPARING: 'COMPARING',
  APPROVED: 'APPROVED',
  APPLIED: 'APPLIED',
  REVERIFIED: 'REVERIFIED',
  REJECTED: 'REJECTED',
  ROLLED_BACK: 'ROLLED_BACK'
});

export class TransformationSession {
  /**
   * @param {Object} options
   * @param {string} options.sessionId
   * @param {string} options.goalId
   * @param {string} [options.state='CREATED'] - SessionState
   * @param {Array<string>} [options.candidateIds=[]]
   * @param {string} [options.selectedCandidateId=null]
   * @param {string} [options.decisionId=null]
   */
  constructor({
    sessionId,
    goalId,
    state = SessionState.CREATED,
    candidateIds = [],
    selectedCandidateId = null,
    decisionId = null
  }) {
    if (!sessionId || !goalId) {
      throw new Error('TransformationSession requires sessionId and goalId');
    }

    this.sessionId = sessionId;
    this.goalId = goalId;
    this.state = state;
    this.candidateIds = Object.freeze([...candidateIds]);
    this.selectedCandidateId = selectedCandidateId;
    this.decisionId = decisionId;

    Object.freeze(this);
  }

  transition(newState, updates = {}) {
    return new TransformationSession({
      sessionId: this.sessionId,
      goalId: this.goalId,
      state: newState,
      candidateIds: updates.candidateIds || this.candidateIds,
      selectedCandidateId: updates.selectedCandidateId !== undefined ? updates.selectedCandidateId : this.selectedCandidateId,
      decisionId: updates.decisionId !== undefined ? updates.decisionId : this.decisionId
    });
  }

  toJSON() {
    return {
      sessionId: this.sessionId,
      goalId: this.goalId,
      state: this.state,
      candidateIds: [...this.candidateIds],
      selectedCandidateId: this.selectedCandidateId,
      decisionId: this.decisionId
    };
  }

  static fromJSON(json) {
    return new TransformationSession(json);
  }
}
