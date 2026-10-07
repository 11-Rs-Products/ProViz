/**
 * DistributedFault.js
 * Represents temporal/concurrent fault types and fault specifications.
 */

export const FaultType = Object.freeze({
  MESSAGE_LOSS: 'MESSAGE_LOSS',
  MESSAGE_DUPLICATION: 'MESSAGE_DUPLICATION',
  MESSAGE_REORDER: 'MESSAGE_REORDER',
  NETWORK_PARTITION: 'NETWORK_PARTITION',
  NODE_CRASH: 'NODE_CRASH',
  NODE_RESTART: 'NODE_RESTART',
  CLOCK_SKEW: 'CLOCK_SKEW',
  NETWORK_DELAY: 'NETWORK_DELAY',
  DEPENDENCY_TIMEOUT: 'DEPENDENCY_TIMEOUT',
  PARTIAL_FAILURE: 'PARTIAL_FAILURE'
});

export class DistributedFault {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {string} options.type
   * @param {string} [options.targetNodeId=null]
   * @param {string} [options.targetChannelId=null]
   * @param {number} [options.triggerTime=0]
   * @param {number} [options.duration=0]
   * @param {Object} [options.parameters={}]
   */
  constructor({
    id,
    type,
    targetNodeId = null,
    targetChannelId = null,
    triggerTime = 0,
    duration = 0,
    parameters = {}
  }) {
    if (!id || !type) throw new Error('DistributedFault requires id and type');
    this.id = id;
    this.type = type;
    this.targetNodeId = targetNodeId;
    this.targetChannelId = targetChannelId;
    this.triggerTime = triggerTime;
    this.duration = duration;
    this.parameters = Object.freeze({ ...parameters });
    Object.freeze(this);
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      targetNodeId: this.targetNodeId,
      targetChannelId: this.targetChannelId,
      triggerTime: this.triggerTime,
      duration: this.duration,
      parameters: { ...this.parameters }
    };
  }

  static fromJSON(json) {
    return new DistributedFault(json);
  }
}
