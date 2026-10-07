import { SpecificationEvidenceModel } from './SpecificationEvidenceModel.js';
import { SpecificationProbability } from './SpecificationProbability.js';
import { BetaPosterior } from './BetaPosterior.js';
import { ConfidenceScale } from './ConfidenceScale.js';
import { Uncertainty, UncertaintyKind } from './Uncertainty.js';
import { EvidenceKind } from './EvidenceKind.js';
import { EvidencePolarity } from './EvidencePolarity.js';

export class ProbabilisticSpecificationValidator {
  /**
   * Evaluates specification evidence and computes statistical confidence.
   * Safety invariant: 10,000 passes without a formal proof yields VERY_HIGH, NOT FORMALLY_ESTABLISHED.
   */
  static validate(specificationId, evidenceList = [], coverage = 0.0) {
    if (!evidenceList || evidenceList.length === 0) {
      return {
        evidenceModel: new SpecificationEvidenceModel({
          specificationId,
          confidence: ConfidenceScale.UNKNOWN,
          uncertainty: new Uncertainty({ kind: UncertaintyKind.UNKNOWN, score: 1.0 })
        }),
        probability: new SpecificationProbability({ specificationId })
      };
    }

    let supportCount = 0;
    let violationCount = 0;
    let unknownCount = 0;
    let conflictCount = 0;
    let hasFormalProof = false;

    for (const ev of evidenceList) {
      if (ev.polarity === EvidencePolarity.SUPPORTS) {
        supportCount++;
        if (ev.kind === EvidenceKind.STATIC_PROOF || ev.kind === EvidenceKind.SYMBOLIC_PROOF) {
          hasFormalProof = true;
        }
      } else if (ev.polarity === EvidencePolarity.REFUTES) {
        violationCount++;
      } else if (ev.polarity === EvidencePolarity.CONFLICTS) {
        conflictCount++;
      } else {
        unknownCount++;
      }
    }

    // Bayesian updating: Beta(1 + support, 1 + violations)
    const posterior = new BetaPosterior(1.0 + supportCount, 1.0 + violationCount);
    const meanProb = posterior.mean();
    const interval = posterior.credibleInterval(0.95);

    let confidence = ConfidenceScale.LOW;
    if (hasFormalProof && violationCount === 0) {
      confidence = ConfidenceScale.FORMALLY_ESTABLISHED;
    } else if (violationCount > 0 && supportCount > 0) {
      confidence = ConfidenceScale.CONFLICTING;
    } else if (violationCount > 0) {
      confidence = ConfidenceScale.HIGH; // Confirmed violated
    } else if (supportCount >= 1000) {
      confidence = ConfidenceScale.VERY_HIGH; // High statistical support, never formal without proof
    } else if (supportCount >= 100) {
      confidence = ConfidenceScale.HIGH;
    } else if (supportCount >= 10) {
      confidence = ConfidenceScale.MEDIUM;
    } else {
      confidence = ConfidenceScale.LOW;
    }

    const uScore = Math.max(0.001, 1.0 / Math.sqrt(1 + supportCount + violationCount));
    const uncertainty = new Uncertainty({
      kind: hasFormalProof ? UncertaintyKind.OBSERVATIONAL : UncertaintyKind.STATISTICAL,
      score: hasFormalProof ? 0.0 : uScore,
      description: `Uncertainty estimated from ${supportCount} supports and ${violationCount} violations`
    });

    const stability = (supportCount + violationCount) > 0 ? supportCount / (supportCount + violationCount) : 1.0;

    const evidenceModel = new SpecificationEvidenceModel({
      specificationId,
      supportCount,
      violationCount,
      unknownCount,
      conflictCount,
      coverage,
      stability,
      confidence,
      uncertainty,
      hasFormalProof
    });

    const probability = new SpecificationProbability({
      specificationId,
      posterior,
      satisfactionProbability: meanProb,
      credibleInterval: interval
    });

    return { evidenceModel, probability };
  }
}
