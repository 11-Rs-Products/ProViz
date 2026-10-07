/**
 * SemanticOwnership.js
 * Maps components/modules to their semantic responsibilities (state, contracts, APIs, proofs, tests).
 */

export class SemanticOwnership {
  constructor() {
    this._ownershipMap = new Map(); // componentId -> { responsibilities: Set, managedEntities: Set }
  }

  assignOwnership(componentId, entityId, responsibilityType = 'BEHAVIOR') {
    if (!this._ownershipMap.has(componentId)) {
      this._ownershipMap.set(componentId, {
        componentId,
        responsibilities: new Set(),
        managedEntities: new Map() // entityId -> responsibilityType
      });
    }

    const record = this._ownershipMap.get(componentId);
    record.responsibilities.add(responsibilityType);
    record.managedEntities.set(entityId, responsibilityType);
    return this;
  }

  getOwnerOf(entityId) {
    for (const record of this._ownershipMap.values()) {
      if (record.managedEntities.has(entityId)) {
        return {
          componentId: record.componentId,
          responsibility: record.managedEntities.get(entityId)
        };
      }
    }
    return null;
  }

  getComponentOwnership(componentId) {
    const record = this._ownershipMap.get(componentId);
    if (!record) return null;
    return {
      componentId: record.componentId,
      responsibilities: Array.from(record.responsibilities),
      managedEntities: Array.from(record.managedEntities.entries()).map(([eId, resp]) => ({ entityId: eId, responsibility: resp }))
    };
  }
}
