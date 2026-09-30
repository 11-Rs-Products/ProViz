export class ExplorationAdequacy {
  constructor({
    behavioralDiversity = null,
    generatorCoverage = null,
    metamorphicCoverage = null,
    boundaryCoverage = null,
    overallScore = 0.0,
    metadata = {}
  } = {}) {
    this.behavioralDiversity = behavioralDiversity;
    this.generatorCoverage = generatorCoverage;
    this.metamorphicCoverage = metamorphicCoverage;
    this.boundaryCoverage = boundaryCoverage;
    this.overallScore = overallScore;
    this.metadata = metadata;
  }

  toJSON() {
    return {
      behavioralDiversity: this.behavioralDiversity?.toJSON ? this.behavioralDiversity.toJSON() : this.behavioralDiversity,
      generatorCoverage: this.generatorCoverage?.toJSON ? this.generatorCoverage.toJSON() : this.generatorCoverage,
      metamorphicCoverage: this.metamorphicCoverage?.toJSON ? this.metamorphicCoverage.toJSON() : this.metamorphicCoverage,
      boundaryCoverage: this.boundaryCoverage?.toJSON ? this.boundaryCoverage.toJSON() : this.boundaryCoverage,
      overallScore: this.overallScore,
      metadata: this.metadata
    };
  }
}
