/**
 * LinearizabilityAnalyzer.js
 * Verifies whether concurrent operation histories can be linearized to a valid sequential history.
 */

export class LinearizabilityAnalyzer {
  /**
   * Verifies if an operation history is linearizable with respect to a sequential specification.
   * @param {Array<import('./LinearizabilityModel.js').ConcurrentOperation>} operations
   * @param {Object} [sequentialSpec={}] Initial state and reducer function
   * @returns {{ isLinearizable: boolean, sequentialOrder?: Array<string>, counterexample?: Object }}
   */
  verify(operations, sequentialSpec = {}) {
    const { initialState = 0, apply = (state, op) => ({ state: state + (op.args[0] || 0), result: state + (op.args[0] || 0) }) } = sequentialSpec;

    // Build precedence constraints: if opA response < opB invoke, then opA must precede opB
    const ops = [...operations].sort((a, b) => a.invokeTime - b.invokeTime);
    const n = ops.length;
    
    // Find all permutations that satisfy real-time precedence and validate state transition results
    const used = new Array(n).fill(false);
    const currentOrder = [];

    const search = (currentState) => {
      if (currentOrder.length === n) {
        return true;
      }

      for (let i = 0; i < n; i++) {
        if (!used[i]) {
          const op = ops[i];

          // Check if any unfinished prior operation must precede op
          let precedenceSatisfied = true;
          for (let j = 0; j < n; j++) {
            if (!used[j] && ops[j].precedes(op)) {
              precedenceSatisfied = false;
              break;
            }
          }

          if (precedenceSatisfied) {
            const next = apply(currentState, op);
            // If the operation specified an expected return result, check it
            if (op.result !== undefined && next.result !== undefined && next.result !== op.result) {
              continue; // Invalid sequential step
            }

            used[i] = true;
            currentOrder.push(op.id);

            if (search(next.state)) {
              return true;
            }

            currentOrder.pop();
            used[i] = false;
          }
        }
      }

      return false;
    };

    const isLinearizable = search(initialState);

    if (isLinearizable) {
      return {
        isLinearizable: true,
        sequentialOrder: [...currentOrder]
      };
    }

    return {
      isLinearizable: false,
      counterexample: {
        operations: ops.map(o => o.toJSON ? o.toJSON() : o),
        reason: 'No valid sequential execution satisfies real-time ordering and sequential object semantics.'
      }
    };
  }
}
