import { InputMutationOperator } from './InputMutationOperator.js';

export class InputMutation {
  constructor({
    operator,
    originalValue,
    mutatedValue,
    targetPath = '',
    metadata = {}
  } = {}) {
    this.operator = operator;
    this.originalValue = originalValue;
    this.mutatedValue = mutatedValue;
    this.targetPath = targetPath;
    this.metadata = metadata;
  }

  toJSON() {
    return {
      operator: this.operator,
      originalValue: this.originalValue,
      mutatedValue: this.mutatedValue,
      targetPath: this.targetPath,
      metadata: this.metadata
    };
  }
}
