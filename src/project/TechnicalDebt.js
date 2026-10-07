/**
 * TechnicalDebt.js
 * Represents an item of technical or verification debt retaining source, scope, risk, age, evidence, and remediation cost.
 */

export const DebtCategory = Object.freeze({
  ARCHITECTURE: 'ARCHITECTURE',
  VERIFICATION: 'VERIFICATION',
  TEST: 'TEST',
  SECURITY: 'SECURITY',
  PERFORMANCE: 'PERFORMANCE',
  RELIABILITY: 'RELIABILITY',
  CONCURRENCY: 'CONCURRENCY',
  DOCUMENTATION: 'DOCUMENTATION',
  SPECIFICATION: 'SPECIFICATION',
  DEPENDENCY: 'DEPENDENCY',
  MAINTAINABILITY: 'MAINTAINABILITY'
});

export class TechnicalDebtItem {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {string} options.title
   * @param {string} [options.category=DebtCategory.MAINTAINABILITY]
   * @param {string} options.targetEntityId
   * @param {number} [options.risk=0.5] - [0, 1]
   * @param {number} [options.scope=1.0] - Scope size factor
   * @param {number} [options.age=1.0] - Age factor / days
   * @param {number} [options.uncertainty=0.2] - Uncertainty factor
   * @param {number} [options.remediationCost=1.0] - Estimated effort
   * @param {Object} [options.evidence={}]
   */
  constructor({
    id,
    title,
    category = DebtCategory.MAINTAINABILITY,
    targetEntityId,
    risk = 0.5,
    scope = 1.0,
    age = 1.0,
    uncertainty = 0.2,
    remediationCost = 1.0,
    evidence = {}
  }) {
    if (!id || !title || !targetEntityId) throw new Error('TechnicalDebtItem requires id, title, and targetEntityId');
    this.id = id;
    this.title = title;
    this.category = category;
    this.targetEntityId = targetEntityId;
    this.risk = risk;
    this.scope = scope;
    this.age = age;
    this.uncertainty = uncertainty;
    this.remediationCost = remediationCost;
    this.evidence = Object.freeze({ ...evidence });
    this.debtScore = Number((risk * scope * Math.log2(age + 1) * (1 + uncertainty)).toFixed(4));
    Object.freeze(this);
  }

  toJSON() {
    return {
      id: this.id,
      title: this.title,
      category: this.category,
      targetEntityId: this.targetEntityId,
      risk: this.risk,
      scope: this.scope,
      age: this.age,
      uncertainty: this.uncertainty,
      remediationCost: this.remediationCost,
      debtScore: this.debtScore,
      evidence: { ...this.evidence }
    };
  }

  static fromJSON(json) {
    return new TechnicalDebtItem(json);
  }
}

export class TechnicalDebt {
  /**
   * @param {Object} options
   * @param {TechnicalDebtItem[]} [options.items=[]]
   * @param {number} [options.timestamp]
   */
  constructor({
    items = [],
    timestamp = Date.now()
  } = {}) {
    this.items = Object.freeze(items.map(i => i instanceof TechnicalDebtItem ? i : new TechnicalDebtItem(i)));
    this.totalDebtScore = Number(this.items.reduce((acc, item) => acc + item.debtScore, 0).toFixed(4));
    this.timestamp = timestamp;
    Object.freeze(this);
  }

  getItemsByCategory(category) {
    return this.items.filter(i => i.category === category);
  }

  toJSON() {
    return {
      totalDebtScore: this.totalDebtScore,
      itemCount: this.items.length,
      items: this.items.map(i => i.toJSON()),
      timestamp: this.timestamp
    };
  }

  static fromJSON(json) {
    return new TechnicalDebt({
      items: (json.items || []).map(i => TechnicalDebtItem.fromJSON(i)),
      timestamp: json.timestamp
    });
  }
}
