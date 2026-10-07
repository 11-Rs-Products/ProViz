/**
 * ResponsibilityMap.js
 * Comprehensive map of all component responsibilities indexed by entity and team.
 */

import { ComponentResponsibility } from './ComponentResponsibility.js';

export class ResponsibilityMap {
  constructor() {
    /** @type {Map<string, ComponentResponsibility>} */
    this._byEntity = new Map();
    /** @type {Map<string, Set<string>>} */
    this._byTeam = new Map();
  }

  setResponsibility(respData) {
    const resp = respData instanceof ComponentResponsibility ? respData : new ComponentResponsibility(respData);
    this._byEntity.set(resp.entityId, resp);

    if (!this._byTeam.has(resp.primaryOwnerTeam)) {
      this._byTeam.set(resp.primaryOwnerTeam, new Set());
    }
    this._byTeam.get(resp.primaryOwnerTeam).add(resp.entityId);
    return resp;
  }

  getResponsibility(entityId) {
    return this._byEntity.get(entityId) || null;
  }

  getEntitiesForTeam(teamName) {
    const set = this._byTeam.get(teamName);
    return set ? Array.from(set) : [];
  }

  getAllResponsibilities() {
    return Array.from(this._byEntity.values());
  }

  toJSON() {
    return {
      responsibilities: Array.from(this._byEntity.values()).map(r => r.toJSON())
    };
  }

  static fromJSON(json) {
    const map = new ResponsibilityMap();
    if (json.responsibilities) {
      for (const r of json.responsibilities) map.setResponsibility(ComponentResponsibility.fromJSON(r));
    }
    return map;
  }
}
