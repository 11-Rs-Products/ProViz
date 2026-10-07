/**
 * TransformationComparator.js
 * Compares candidate transformations using multi-factor objective scoring:
 * Score(T) = Benefit(T) + Confidence(T) + VerificationStrength(T) - Risk(T) - Cost(T)
 */

export class TransformationComparator {
  /**
   * Evaluates a score for candidate ranking.
   */
  scoreCandidate(candidate, options = {}) {
    const benefit = options.benefit !== undefined ? options.benefit : (candidate.predictedImpact?.benefitScore || 0.6);
    const confidence = options.confidence !== undefined ? options.confidence : (candidate.predictedImpact?.confidence || 0.85);
    const verifStrength = options.verificationStrength !== undefined ? options.verificationStrength : (candidate.verificationStatus === 'VERIFIED' ? 0.9 : 0.5);
    const risk = candidate.predictedRisk?.riskScore !== undefined ? candidate.predictedRisk.riskScore : 0.2;
    const cost = options.cost !== undefined ? options.cost : 0.1;

    const score = benefit + confidence + verifStrength - risk - cost;

    return {
      candidateId: candidate.candidateId,
      score,
      components: {
        benefit,
        confidence,
        verifStrength,
        risk,
        cost
      }
    };
  }

  /**
   * Ranks candidate transformations deterministically.
   */
  rankCandidates(candidates, options = {}) {
    const scored = candidates.map(c => ({
      candidate: c,
      ranking: this.scoreCandidate(c, options)
    }));

    // Sort descending by score, deterministic tie-breaking by candidateId
    scored.sort((a, b) => b.ranking.score - a.ranking.score || a.candidate.candidateId.localeCompare(b.candidate.candidateId));
    return scored;
  }
}
