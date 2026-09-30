import { InputMutation } from './InputMutation.js';

export class GrammarInputMutation {
  static mutate(treeOrText, grammar) {
    // Perturb a subtree or replace a nonterminal token with an alternative expansion
    const mutated = typeof treeOrText === 'string' ? treeOrText + ' 0' : treeOrText;
    return new InputMutation({
      operator: 'GRAMMAR_SUBTREE_REPLACE',
      originalValue: treeOrText,
      mutatedValue: mutated
    });
  }
}
