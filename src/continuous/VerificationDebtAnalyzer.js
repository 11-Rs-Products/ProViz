/**
 * VerificationDebtAnalyzer.js
 * Analyzes and calculates aggregate verification debt across project regions:
 * Debt = Sum_i (Risk_i * Scope_i * Staleness_i)
 */

export class VerificationDebtAnalyzer {
  /**
   * Computes aggregate verification debt from debt items.
   * @param {Array<import('./VerificationDebt.js').VerificationDebtItem>} debtItems
   * @returns {{ totalDebt: number, itemCount: number, criticalDebts: Array<Object>, summary: Object }}
   */
  calculateDebt(debtItems) {
    if (!debtItems || debtItems.length === 0) {
      return { totalDebt: 0, itemCount: 0, criticalDebts: [], summary: {} };
    }

    let total = 0;
    const criticalDebts = [];
    const kindSummary = {};

    for (const item of debtItems) {
      const score = typeof item.score === 'function' ? item.score() : (item.risk * item.scope * item.staleness);
      total += score;

      kindSummary[item.debtKind] = (kindSummary[item.debtKind] || 0) + score;

      if (score >= 4.0 || item.risk >= 4.0) {
        criticalDebts.push(item);
      }
    }

    return {
      totalDebt: Math.round(total * 100) / 100,
      itemCount: debtItems.length,
      criticalDebts,
      summary: kindSummary
    };
  }
}
