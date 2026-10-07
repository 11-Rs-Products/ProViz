import { PortfolioPolicy, PortfolioTechnique } from './PortfolioPolicy.js';

export class VerificationPortfolio {
  constructor({
    policy = new PortfolioPolicy(),
    registeredTechniques = Object.values(PortfolioTechnique)
  } = {}) {
    this.policy = policy instanceof PortfolioPolicy ? policy : new PortfolioPolicy(policy);
    this.registeredTechniques = Object.freeze([...registeredTechniques]);
    Object.freeze(this);
  }

  hasTechnique(technique) {
    return this.registeredTechniques.includes(String(technique));
  }

  isTechniqueEnabled(technique) {
    return this.policy.enabledTechniques.includes(technique);
  }

  getBudgetFor(technique) {
    return this.policy.techniqueTimeBudgets[technique] || 100;
  }

  toJSON() {
    return {
      policy: this.policy.toJSON(),
      registeredTechniques: this.registeredTechniques
    };
  }
}
