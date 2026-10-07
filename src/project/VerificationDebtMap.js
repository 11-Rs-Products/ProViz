/**
 * VerificationDebtMap.js
 * Maps verification gaps, unverified obligations, and stale verification certificates across entities.
 */

export class VerificationDebtMap {
  /**
   * @param {Object} options
   * @param {Map<string, Object[]>|Object<string, Object[]>} [options.entityDebtMap={}]
   * @param {number} [options.debtScore=0]
   */
  constructor({
    entityDebtMap = {},
    debtScore = 0
  } = {}) {
    this.entityDebtMap = entityDebtMap instanceof Map 
      ? Object.fromEntries(entityDebtMap) 
      : { ...entityDebtMap };
    this.debtScore = debtScore;
    Object.freeze(this);
  }

  getDebtForEntity(entityId) {
    return this.entityDebtMap[entityId] || [];
  }

  toJSON() {
    return {
      entityDebtMap: this.entityDebtMap,
      debtScore: this.debtScore
    };
  }

  static fromJSON(json) {
    return new VerificationDebtMap(json);
  }
}
