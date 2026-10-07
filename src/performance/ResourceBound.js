/**
 * ResourceBound.js
 * Explicit mathematical or empirical resource constraint: Resource(t, n) <= B.
 */

export class ResourceBound {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {string} options.resourceType - CPU, MEMORY, FILE_DESCRIPTORS, THREADS, QUEUE_DEPTH
   * @param {number} options.maxAllowed
   * @param {string} [options.unit='']
   * @param {string} [options.description='']
   */
  constructor({
    id,
    resourceType,
    maxAllowed,
    unit = '',
    description = ''
  }) {
    if (!id || !resourceType || maxAllowed === undefined) {
      throw new Error('ResourceBound requires id, resourceType, and maxAllowed');
    }
    this.id = id;
    this.resourceType = resourceType;
    this.maxAllowed = Number(maxAllowed);
    this.unit = unit;
    this.description = description || `${resourceType} <= ${maxAllowed} ${unit}`;
    Object.freeze(this);
  }

  isSatisfied(observedValue) {
    return observedValue <= this.maxAllowed;
  }

  toJSON() {
    return {
      id: this.id,
      resourceType: this.resourceType,
      maxAllowed: this.maxAllowed,
      unit: this.unit,
      description: this.description
    };
  }

  static fromJSON(json) {
    return new ResourceBound(json);
  }
}
