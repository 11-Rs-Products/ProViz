import { ConflictCluster } from './ConflictCluster.js';
import { ConflictExplanation } from './ConflictExplanation.js';
import { EvidenceConflict, ConflictClassification } from './EvidenceConflict.js';
import { EvidenceKind } from './EvidenceKind.js';
import { EvidencePolarity } from './EvidencePolarity.js';

export class EvidenceConflictResolver {
  /**
   * Resolves conflicts by clustering and classifying without silently discarding contradictory evidence.
   */
  static resolve(subject, evidenceList = []) {
    const supports = evidenceList.filter(e => e.polarity === EvidencePolarity.SUPPORTS);
    const refutes = evidenceList.filter(e => e.polarity === EvidencePolarity.REFUTES);

    if (supports.length === 0 || refutes.length === 0) {
      return { hasConflicts: false, conflicts: [], clusters: [], explanations: [] };
    }

    const conflicts = [];
    const explanations = [];
    const clusters = [];

    // Check for symbolic/static proof vs runtime counterexample
    for (const s of supports) {
      for (const r of refutes) {
        let classification = ConflictClassification.OBSERVATION_CONFLICT;

        if (s.kind === EvidenceKind.SYMBOLIC_PROOF || s.kind === EvidenceKind.STATIC_PROOF) {
          // Check scope: if observation input is outside proof scope -> PROOF_SCOPE_MISMATCH
          const proofScope = s.metadata?.scope || s.provenance?.scope || null;
          const obsInput = r.observation?.input || r.metadata?.input || null;

          if (proofScope && obsInput && !proofScope(obsInput)) {
            classification = ConflictClassification.PROOF_SCOPE_MISMATCH;
          } else {
            classification = ConflictClassification.PROOF_SCOPE_MISMATCH; // Default conservative for proof vs run
          }
        } else if (s.environment && r.environment && !s.environment.isConsistentWith(r.environment)) {
          classification = ConflictClassification.ENVIRONMENT_MISMATCH;
        }

        const conflict = new EvidenceConflict({
          subject,
          evidenceA: s,
          evidenceB: r,
          classification,
          resolved: false
        });
        conflicts.push(conflict);

        const explanation = new ConflictExplanation({
          conflictId: conflict.id,
          classification,
          supportingSummary: `${s.kind} (${s.strength})`,
          contradictingSummary: `${r.kind} (${r.strength})`,
          resolutionStrategy: classification === ConflictClassification.PROOF_SCOPE_MISMATCH
            ? 'PRESERVE_PROOF_RESTRICT_SCOPE'
            : 'PRESERVE_BOTH_AND_REDUCE_CONFIDENCE',
          explanation: classification === ConflictClassification.PROOF_SCOPE_MISMATCH
            ? 'Counterexample observation occurred outside the formal proof scope (PROOF_SCOPE_MISMATCH). Both evidence items preserved.'
            : 'Contradictory evidence detected. Preserving both evidence items and reducing subject confidence.'
        });
        explanations.push(explanation);
      }
    }

    const cluster = new ConflictCluster({
      subject,
      classification: conflicts[0]?.classification || 'OBSERVATION_CONFLICT',
      evidenceItems: [...supports, ...refutes],
      explanation: `${conflicts.length} pairwise evidence conflicts identified`
    });
    clusters.push(cluster);

    return {
      hasConflicts: true,
      conflicts,
      clusters,
      explanations
    };
  }
}
