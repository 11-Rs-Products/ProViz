/**
 * SecuritySink.js
 * Represents canonical security-sensitive sinks and operations.
 */

export const SinkOperation = Object.freeze({
  AUTHORIZATION: 'AUTHORIZATION',
  FILE_WRITE: 'FILE_WRITE',
  FILE_READ: 'FILE_READ',
  NETWORK_SEND: 'NETWORK_SEND',
  NETWORK_RECEIVE: 'NETWORK_RECEIVE',
  COMMAND_EXECUTION: 'COMMAND_EXECUTION',
  DATABASE_WRITE: 'DATABASE_WRITE',
  DATABASE_READ: 'DATABASE_READ',
  SECRET_OUTPUT: 'SECRET_OUTPUT',
  PRIVILEGED_OPERATION: 'PRIVILEGED_OPERATION',
  RESOURCE_ALLOCATION: 'RESOURCE_ALLOCATION'
});

export class SecuritySink {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {string} options.operation - SinkOperation
   * @param {string} options.targetNodeId
   * @param {Array<string>} [options.requiredSanitizers=[]]
   * @param {string} [options.requiredPrivilege='']
   * @param {Object} [options.attributes={}]
   */
  constructor({
    id,
    operation = SinkOperation.PRIVILEGED_OPERATION,
    targetNodeId,
    requiredSanitizers = [],
    requiredPrivilege = '',
    attributes = {}
  }) {
    if (!id || !targetNodeId) throw new Error('SecuritySink requires id and targetNodeId');
    this.id = id;
    this.operation = operation;
    this.targetNodeId = targetNodeId;
    this.requiredSanitizers = Object.freeze([...requiredSanitizers]);
    this.requiredPrivilege = requiredPrivilege;
    this.attributes = Object.freeze({ ...attributes });
    Object.freeze(this);
  }

  toJSON() {
    return {
      id: this.id,
      operation: this.operation,
      targetNodeId: this.targetNodeId,
      requiredSanitizers: [...this.requiredSanitizers],
      requiredPrivilege: this.requiredPrivilege,
      attributes: { ...this.attributes }
    };
  }

  static fromJSON(json) {
    return new SecuritySink(json);
  }
}
