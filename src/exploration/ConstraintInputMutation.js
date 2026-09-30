import { InputMutation } from './InputMutation.js';

export class ConstraintInputMutation {
  static mutate(val, constraints = []) {
    // Perturb value while respecting or testing constraints
    let mutated = typeof val === 'number' ? val + 1 : val;
    return new InputMutation({
      operator: 'CONSTRAINT_PERTURB',
      originalValue: val,
      mutatedValue: mutated
    });
  }
}
