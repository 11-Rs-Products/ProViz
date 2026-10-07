/**
 * SemanticRefactoring.js
 * Represents semantic refactorings (Extract/Inline/Move function, Signature change, etc.)
 */

export const RefactoringType = Object.freeze({
  EXTRACT_FUNCTION: 'EXTRACT_FUNCTION',
  INLINE_FUNCTION: 'INLINE_FUNCTION',
  MOVE_FUNCTION: 'MOVE_FUNCTION',
  RENAME_SYMBOL: 'RENAME_SYMBOL',
  CHANGE_SIGNATURE: 'CHANGE_SIGNATURE',
  RESTRUCTURE_CONTROL_FLOW: 'RESTRUCTURE_CONTROL_FLOW',
  REPLACE_ALGORITHM: 'REPLACE_ALGORITHM',
  CHANGE_DATA_STRUCTURE: 'CHANGE_DATA_STRUCTURE'
});

export class SemanticRefactoring {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {string} options.type - RefactoringType
   * @param {string} options.targetId
   * @param {Object} [options.transformation={}]
   * @param {string} [options.rationale='']
   */
  constructor({
    id,
    type,
    targetId,
    transformation = {},
    rationale = ''
  }) {
    if (!id || !type || !targetId) {
      throw new Error('SemanticRefactoring requires id, type, and targetId');
    }

    this.id = id;
    this.type = type;
    this.targetId = targetId;
    this.transformation = Object.freeze({ ...transformation });
    this.rationale = rationale;

    Object.freeze(this);
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      targetId: this.targetId,
      transformation: this.transformation,
      rationale: this.rationale
    };
  }

  static fromJSON(json) {
    return new SemanticRefactoring(json);
  }
}
