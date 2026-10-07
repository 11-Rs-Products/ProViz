/**
 * FailureModel.js
 * Represents canonical failure modes: TIMEOUT, CRASH, EXCEPTION, RESOURCE_EXHAUSTION, DEADLOCK, STARVATION, DATA_CORRUPTION, DEPENDENCY_FAILURE, NETWORK_FAILURE, IO_FAILURE.
 */

export const FailureKind = Object.freeze({
  TIMEOUT: 'TIMEOUT',
  CRASH: 'CRASH',
  EXCEPTION: 'EXCEPTION',
  RESOURCE_EXHAUSTION: 'RESOURCE_EXHAUSTION',
  DEADLOCK: 'DEADLOCK',
  STARVATION: 'STARVATION',
  DATA_CORRUPTION: 'DATA_CORRUPTION',
  DEPENDENCY_FAILURE: 'DEPENDENCY_FAILURE',
  NETWORK_FAILURE: 'NETWORK_FAILURE',
  IO_FAILURE: 'IO_FAILURE'
});

export class FailureModel {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {string} options.kind - FailureKind
   * @param {string} options.targetComponent
   * @param {number} [options.probability=0.05]
   * @param {string} [options.description='']
   */
  constructor({
    id,
    kind = FailureKind.EXCEPTION,
    targetComponent,
    probability = 0.05,
    description = ''
  }) {
    if (!id || !targetComponent) throw new Error('FailureModel requires id and targetComponent');
    this.id = id;
    this.kind = kind;
    this.targetComponent = targetComponent;
    this.probability = Math.max(0.0, Math.min(1.0, Number(probability) || 0.05));
    this.description = description || `${kind} on ${targetComponent}`;
    Object.freeze(this);
  }

  toJSON() {
    return {
      id: this.id,
      kind: this.kind,
      targetComponent: this.targetComponent,
      probability: this.probability,
      description: this.description
    };
  }

  static fromJSON(json) {
    return new FailureModel(json);
  }
}
