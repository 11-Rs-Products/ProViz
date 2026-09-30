export class MetamorphicOracle {
  constructor({ id, relation = 'EQUALS', relationPredicate = null } = {}) {
    this.id = id || `oracle_${Math.random().toString(36).substring(2, 9)}`;
    this.relation = relation;
    this.relationPredicate = relationPredicate;
  }

  evaluate(baselineOutput, transformedOutput) {
    if (typeof this.relationPredicate === 'function') {
      const result = this.relationPredicate(baselineOutput, transformedOutput);
      return typeof result === 'boolean' ? result : (result?.satisfies ?? true);
    }
    const res = MetamorphicOracle.evaluate(this.relation, baselineOutput, transformedOutput);
    return res.satisfies;
  }

  static evaluate(outputRelation, baselineOutput, transformedOutput) {
    switch (outputRelation) {
      case 'EQUALS':
      case 'PERMUTATION_INVARIANCE': {
        const eq = (baselineOutput === transformedOutput) ||
          (JSON.stringify(baselineOutput) === JSON.stringify(transformedOutput));
        return {
          satisfies: eq,
          reason: eq
            ? `Outputs matched: ${JSON.stringify(baselineOutput)}`
            : `Expected equal outputs, but baseline gave ${JSON.stringify(baselineOutput)} while transformed gave ${JSON.stringify(transformedOutput)}`,
        };
      }

      case 'IDEMPOTENCE': {
        const eq = (baselineOutput === transformedOutput) ||
          (JSON.stringify(baselineOutput) === JSON.stringify(transformedOutput));
        return {
          satisfies: eq,
          reason: eq ? 'Idempotence verified f(f(x)) == f(x)' : 'Idempotence violated',
        };
      }

      case 'GREATER_EQUAL': {
        const satisfies = transformedOutput >= baselineOutput;
        return {
          satisfies,
          reason: satisfies ? 'Monotonicity holds' : `Violated: ${transformedOutput} < ${baselineOutput}`,
        };
      }

      default:
        return {
          satisfies: true,
          reason: 'Custom metamorphic relation observed',
        };
    }
  }
}
