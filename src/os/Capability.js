/**
 * Capability.js
 * Formal registration contract of a capability with metadata, dependencies, and invocation handler.
 */

import { CapabilityHealth } from './CapabilityHealth.js';

export class Capability {
  /**
   * @param {Object} options
   * @param {string} options.id - from CapabilityKind
   * @param {string} options.name
   * @param {string} [options.description='']
   * @param {string[]} [options.dependencies=[]]
   * @param {Function} [options.executor=null]
   * @param {CapabilityHealth} [options.health]
   * @param {Object} [options.metadata={}]
   */
  constructor({
    id,
    name,
    description = '',
    dependencies = [],
    executor = null,
    health = new CapabilityHealth(),
    metadata = {}
  }) {
    if (!id || !name) throw new Error('Capability requires id and name');
    this.id = id;
    this.name = name;
    this.description = description;
    this.dependencies = Object.freeze([...dependencies]);
    this.executor = executor;
    this.health = health instanceof CapabilityHealth ? health : new CapabilityHealth(health);
    this.metadata = Object.freeze({ ...metadata });
    Object.freeze(this);
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      dependencies: [...this.dependencies],
      health: this.health.toJSON(),
      metadata: this.metadata
    };
  }

  static fromJSON(json) {
    return new Capability(json);
  }
}
