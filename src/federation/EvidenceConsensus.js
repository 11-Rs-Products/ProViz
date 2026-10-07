import { ConsensusPolicy } from './ConsensusPolicy.js';
import { EvidenceAuthority } from './EvidenceAuthority.js';
import { AgentTrustLevel } from './AgentTrustLevel.js';

/**
 * Combines evidence from multiple verification agents under deterministic consensus policies
 */
export class EvidenceConsensus {
  static evaluate(votes = [], policy = ConsensusPolicy.FORMAL_DOMINANCE) {
    if (!votes || votes.length === 0) {
      return {
        outcome: 'INSUFFICIENT',
        isSatisfied: false,
        dominantResult: null,
        confidence: 0.0,
        policy,
        votes: []
      };
    }

    // Check for formal evidence
    const formalVotes = votes.filter(v =>
      EvidenceAuthority.isFormalEvidence(v.evidenceKind) &&
      (v.trustLevel === AgentTrustLevel.FORMAL || v.trustLevel === AgentTrustLevel.VERIFIED)
    );

    // FORMAL_DOMINANCE: A verified formal proof overrides empirical votes
    if (policy === ConsensusPolicy.FORMAL_DOMINANCE && formalVotes.length > 0) {
      const formalStatuses = new Set(formalVotes.map(v => v.resultStatus));
      if (formalStatuses.size === 1) {
        const dominantStatus = Array.from(formalStatuses)[0];
        return {
          outcome: 'FORMAL_DOMINANCE',
          isSatisfied: dominantStatus === 'PROVED',
          dominantResult: dominantStatus,
          confidence: 1.0,
          policy,
          votes,
          formalDominanceApplied: true
        };
      }
    }

    // STRICT_AGREEMENT: All agents must agree on resultStatus
    const allStatuses = new Set(votes.map(v => v.resultStatus));
    if (policy === ConsensusPolicy.STRICT_AGREEMENT) {
      if (allStatuses.size === 1) {
        const single = Array.from(allStatuses)[0];
        return {
          outcome: 'UNANIMOUS',
          isSatisfied: single === 'PROVED' || single === 'PASS',
          dominantResult: single,
          confidence: 1.0,
          policy,
          votes
        };
      } else {
        return {
          outcome: 'CONFLICTING',
          isSatisfied: false,
          dominantResult: null,
          confidence: 0.0,
          policy,
          votes
        };
      }
    }

    // Check for unanimous agreement across all votes
    if (allStatuses.size === 1) {
      const single = Array.from(allStatuses)[0];
      return {
        outcome: 'UNANIMOUS',
        isSatisfied: single === 'PROVED' || single === 'PASS',
        dominantResult: single,
        confidence: votes.reduce((acc, v) => acc + v.confidence, 0) / votes.length,
        policy,
        votes
      };
    }

    // WEIGHTED_EVIDENCE / MAJORITY / CONSERVATIVE
    const weightsByStatus = new Map();
    for (const v of votes) {
      const w = (v.rank + 1) * v.confidence;
      weightsByStatus.set(v.resultStatus, (weightsByStatus.get(v.resultStatus) || 0) + w);
    }

    let topStatus = null;
    let maxWeight = -1;
    let totalWeight = 0;

    for (const [status, weight] of weightsByStatus.entries()) {
      totalWeight += weight;
      if (weight > maxWeight) {
        maxWeight = weight;
        topStatus = status;
      }
    }

    const confidence = totalWeight > 0 ? maxWeight / totalWeight : 0.0;

    // Check if conflicting significantly
    if (policy === ConsensusPolicy.CONSERVATIVE && confidence < 0.8) {
      return {
        outcome: 'CONFLICTING',
        isSatisfied: false,
        dominantResult: topStatus,
        confidence,
        policy,
        votes
      };
    }

    return {
      outcome: 'MAJORITY',
      isSatisfied: topStatus === 'PROVED' || topStatus === 'PASS',
      dominantResult: topStatus,
      confidence,
      policy,
      votes
    };
  }
}
