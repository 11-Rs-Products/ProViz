/**
 * SecuritySession.js
 * Tracks lifecycle of an adversarial security analysis workflow:
 * CREATED -> MODELED -> ATTACKING -> ANALYZING -> VERIFYING -> MITIGATING -> RETESTING -> CERTIFIED / FAILED.
 */

export const SecuritySessionState = Object.freeze({
  CREATED: 'CREATED',
  MODELED: 'MODELED',
  ATTACKING: 'ATTACKING',
  ANALYZING: 'ANALYZING',
  VERIFYING: 'VERIFYING',
  MITIGATING: 'MITIGATING',
  RETESTING: 'RETESTING',
  CERTIFIED: 'CERTIFIED',
  FAILED: 'FAILED',
  PAUSED: 'PAUSED'
});

export class SecuritySession {
  /**
   * @param {Object} options
   * @param {string} options.sessionId
   * @param {string} options.threatModelId
   * @param {string} [options.state=SecuritySessionState.CREATED]
   * @param {Array<string>} [options.history=[]]
   * @param {Object} [options.metadata={}]
   */
  constructor({
    sessionId,
    threatModelId,
    state = SecuritySessionState.CREATED,
    history = [],
    metadata = {}
  }) {
    if (!sessionId || !threatModelId) {
      throw new Error('SecuritySession requires sessionId and threatModelId');
    }
    this.sessionId = sessionId;
    this.threatModelId = threatModelId;
    this.state = state;
    this.history = Object.freeze([...history]);
    this.metadata = Object.freeze({ ...metadata });
    Object.freeze(this);
  }

  transition(nextState, details = {}) {
    const entry = `[${new Date().toISOString()}] ${this.state} -> ${nextState} (${JSON.stringify(details)})`;
    return new SecuritySession({
      sessionId: this.sessionId,
      threatModelId: this.threatModelId,
      state: nextState,
      history: [...this.history, entry],
      metadata: { ...this.metadata, ...details }
    });
  }

  toJSON() {
    return {
      sessionId: this.sessionId,
      threatModelId: this.threatModelId,
      state: this.state,
      history: [...this.history],
      metadata: { ...this.metadata }
    };
  }

  static fromJSON(json) {
    return new SecuritySession(json);
  }
}
