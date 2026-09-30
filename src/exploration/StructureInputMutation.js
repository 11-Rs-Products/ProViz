import { InputMutation } from './InputMutation.js';
import { InputMutationOperator } from './InputMutationOperator.js';

export class StructureInputMutation {
  static mutate(obj, operator = InputMutationOperator.STRUCT_NULLIFY) {
    if (typeof obj !== 'object' || obj === null) return new InputMutation({ operator, originalValue: obj, mutatedValue: obj });
    const mutated = { ...obj };
    const keys = Object.keys(mutated);
    if (keys.length > 0) {
      const key = keys[0];
      if (operator === InputMutationOperator.STRUCT_NULLIFY) {
        mutated[key] = null;
      } else {
        delete mutated[key];
      }
    }
    return new InputMutation({ operator, originalValue: obj, mutatedValue: mutated });
  }
}
