/**
 * EvidenceAggregator — Aggregates multi-source evidence, weights contributions, and identifies conflicts.
 */

import { EVIDENCE_POLARITIES } from './EvidencePolarity.js';
import { EVIDENCE_KINDS } from './EvidenceKind.js';
import { EvidenceStrength } from './EvidenceStrength.js';
import { ConfidenceScale, CONFIDENCE_LEVELS } from './ConfidenceScale.js';
import { EvidenceConflict, CONFLICT_TYPES } from './EvidenceConflict.js';

export class EvidenceAggregator {
    /**
     * Aggregate all evidence for a given subject.
     * @param {Array<import('./Evidence.js').Evidence>|import('./EvidenceSet.js').EvidenceSet} evidenceItems
     * @param {string} subject
     * @param {object} [options={}]
     * @returns {object} Aggregated summary
     */
    static aggregate(evidenceItems, subject, options = {}) {
        const list = Array.isArray(evidenceItems)
            ? evidenceItems.filter(e => e.subject === subject)
            : (evidenceItems.getBySubject ? evidenceItems.getBySubject(subject) : []);

        let supportWeight = 0;
        let refuteWeight = 0;
        let totalCount = list.length;
        let supportCount = 0;
        let refuteCount = 0;
        let neutralCount = 0;
        let hasFormalProof = false;
        let hasFormalCounterexample = false;

        const supportingIds = [];
        const refutingIds = [];

        for (const evi of list) {
            const w = EvidenceStrength.getWeight(evi.strength);
            if (evi.kind === EVIDENCE_KINDS.STATIC_PROOF || evi.kind === EVIDENCE_KINDS.SYMBOLIC_PROOF) {
                hasFormalProof = true;
            }
            if (evi.kind === EVIDENCE_KINDS.SYMBOLIC_COUNTEREXAMPLE) {
                hasFormalCounterexample = true;
            }

            if (evi.polarity === EVIDENCE_POLARITIES.SUPPORTS) {
                supportWeight += w;
                supportCount++;
                supportingIds.push(evi.id);
            } else if (evi.polarity === EVIDENCE_POLARITIES.REFUTES) {
                refuteWeight += w;
                refuteCount++;
                refutingIds.push(evi.id);
            } else {
                neutralCount++;
            }
        }

        const isConflicting = supportCount > 0 && refuteCount > 0;
        let conflict = null;
        if (isConflicting) {
            let conflictType = CONFLICT_TYPES.OBSERVATION_CONFLICT;
            if (hasFormalProof && refuteCount > 0) {
                conflictType = CONFLICT_TYPES.PROOF_SCOPE_MISMATCH;
            }
            conflict = new EvidenceConflict({
                subject,
                conflictType,
                supportingEvidenceIds: supportingIds,
                refutingEvidenceIds: refutingIds,
                description: `Subject has ${supportCount} supporting and ${refuteCount} refuting evidence items.`,
            });
        }

        const totalWeight = supportWeight + refuteWeight;
        const probability = totalWeight > 0 ? supportWeight / totalWeight : 0.5;
        
        let confidenceScore = 0;
        if (hasFormalProof && !isConflicting) {
            confidenceScore = 1.0;
        } else if (isConflicting) {
            confidenceScore = Math.max(0.1, 1.0 - (Math.min(supportWeight, refuteWeight) / Math.max(0.1, totalWeight)));
        } else if (totalCount > 0) {
            confidenceScore = Math.min(0.99, 1.0 - Math.exp(-0.05 * totalWeight));
        }

        const confidenceLevel = ConfidenceScale.fromScore(confidenceScore, hasFormalProof, isConflicting);

        return {
            subject,
            totalCount,
            supportCount,
            refuteCount,
            neutralCount,
            supportWeight,
            refuteWeight,
            probability,
            confidenceScore,
            confidenceLevel,
            isConflicting,
            conflict,
            hasFormalProof,
            hasFormalCounterexample,
            evidenceIds: list.map(e => e.id),
        };
    }
}
