/**
 * ConcurrentResource.js
 * Represents memory variables, data structures, channels, and resources accessed across concurrent contexts.
 */

export const ResourceKind = Object.freeze({
  SHARED_MEMORY: 'SHARED_MEMORY',
  CHANNEL: 'CHANNEL',
  LOCK: 'LOCK',
  DATABASE: 'DATABASE',
  FILE: 'FILE'
});

export class ConcurrentResource {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {string} [options.name='']
   * @param {string} [options.type='SHARED_MEMORY']
   * @param {string} [options.semanticTarget='']
   * @param {Object} [options.attributes={}]
   */
  constructor({
    id,
    name = '',
    type = 'SHARED_MEMORY',
    semanticTarget = '',
    attributes = {}
  }) {
    if (!id) throw new Error('ConcurrentResource requires id');
    this.id = id;
    this.name = name || id;
    this.type = type;
    this.semanticTarget = semanticTarget;
    this.attributes = Object.freeze({ ...attributes });
    Object.freeze(this);
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      semanticTarget: this.semanticTarget,
      attributes: { ...this.attributes }
    };
  }

  static fromJSON(json) {
    return new ConcurrentResource(json);
  }
}
