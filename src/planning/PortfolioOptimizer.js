export class PortfolioOptimizer {
  /**
   * Selects optimal schedule of verification techniques under budget.
   */
  static optimize(arg1, arg2, arg3) {
    let candidateList = [];
    let budgetMs = 1000;

    if (Array.isArray(arg1)) {
      candidateList = arg1;
      budgetMs = typeof arg2 === 'number' ? arg2 : 1000;
    } else {
      candidateList = Array.isArray(arg2) ? arg2 : [];
      budgetMs = typeof arg3 === 'number' ? arg3 : 1000;
    }

    if (!candidateList || candidateList.length === 0) {
      const emptyRes = [];
      emptyRes.schedule = [];
      emptyRes.estimatedTotalCostMs = 0;
      emptyRes.expectedValue = 0;
      return emptyRes;
    }

    // Sort candidates by cost-effectiveness: expectedGain / cost
    const sorted = [...candidateList].sort((a, b) => {
      const costA = a.costMs ?? a.estimatedCost?.wallClockEstimateMs ?? 10;
      const costB = b.costMs ?? b.estimatedCost?.wallClockEstimateMs ?? 10;
      const gainA = a.expectedGain ?? a.expectedValue?.informationGain ?? 0.5;
      const gainB = b.expectedGain ?? b.expectedValue?.informationGain ?? 0.5;
      const effA = gainA / Math.max(1, costA);
      const effB = gainB / Math.max(1, costB);
      return effB - effA;
    });

    const schedule = [];
    let spentMs = 0;
    let totalVal = 0;

    for (const exp of sorted) {
      const costMs = exp.costMs ?? exp.estimatedCost?.wallClockEstimateMs ?? 10;
      const gain = exp.expectedGain ?? exp.expectedValue?.informationGain ?? 0.5;
      if (spentMs + costMs <= budgetMs) {
        schedule.push(exp);
        spentMs += costMs;
        totalVal += gain;
      }
    }

    schedule.schedule = schedule;
    schedule.estimatedTotalCostMs = spentMs;
    schedule.expectedValue = totalVal;
    return schedule;
  }
}
