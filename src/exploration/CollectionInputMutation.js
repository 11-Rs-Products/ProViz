import { InputMutation } from './InputMutation.js';
import { InputMutationOperator } from './InputMutationOperator.js';

export class CollectionInputMutation {
  static mutate(arr, operator = InputMutationOperator.ARRAY_APPEND) {
    if (!Array.isArray(arr)) return new InputMutation({ operator, originalValue: arr, mutatedValue: arr });
    let mutated = [...arr];
    switch (operator) {
      case InputMutationOperator.ARRAY_APPEND:
        mutated.push(arr.length > 0 ? arr[arr.length - 1] : 0);
        break;
      case InputMutationOperator.ARRAY_POP:
        mutated.pop();
        break;
      case InputMutationOperator.ARRAY_REVERSE:
        mutated.reverse();
        break;
      case InputMutationOperator.ARRAY_SHUFFLE:
        for (let i = mutated.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [mutated[i], mutated[j]] = [mutated[j], mutated[i]];
        }
        break;
      default:
        mutated.push(0);
    }
    return new InputMutation({ operator, originalValue: arr, mutatedValue: mutated });
  }
}
