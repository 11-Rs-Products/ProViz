/**
 * SemanticChange.js
 * Represents a semantic mutation or change to the codebase or its verification environment.
 */

export const SemanticChangeType = Object.freeze({
  ADDED: 'ADDED',
  REMOVED: 'REMOVED',
  MODIFIED: 'MODIFIED',
  RENAMED: 'RENAMED',
  MOVED: 'MOVED',
  TYPE_CHANGED: 'TYPE_CHANGED',
  CONTROL_FLOW_CHANGED: 'CONTROL_FLOW_CHANGED',
  DATA_FLOW_CHANGED: 'DATA_FLOW_CHANGED',
  CALL_GRAPH_CHANGED: 'CALL_GRAPH_CHANGED',
  MEMORY_BEHAVIOR_CHANGED: 'MEMORY_BEHAVIOR_CHANGED',
  CONTRACT_CHANGED: 'CONTRACT_CHANGED',
  SPECIFICATION_CHANGED: 'SPECIFICATION_CHANGED',
  DEPENDENCY_CHANGED: 'DEPENDENCY_CHANGED',
  ENVIRONMENT_CHANGED: 'ENVIRONMENT_CHANGED'
});

export class SemanticChange {
  /**
   * @param {Object} options
   * @param {string} options.id - Deterministic change identifier
   * @param {string} options.type - SemanticChangeType
   * @param {string} options.targetId - ID of changed SemanticNode
   * @param {*} [options.oldValue] - Previous AST/type/value representation
   * @param {*} [options.newValue] - New AST/type/value representation
   * @param {Object} [options.details] - Additional contextual diff details
   * @param {number} [options.timestamp=Date.now()]
   */
  constructor({
    id,
    type,
    targetId,
    oldValue = null,
    newValue = null,
    details = {},
    timestamp = Date.now()
  }) {
    if (!id || typeof id !== 'string') {
      throw new Error('SemanticChange requires a valid id');
    }
    if (!type || !SemanticChangeType[type]) {
      throw new Error(`SemanticChange requires a valid SemanticChangeType, got ${type}`);
    }
    if (!targetId) {
      throw new Error('SemanticChange requires targetId');
    }

    this.id = id;
    this.type = type;
    this.targetId = targetId;
    this.oldValue = oldValue;
    this.newValue = newValue;
    this.details = Object.freeze({ ...details });
    this.timestamp = timestamp;

    Object.freeze(this);
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      targetId: this.targetId,
      oldValue: this.oldValue,
      newValue: this.newValue,
      details: this.details,
      timestamp: this.timestamp
    };
  }

  static fromJSON(json) {
    return new SemanticChange(json);
  }
}
