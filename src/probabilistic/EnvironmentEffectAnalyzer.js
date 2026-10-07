export class EnvironmentEffectAnalyzer {
  /**
   * Correlates outcome variation with environmental factors.
   */
  static analyzeCorrelation(observations = []) {
    if (observations.length < 2) {
      return { hasCorrelation: false, correlatedDimensions: [] };
    }

    const envMap = new Map(); // dim -> Map(val, Set(outcomes))
    for (const obs of observations) {
      const outcome = String(obs.outcome);
      const env = obs.environment || {};

      for (const [dim, val] of Object.entries(env)) {
        if (!envMap.has(dim)) envMap.set(dim, new Map());
        const valMap = envMap.get(dim);
        if (!valMap.has(val)) valMap.set(val, new Set());
        valMap.get(val).add(outcome);
      }
    }

    const correlatedDimensions = [];
    for (const [dim, valMap] of envMap.entries()) {
      if (valMap.size > 1) {
        // Different env values produced different distinct outcome sets
        correlatedDimensions.push(dim);
      }
    }

    return {
      hasCorrelation: correlatedDimensions.length > 0,
      correlatedDimensions
    };
  }
}
