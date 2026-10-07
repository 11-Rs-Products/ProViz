export class RiskFactor {
  constructor({
    name, // LOW_CONFIDENCE, HIGH_UNCERTAINTY, RARE_UNEXPECTED_BEHAVIOR, MUTATION_SURVIVOR, REGRESSION_HISTORY, ENVIRONMENT_SENSITIVITY, SPECIFICATION_CONFLICT
    score = 0.5,
    weight = 1.0,
    description = ''
  }) {
    this.name = name;
    this.score = score;
    this.weight = weight;
    this.description = description;
    Object.freeze(this);
  }

  toJSON() {
    return {
      name: this.name,
      score: this.score,
      weight: this.weight,
      description: this.description
    };
  }
}
