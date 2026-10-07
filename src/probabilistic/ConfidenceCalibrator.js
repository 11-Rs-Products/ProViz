import { ConfidenceScale } from './ConfidenceScale.js';
import { ConfidenceCalibrationResult } from './ConfidenceCalibrationResult.js';
import { EvidenceWeight } from './EvidenceWeight.js';
import { EvidenceKind } from './EvidenceKind.js';
import { EvidencePolarity } from './EvidencePolarity.js';

export class ConfidenceCalibrator {
  /**
   * Calibrate confidence based on a set of evidence items for a subject.
   * Safety invariant: Observation count alone never yields FORMALLY_ESTABLISHED.
   */
  static calibrate(subject, evidenceList = [], conflicts = []) {
    if (!evidenceList || evidenceList.length === 0) {
      return new ConfidenceCalibrationResult({
        subject,
        confidenceLevel: ConfidenceScale.UNKNOWN,
        score: 0.0,
        explanation: 'No evidence available for subject'
      });
    }

    if (conflicts && conflicts.length > 0) {
      // Check if there are unresolvable conflicts
      const hasDirectConflict = conflicts.some(c => c.classification !== 'PROOF_SCOPE_MISMATCH');
      if (hasDirectConflict) {
        return new ConfidenceCalibrationResult({
          subject,
          confidenceLevel: ConfidenceScale.CONFLICTING,
          score: 0.0,
          conflicts,
          explanation: `Conflicting evidence detected across ${conflicts.length} conflict clusters`
        });
      }
    }

    let hasFormalProof = false;
    let totalSupportWeight = 0;
    let totalRefuteWeight = 0;
    const supporting = [];
    const refuting = [];

    for (const ev of evidenceList) {
      const w = EvidenceWeight.computeWeight(ev);
      if (ev.polarity === EvidencePolarity.SUPPORTS) {
        supporting.push(ev);
        totalSupportWeight += w;
        if (ev.kind === EvidenceKind.STATIC_PROOF || ev.kind === EvidenceKind.SYMBOLIC_PROOF) {
          hasFormalProof = true;
        }
      } else if (ev.polarity === EvidencePolarity.REFUTES) {
        refuting.push(ev);
        totalRefuteWeight += w;
      }
    }

    if (hasFormalProof && totalRefuteWeight === 0) {
      return new ConfidenceCalibrationResult({
        subject,
        confidenceLevel: ConfidenceScale.FORMALLY_ESTABLISHED,
        score: 1.0,
        supportingEvidence: supporting,
        refutingEvidence: refuting,
        conflicts,
        hasFormalProof: true,
        explanation: 'Formally proven by symbolic/static proof with no refutations',
        breakdown: { totalSupportWeight, totalRefuteWeight, count: evidenceList.length }
      });
    }

    // Empirical scaling: never reaches 1.0 without formal proof, capped at 0.999
    const netWeight = Math.max(0, totalSupportWeight - totalRefuteWeight * 2.0);
    const score = Math.min(0.999, 1.0 - Math.exp(-0.05 * netWeight));
    const level = ConfidenceScale.fromScore(score);

    const reasons = [];
    if (supporting.length > 0) reasons.push(`${supporting.length} supporting observations`);
    if (refuting.length > 0) reasons.push(`${refuting.length} refuting observations`);
    if (conflicts.length > 0) reasons.push(`${conflicts.length} scope-mismatch conflicts`);

    const explanation = `Calibrated score ${score.toFixed(4)} (${level}) based on: ${reasons.join(', ')}`;

    return new ConfidenceCalibrationResult({
      subject,
      confidenceLevel: level,
      score,
      supportingEvidence: supporting,
      refutingEvidence: refuting,
      conflicts,
      hasFormalProof: false,
      explanation,
      breakdown: { totalSupportWeight, totalRefuteWeight, count: evidenceList.length }
    });
  }
}
