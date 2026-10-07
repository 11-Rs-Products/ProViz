/**
 * ArchitectureRule.js
 * High-level declarative architecture rule composed of conditions and constraints.
 */

import { ArchitectureConstraint } from './ArchitectureConstraint.js';

export class ArchitectureRule {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {string} options.name
   * @param {string} [options.description='']
   * @param {ArchitectureConstraint[]} [options.constraints=[]]
   * @param {boolean} [options.enabled=true]
   * @param {Object} [options.metadata={}]
   */
  constructor({
    id,
    name,
    description = '',
    constraints = [],
    enabled = true,
    metadata = {}
  }) {
    if (!id || !name) throw new Error('ArchitectureRule requires id and name');
    this.id = id;
    this.name = name;
    this.description = description;
    this.constraints = Object.freeze(
      constraints.map(c => c instanceof ArchitectureConstraint ? c : new ArchitectureConstraint(c))
    );
    this.enabled = Boolean(enabled);
    this.metadata = Object.freeze({ ...metadata });
    Object.freeze(this);
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      constraints: this.constraints.map(c => c.toJSON()),
      enabled: this.enabled,
      metadata: { ...this.metadata }
    };
  }

  static fromJSON(json) {
    return new ArchitectureRule({
      id: json.id,
      name: json.name,
      description: json.description,
      constraints: (json.constraints || []).map(c => ArchitectureConstraint.fromJSON(c)),
      enabled: json.enabled,
      metadata: json.metadata
    });
  }
}
