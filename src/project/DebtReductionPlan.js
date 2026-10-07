/**
 * DebtReductionPlan.js
 * Generates an actionable, ROI-ranked remediation plan for paying down technical and verification debt.
 */

import { TechnicalDebt } from './TechnicalDebt.js';

export class DebtReductionPlan {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {Object[]} [options.actions=[]]
   * @param {number} options.estimatedInitialDebt
   * @param {number} options.estimatedFinalDebt
   * @param {number} options.totalEffortCost
   */
  constructor({
    id,
    actions = [],
    estimatedInitialDebt = 0,
    estimatedFinalDebt = 0,
    totalEffortCost = 0
  }) {
    this.id = id;
    this.actions = Object.freeze([...actions]);
    this.estimatedInitialDebt = estimatedInitialDebt;
    this.estimatedFinalDebt = estimatedFinalDebt;
    this.totalEffortCost = totalEffortCost;
    this.estimatedDebtReduction = Number((estimatedInitialDebt - estimatedFinalDebt).toFixed(4));
    Object.freeze(this);
  }

  /**
   * Generate reduction plan from technical debt
   * @param {TechnicalDebt} technicalDebt
   * @param {number} [maxActions=10]
   */
  static fromTechnicalDebt(technicalDebt, maxActions = 10) {
    const items = [...technicalDebt.items];
    // Sort by ROI: (debtScore / remediationCost)
    items.sort((a, b) => {
      const roiA = a.debtScore / Math.max(0.1, a.remediationCost);
      const roiB = b.debtScore / Math.max(0.1, b.remediationCost);
      return roiB - roiA;
    });

    const selected = items.slice(0, maxActions);
    const actions = selected.map((item, idx) => ({
      step: idx + 1,
      debtItemId: item.id,
      title: item.title,
      category: item.category,
      targetEntityId: item.targetEntityId,
      debtScore: item.debtScore,
      remediationCost: item.remediationCost,
      roi: Number((item.debtScore / Math.max(0.1, item.remediationCost)).toFixed(2))
    }));

    const totalEffort = actions.reduce((acc, a) => acc + a.remediationCost, 0);
    const debtReduced = actions.reduce((acc, a) => acc + a.debtScore, 0);

    return new DebtReductionPlan({
      id: `PLAN_DEBT_${Date.now()}`,
      actions,
      estimatedInitialDebt: technicalDebt.totalDebtScore,
      estimatedFinalDebt: Math.max(0, technicalDebt.totalDebtScore - debtReduced),
      totalEffortCost: totalEffort
    });
  }

  toJSON() {
    return {
      id: this.id,
      actions: this.actions,
      estimatedInitialDebt: this.estimatedInitialDebt,
      estimatedFinalDebt: this.estimatedFinalDebt,
      estimatedDebtReduction: this.estimatedDebtReduction,
      totalEffortCost: this.totalEffortCost
    };
  }

  static fromJSON(json) {
    return new DebtReductionPlan(json);
  }
}
