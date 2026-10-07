/**
 * TemporalFormula.js
 * AST representation and evaluation helper for temporal logic expressions.
 */

export class TemporalFormula {
  /**
   * @param {Object} options
   * @param {string} options.op Operator: 'ALWAYS', 'EVENTUALLY', 'UNTIL', 'NEXT', 'AND', 'OR', 'NOT', 'IMPLIES', 'ATOM'
   * @param {Array<TemporalFormula>} [options.operands=[]]
   * @param {Function} [options.evaluator=null] Predicate function for ATOM
   * @param {number|null} [options.bound=null] Time or step bound
   */
  constructor({ op, operands = [], evaluator = null, bound = null }) {
    this.op = op;
    this.operands = Object.freeze([...operands]);
    this.evaluator = evaluator;
    this.bound = bound;
    Object.freeze(this);
  }

  static atom(predicate) {
    return new TemporalFormula({ op: 'ATOM', evaluator: predicate });
  }

  static always(formula, bound = null) {
    return new TemporalFormula({ op: 'ALWAYS', operands: [formula], bound });
  }

  static eventually(formula, bound = null) {
    return new TemporalFormula({ op: 'EVENTUALLY', operands: [formula], bound });
  }

  static response(p, q, bound = null) {
    return new TemporalFormula({ op: 'RESPONSE', operands: [p, q], bound });
  }

  static and(...formulas) {
    return new TemporalFormula({ op: 'AND', operands: formulas });
  }

  static or(...formulas) {
    return new TemporalFormula({ op: 'OR', operands: formulas });
  }

  static not(formula) {
    return new TemporalFormula({ op: 'NOT', operands: [formula] });
  }
}
