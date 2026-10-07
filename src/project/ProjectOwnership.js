/**
 * ProjectOwnership.js
 * Structure containing teams, members, and high-level project-wide governance ownership.
 */

import { ResponsibilityMap } from './ResponsibilityMap.js';

export class ProjectOwnership {
  /**
   * @param {Object} options
   * @param {ResponsibilityMap} [options.responsibilityMap]
   * @param {Object<string, string[]>} [options.teams={}] - Map of teamName -> member list
   * @param {Object} [options.metadata={}]
   */
  constructor({
    responsibilityMap = new ResponsibilityMap(),
    teams = {},
    metadata = {}
  } = {}) {
    this.responsibilityMap = responsibilityMap instanceof ResponsibilityMap 
      ? responsibilityMap 
      : ResponsibilityMap.fromJSON(responsibilityMap);
    this.teams = Object.freeze({ ...teams });
    this.metadata = Object.freeze({ ...metadata });
    Object.freeze(this);
  }

  toJSON() {
    return {
      responsibilityMap: this.responsibilityMap.toJSON(),
      teams: this.teams,
      metadata: this.metadata
    };
  }

  static fromJSON(json) {
    return new ProjectOwnership({
      responsibilityMap: json.responsibilityMap ? ResponsibilityMap.fromJSON(json.responsibilityMap) : new ResponsibilityMap(),
      teams: json.teams,
      metadata: json.metadata
    });
  }
}
