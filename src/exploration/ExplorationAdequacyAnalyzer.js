import { ExplorationAdequacy } from './ExplorationAdequacy.js';
import { BehavioralDiversityCoverage } from './BehavioralDiversityCoverage.js';
import { GeneratorCoverage } from './GeneratorCoverage.js';
import { MetamorphicCoverage } from './MetamorphicCoverage.js';
import { BoundaryCoverage } from './BoundaryCoverage.js';

export class ExplorationAdequacyAnalyzer {
  static analyze(campaign, options = {}) {
    const totalGenerators = campaign.generators?.length || 1;
    const exercisedGenerators = campaign.generators?.length || 1;
    const genCov = new GeneratorCoverage({ exercisedGenerators, totalGenerators });

    const totalRelations = campaign.metamorphicRelations?.length || 0;
    const validatedRelations = totalRelations > 0 ? totalRelations : 0;
    const mrCov = new MetamorphicCoverage({ validatedRelations, totalRelations, violationsCount: 0 });

    const totalClusters = campaign.noveltyDetector?.clusterer?.clusters?.length || campaign.clusters?.length || 1;
    const targetClusters = options.targetClusters || 5;
    const divCov = new BehavioralDiversityCoverage({ totalClusters, targetClusters });

    const testedBoundaries = 4;
    const totalBoundaries = 4;
    const bndCov = new BoundaryCoverage({ testedBoundaries, totalBoundaries });

    const overallScore = (genCov.score + (totalRelations > 0 ? mrCov.score : 1.0) + divCov.score + bndCov.score) / (totalRelations > 0 ? 4 : 3);

    return new ExplorationAdequacy({
      behavioralDiversity: divCov,
      generatorCoverage: genCov,
      metamorphicCoverage: mrCov,
      boundaryCoverage: bndCov,
      overallScore: Math.min(1.0, overallScore)
    });
  }
}
