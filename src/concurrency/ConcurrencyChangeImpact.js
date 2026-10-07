/**
 * ConcurrencyChangeImpact.js
 * Estimates concurrency risk and impact from semantic code modifications.
 */

export class ConcurrencyChangeImpact {
  /**
   * Analyzes semantic change diffs to determine concurrency risk.
   * @param {Object} change Semantic change description
   * @param {Array<string>} [change.modifiedFunctions=[]]
   * @param {Array<string>} [change.modifiedVariables=[]]
   * @param {boolean} [change.altersLocking=false]
   * @param {boolean} [change.altersAsync=false]
   * @returns {{ riskLevel: 'LOW'|'MEDIUM'|'HIGH'|'CRITICAL', reasons: Array<string>, obligations: Array<string> }}
   */
  assessImpact(change) {
    const reasons = [];
    const obligations = [];
    let score = 0;

    if (change.altersLocking) {
      score += 4;
      reasons.push('Synchronization or lock acquisition logic modified.');
      obligations.push('Run lock inversion and deadlock cycle analysis.');
    }

    if (change.altersAsync) {
      score += 3;
      reasons.push('Async/await scheduling or event loop timing modified.');
      obligations.push('Run temporal response and liveness verification.');
    }

    if (change.modifiedVariables && change.modifiedVariables.length > 0) {
      score += 2;
      reasons.push(`Modified variables [${change.modifiedVariables.join(', ')}] may be accessed concurrently.`);
      obligations.push('Run happens-before race detection on modified shared variables.');
    }

    let riskLevel = 'LOW';
    if (score >= 6) riskLevel = 'CRITICAL';
    else if (score >= 4) riskLevel = 'HIGH';
    else if (score >= 2) riskLevel = 'MEDIUM';

    return {
      riskLevel,
      score,
      reasons,
      obligations
    };
  }
}
