import { NumericInputMutation } from './NumericInputMutation.js';
import { StringInputMutation } from './StringInputMutation.js';
import { CollectionInputMutation } from './CollectionInputMutation.js';
import { StructureInputMutation } from './StructureInputMutation.js';
import { InputMutationOperator } from './InputMutationOperator.js';

export class SeedMutator {
  constructor({ operators = Object.values(InputMutationOperator) } = {}) {
    this.operators = operators;
  }

  mutate(seedEntry) {
    const val = seedEntry.value;
    let mutation = null;

    if (typeof val === 'number') {
      mutation = NumericInputMutation.mutate(val, InputMutationOperator.INCREMENT);
    } else if (typeof val === 'string') {
      mutation = StringInputMutation.mutate(val, InputMutationOperator.STRING_INSERT);
    } else if (Array.isArray(val)) {
      mutation = CollectionInputMutation.mutate(val, InputMutationOperator.ARRAY_APPEND);
    } else if (typeof val === 'object' && val !== null) {
      mutation = StructureInputMutation.mutate(val, InputMutationOperator.STRUCT_NULLIFY);
    } else {
      mutation = NumericInputMutation.mutate(0, InputMutationOperator.ZERO);
    }

    return mutation;
  }
}
