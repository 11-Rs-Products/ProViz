import { InputMutation } from './InputMutation.js';
import { InputMutationOperator } from './InputMutationOperator.js';

export class NumericInputMutation {
  static mutate(val, operator = InputMutationOperator.INCREMENT) {
    if (typeof val !== 'number') return new InputMutation({ operator, originalValue: val, mutatedValue: val });
    let mutated = val;
    switch (operator) {
      case InputMutationOperator.INCREMENT:
        mutated = val + 1;
        break;
      case InputMutationOperator.DECREMENT:
        mutated = val - 1;
        break;
      case InputMutationOperator.NEGATE:
        mutated = -val;
        break;
      case InputMutationOperator.ZERO:
        mutated = 0;
        break;
      case InputMutationOperator.BOUNDARY_SNAP:
        mutated = Math.abs(val) > 100 ? (val > 0 ? 100 : -100) : 0;
        break;
      default:
        mutated = val + 1;
    }
    return new InputMutation({ operator, originalValue: val, mutatedValue: mutated });
  }
}
