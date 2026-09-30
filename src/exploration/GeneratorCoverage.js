export class GeneratorCoverage {
  constructor({ exercisedGenerators = 0, totalGenerators = 0 } = {}) {
    this.exercisedGenerators = exercisedGenerators;
    this.totalGenerators = totalGenerators;
  }

  get score() {
    if (this.totalGenerators <= 0) return 1.0;
    return Math.min(1.0, this.exercisedGenerators / this.totalGenerators);
  }

  toJSON() {
    return {
      exercisedGenerators: this.exercisedGenerators,
      totalGenerators: this.totalGenerators,
      score: this.score
    };
  }
}
