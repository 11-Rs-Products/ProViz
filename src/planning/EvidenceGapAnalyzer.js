import { EvidenceGap } from './EvidenceGap.js';
import { EvidenceGapKind } from './EvidenceGapKind.js';

export class EvidenceGapAnalyzer {
  /**
   * Analyze verification state and extract deterministic evidence gaps.
   * Consumes:
   *  - findings (Stage 15)
   *  - symbolic results (Stage 16)
   *  - test results (Stage 17)
   *  - concolic results (Stage 18)
   *  - repairs (Stage 19)
   *  - mutants (Stage 20)
   *  - probabilistic state & anomalies (Stage 24)
   */
  static analyzeGaps(context = {}) {
    const gaps = [];

    // 1. Stage 15 Findings without formal proof or counterexample
    if (Array.isArray(context.findings)) {
      for (const finding of context.findings) {
        const subject = finding.subject || finding.location || finding.id;
        const hasProof = context.proofs?.some(p => p.subject === subject);
        const hasCounterexample = context.counterexamples?.some(c => c.subject === subject);

        if (!hasProof && !hasCounterexample) {
          gaps.push(
            new EvidenceGap({
              kind: EvidenceGapKind.MISSING_PROOF,
              subject,
              missingEvidence: `Finding ${finding.type || finding.id} requires formal proof or counterexample validation`,
              currentConfidence: finding.confidence || 0.4,
              desiredConfidence: 0.95,
              uncertainty: 0.6,
              severity: finding.severity || 'HIGH',
              possibleExperiments: ['STATIC_VERIFY', 'SYMBOLIC_PROVE', 'SYMBOLIC_DISPROVE', 'GENERATE_TEST'],
              estimatedCost: 10,
              rationale: `Stage 15 finding ${finding.type} is unproven.`
            })
          );
        }
      }
    }

    // 2. Stage 20 Surviving Mutants
    if (Array.isArray(context.survivingMutants)) {
      for (const mutant of context.survivingMutants) {
        const subject = mutant.subject || mutant.location || mutant.id;
        gaps.push(
          new EvidenceGap({
            kind: EvidenceGapKind.SURVIVING_MUTANT,
            subject,
            missingEvidence: `Mutant ${mutant.id} survived existing test suite`,
            currentConfidence: 0.5,
            desiredConfidence: 0.90,
            uncertainty: 0.5,
            severity: 'MEDIUM',
            possibleExperiments: ['KILL_MUTANT', 'GENERATE_TEST', 'CONCOLIC_EXPLORE'],
            estimatedCost: 15,
            rationale: `Surviving mutant ${mutant.id} indicates test adequacy gap.`
          })
        );
      }
    }

    // 3. Stage 19 Unvalidated Repairs
    if (Array.isArray(context.unvalidatedRepairs)) {
      for (const repair of context.unvalidatedRepairs) {
        const subject = repair.subject || repair.id;
        gaps.push(
          new EvidenceGap({
            kind: EvidenceGapKind.UNVALIDATED_REPAIR,
            subject,
            missingEvidence: `Applied patch ${repair.id} requires static, symbolic, and regression validation`,
            currentConfidence: 0.2,
            desiredConfidence: 0.99,
            uncertainty: 0.8,
            severity: 'CRITICAL',
            possibleExperiments: ['VALIDATE_REPAIR', 'STATIC_VERIFY', 'REGRESSION_RUN'],
            estimatedCost: 25,
            rationale: `Repair ${repair.id} must be systematically validated.`
          })
        );
      }
    }

    // 4. Stage 24 Conflicting Evidence
    if (Array.isArray(context.conflicts)) {
      for (const conflict of context.conflicts) {
        gaps.push(
          new EvidenceGap({
            kind: EvidenceGapKind.CONFLICTING_EVIDENCE,
            subject: conflict.subject,
            missingEvidence: `Conflicting observations detected for ${conflict.subject}`,
            currentConfidence: 0.0,
            desiredConfidence: 0.85,
            uncertainty: 0.9,
            severity: 'HIGH',
            possibleExperiments: ['REPEAT_OBSERVATION', 'BOUNDARY_EXPLORATION', 'ORACLE_VALIDATION'],
            estimatedCost: 8,
            rationale: `Contradictory evidence requires repeated observation or boundary investigation.`
          })
        );
      }
    }

    // 5. Stage 24 Anomalies & Rare Behaviors
    if (Array.isArray(context.anomalies)) {
      for (const anomaly of context.anomalies) {
        gaps.push(
          new EvidenceGap({
            kind: EvidenceGapKind.MISSING_OBSERVATION,
            subject: anomaly.subject,
            missingEvidence: `Rare behavior / anomaly ${anomaly.id} requires reproduction`,
            currentConfidence: 0.4,
            desiredConfidence: 0.80,
            uncertainty: 0.6,
            severity: 'MEDIUM',
            possibleExperiments: ['ANOMALY_REPRODUCTION', 'BOUNDARY_EXPLORATION', 'CONCOLIC_EXPLORE'],
            estimatedCost: 12,
            rationale: `Rare anomaly candidate must be investigated.`
          })
        );
      }
    }

    // 6. Stage 24 Unstable Specifications / Oracles
    if (Array.isArray(context.unstableOracles)) {
      for (const oracle of context.unstableOracles) {
        gaps.push(
          new EvidenceGap({
            kind: EvidenceGapKind.MISSING_ORACLE,
            subject: oracle.oracleId || oracle.id,
            missingEvidence: `Oracle ${oracle.oracleId || oracle.id} is unstable or insufficiently observed`,
            currentConfidence: 0.3,
            desiredConfidence: 0.90,
            uncertainty: 0.7,
            severity: 'HIGH',
            possibleExperiments: ['ORACLE_VALIDATION', 'REPEAT_OBSERVATION'],
            estimatedCost: 5,
            rationale: `Unstable test or metamorphic oracle impairs verification trustworthiness.`
          })
        );
      }
    }

    // 7. Uncovered Branches
    if (Array.isArray(context.uncoveredBranches)) {
      for (const branch of context.uncoveredBranches) {
        gaps.push(
          new EvidenceGap({
            kind: EvidenceGapKind.MISSING_COVERAGE,
            subject: branch.subject || branch.id,
            missingEvidence: `Branch ${branch.id} is uncovered`,
            currentConfidence: 0.0,
            desiredConfidence: 0.80,
            uncertainty: 0.8,
            severity: 'MEDIUM',
            possibleExperiments: ['GENERATE_TEST', 'CONCOLIC_EXPLORE', 'BOUNDARY_EXPLORATION'],
            estimatedCost: 10,
            rationale: `Uncovered branch in control flow graph.`
          })
        );
      }
    }

    // 8. Unexplored Paths
    if (Array.isArray(context.unexploredPaths)) {
      for (const p of context.unexploredPaths) {
        gaps.push(
          new EvidenceGap({
            kind: EvidenceGapKind.UNEXPLORED_PATH,
            subject: p.subject || p.id,
            missingEvidence: `Path ${p.id} remains unexplored`,
            currentConfidence: 0.0,
            desiredConfidence: 0.85,
            uncertainty: 0.85,
            severity: 'MEDIUM',
            possibleExperiments: ['CONCOLIC_EXPLORE', 'SYMBOLIC_PROVE'],
            estimatedCost: 15,
            rationale: `Unexplored path in program execution space.`
          })
        );
      }
    }

    return gaps;
  }
}
