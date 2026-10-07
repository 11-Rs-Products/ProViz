export const PortfolioTechnique = Object.freeze({
  STATIC: 'STATIC',
  SYMBOLIC: 'SYMBOLIC',
  DYNAMIC: 'DYNAMIC',
  CONCOLIC: 'CONCOLIC',
  MUTATION: 'MUTATION',
  REPAIR: 'REPAIR',
  PROBABILISTIC: 'PROBABILISTIC',
  REGRESSION: 'REGRESSION'
});

export class PortfolioPolicy {
  constructor({
    enabledTechniques = Object.values(PortfolioTechnique),
    techniqueTimeBudgets = {
      STATIC: 50,
      SYMBOLIC: 200,
      CONCOLIC: 500,
      DYNAMIC: 300,
      MUTATION: 1000,
      REPAIR: 500,
      PROBABILISTIC: 200,
      REGRESSION: 300
    },
    maxTotalTimeMs = 5000,
    cooperationMode = 'SEQUENTIAL_COOPERATION' // SEQUENTIAL_COOPERATION, COMPETITIVE_OPTIMAL, LEAST_COST_FIRST
  } = {}) {
    this.enabledTechniques = Object.freeze([...enabledTechniques]);
    this.techniqueTimeBudgets = Object.freeze({ ...techniqueTimeBudgets });
    this.maxTotalTimeMs = Number(maxTotalTimeMs);
    this.cooperationMode = cooperationMode;
    Object.freeze(this);
  }

  isTechniqueEnabled(name) {
    return this.enabledTechniques.includes(String(name));
  }

  toJSON() {
    return {
      enabledTechniques: this.enabledTechniques,
      techniqueTimeBudgets: this.techniqueTimeBudgets,
      cooperationMode: this.cooperationMode
    };
  }
}
