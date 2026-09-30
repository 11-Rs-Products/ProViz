import { InputMutation } from './InputMutation.js';
import { InputMutationOperator } from './InputMutationOperator.js';

export class StringInputMutation {
  static mutate(str, operator = InputMutationOperator.STRING_INSERT) {
    if (typeof str !== 'string') return new InputMutation({ operator, originalValue: str, mutatedValue: str });
    let mutated = str;
    switch (operator) {
      case InputMutationOperator.STRING_INSERT:
        mutated = str.length > 0 ? str.slice(0, Math.floor(str.length / 2)) + 'X' + str.slice(Math.floor(str.length / 2)) : 'X';
        break;
      case InputMutationOperator.STRING_DELETE:
        mutated = str.length > 0 ? str.slice(0, -1) : '';
        break;
      case InputMutationOperator.STRING_TRUNCATE:
        mutated = str.length > 1 ? str.slice(0, Math.floor(str.length / 2)) : '';
        break;
      case InputMutationOperator.STRING_REPLACE:
        mutated = str.length > 0 ? str.replace(/./, 'A') : 'A';
        break;
      default:
        mutated = str + '!';
    }
    return new InputMutation({ operator, originalValue: str, mutatedValue: mutated });
  }
}
