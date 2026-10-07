export class ResourceValueModel {
  /**
   * V(r) = (ΔC + ΔU + ΔR) / Cost(r)
   */
  static computeReturn(confidenceGain = 0.5, uncertaintyReduction = 0.5, riskReduction = 0.5, cost = 1.0) {
    const value = Number(confidenceGain) + Number(uncertaintyReduction) + Number(riskReduction);
    const c = Math.max(0.1, Number(cost));
    return Math.round((value / c) * 1e6) / 1e6;
  }
}
