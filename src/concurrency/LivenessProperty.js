/**
 * LivenessProperty.js
 * Models liveness requirements such as eventual completion, response, release, and recovery.
 */

export const LivenessKind = Object.freeze({
  EVENTUALLY_COMPLETES: 'EVENTUALLY_COMPLETES',
  EVENTUALLY_RESPONDS: 'EVENTUALLY_RESPONDS',
  EVENTUALLY_RELEASES: 'EVENTUALLY_RELEASES',
  EVENTUALLY_RECOVERS: 'EVENTUALLY_RECOVERS',
  NO_PERMANENT_BLOCK: 'NO_PERMANENT_BLOCK'
});

export class LivenessProperty {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {string} [options.name='']
   * @param {string} [options.kind=LivenessKind.EVENTUALLY_COMPLETES]
   * @param {string} [options.targetContextId='*']
   * @param {string} [options.resourceId=null]
   * @param {number|null} [options.timeout=null]
   */
  constructor({
    id,
    name = '',
    kind = LivenessKind.EVENTUALLY_COMPLETES,
    targetContextId = '*',
    resourceId = null,
    timeout = null
  }) {
    if (!id) throw new Error('LivenessProperty requires id');
    this.id = id;
    this.name = name || id;
    this.kind = kind;
    this.targetContextId = targetContextId;
    this.resourceId = resourceId;
    this.timeout = timeout;
    Object.freeze(this);
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      kind: this.kind,
      targetContextId: this.targetContextId,
      resourceId: this.resourceId,
      timeout: this.timeout
    };
  }

  static fromJSON(json) {
    return new LivenessProperty(json);
  }
}
