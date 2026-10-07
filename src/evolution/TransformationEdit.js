/**
 * TransformationEdit.js
 * Atomic source-level edit operation with semantic target and fingerprint safeguards.
 */

export const EditOperation = Object.freeze({
  INSERT: 'INSERT',
  DELETE: 'DELETE',
  REPLACE: 'REPLACE',
  MOVE: 'MOVE',
  RENAME: 'RENAME',
  WRAP: 'WRAP',
  UNWRAP: 'UNWRAP',
  SPLIT: 'SPLIT',
  MERGE: 'MERGE',
  REORDER: 'REORDER'
});

export class TransformationEdit {
  /**
   * @param {Object} options
   * @param {string} options.id - Deterministic edit identifier
   * @param {string} options.operation - EditOperation
   * @param {string} options.file - Target source file path
   * @param {Object} [options.sourceRange] - { startLine, startCol, endLine, endCol }
   * @param {string} [options.replacement=''] - New code text or template
   * @param {string} [options.semanticTarget=''] - Targeted semantic entity ID
   * @param {string} [options.expectedFingerprint=''] - AST/Source hash fingerprint to prevent drift
   */
  constructor({
    id,
    operation = EditOperation.REPLACE,
    file,
    sourceRange = null,
    replacement = '',
    semanticTarget = '',
    expectedFingerprint = ''
  }) {
    if (!id || typeof id !== 'string') {
      throw new Error('TransformationEdit requires a valid id');
    }
    if (!file) {
      throw new Error('TransformationEdit requires a file target');
    }

    this.id = id;
    this.operation = operation;
    this.file = file;
    this.sourceRange = sourceRange ? Object.freeze({ ...sourceRange }) : null;
    this.replacement = replacement;
    this.semanticTarget = semanticTarget;
    this.expectedFingerprint = expectedFingerprint;

    Object.freeze(this);
  }

  applyToSource(sourceCode) {
    if (this.operation === EditOperation.REPLACE && this.sourceRange) {
      const lines = sourceCode.split('\n');
      const before = lines.slice(0, Math.max(0, this.sourceRange.startLine - 1));
      const after = lines.slice(this.sourceRange.endLine);
      return [...before, this.replacement, ...after].join('\n');
    }
    if (this.operation === EditOperation.INSERT) {
      return `${sourceCode}\n${this.replacement}`;
    }
    return sourceCode;
  }

  toJSON() {
    return {
      id: this.id,
      operation: this.operation,
      file: this.file,
      sourceRange: this.sourceRange,
      replacement: this.replacement,
      semanticTarget: this.semanticTarget,
      expectedFingerprint: this.expectedFingerprint
    };
  }

  static fromJSON(json) {
    return new TransformationEdit(json);
  }
}
