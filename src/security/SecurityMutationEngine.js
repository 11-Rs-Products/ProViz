/**
 * SecurityMutationEngine.js
 * Extends Stage 20 mutation testing with security-specific mutations:
 * REMOVE_VALIDATION, BYPASS_AUTHORIZATION, WEAKEN_CHECK, ALTER_PRIVILEGE, SKIP_SANITIZATION, CORRUPT_SECURITY_STATE.
 */

export const SecurityMutationOperator = Object.freeze({
  REMOVE_VALIDATION: 'REMOVE_VALIDATION',
  BYPASS_AUTHORIZATION: 'BYPASS_AUTHORIZATION',
  WEAKEN_CHECK: 'WEAKEN_CHECK',
  ALTER_PRIVILEGE: 'ALTER_PRIVILEGE',
  SKIP_SANITIZATION: 'SKIP_SANITIZATION',
  CORRUPT_SECURITY_STATE: 'CORRUPT_SECURITY_STATE',
  REMOVE_BOUNDARY: 'REMOVE_BOUNDARY'
});

export class SecurityMutant {
  constructor({ id, operator, targetNodeId, originalCode = '', mutatedCode = '', survives = false }) {
    if (!id || !operator || !targetNodeId) throw new Error('SecurityMutant requires id, operator, and targetNodeId');
    this.id = id;
    this.operator = operator;
    this.targetNodeId = targetNodeId;
    this.originalCode = originalCode;
    this.mutatedCode = mutatedCode;
    this.survives = survives;
    Object.freeze(this);
  }

  toJSON() {
    return {
      id: this.id,
      operator: this.operator,
      targetNodeId: this.targetNodeId,
      originalCode: this.originalCode,
      mutatedCode: this.mutatedCode,
      survives: this.survives
    };
  }
}

export class SecurityMutationEngine {
  /**
   * Generates security mutants across target nodes.
   * @param {Array<string>} targetNodeIds
   * @returns {Array<SecurityMutant>}
   */
  generateMutants(targetNodeIds = []) {
    const mutants = [];
    const ops = [
      SecurityMutationOperator.REMOVE_VALIDATION,
      SecurityMutationOperator.BYPASS_AUTHORIZATION,
      SecurityMutationOperator.WEAKEN_CHECK,
      SecurityMutationOperator.SKIP_SANITIZATION
    ];

    for (let i = 0; i < targetNodeIds.length; i++) {
      const nodeId = targetNodeIds[i];
      for (const op of ops) {
        mutants.push(new SecurityMutant({
          id: `mut:${nodeId}_${op}`,
          operator: op,
          targetNodeId: nodeId,
          originalCode: `validate(${nodeId});`,
          mutatedCode: `/* bypassed */ // ${op}`,
          survives: false
        }));
      }
    }
    return mutants;
  }

  /**
   * Evaluates security test suite mutation kill rate.
   * @param {Array<SecurityMutant>} mutants
   * @param {Object} [testSuite]
   * @returns {Object}
   */
  evaluateMutantKillRate(mutants = [], testSuite = {}) {
    const killed = [];
    const survived = [];

    for (const m of mutants) {
      if (testSuite.survivingMutantIds?.includes(m.id)) {
        survived.push(new SecurityMutant({ ...m.toJSON(), survives: true }));
      } else {
        killed.push(m);
      }
    }

    const killRate = mutants.length > 0 ? (killed.length / mutants.length) : 1.0;

    return {
      totalMutants: mutants.length,
      killedCount: killed.length,
      survivedCount: survived.length,
      killRate,
      survivingMutants: survived,
      isRobust: survived.length === 0
    };
  }
}
