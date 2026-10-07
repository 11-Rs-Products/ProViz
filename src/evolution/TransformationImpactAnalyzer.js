/**
 * TransformationImpactAnalyzer.js
 * Evaluates semantic change impact and transformation benefit:
 * Impact(T) = αD + βB + γS + δV + εE + ζR
 */

import { ImpactAnalyzer } from '../semantic/ImpactAnalyzer.js';
import { SemanticChange, SemanticChangeType } from '../semantic/SemanticChange.js';

export class TransformationImpactAnalyzer {
  constructor(weights = {}) {
    this.stage29ImpactAnalyzer = new ImpactAnalyzer(weights);
  }

  analyze(candidate, semanticGraph, options = {}) {
    const change = new SemanticChange({
      id: `change:${candidate.candidateId}`,
      type: SemanticChangeType.MODIFIED,
      targetId: candidate.transformation.sourceScope,
      details: { transformationKind: candidate.transformation.kind }
    });

    const impactResult = this.stage29ImpactAnalyzer.analyze(change, semanticGraph, options);

    // Calculate transformation benefit
    const speedup = candidate.transformation.expectedImpact?.estimatedSpeedup || 1.0;
    const complexityReduction = candidate.transformation.expectedImpact?.complexityReduction || 0.0;
    const benefitScore = Math.min(1.0, ((speedup - 1.0) * 0.5) + (complexityReduction * 0.5) + 0.3);

    return {
      candidateId: candidate.candidateId,
      impactScore: impactResult.impactScore,
      benefitScore,
      breakdown: impactResult.breakdown,
      blastRadius: impactResult.blastRadius,
      invalidatedProofIds: impactResult.invalidatedProofIds,
      staleTestIds: impactResult.staleTestIds
    };
  }
}
