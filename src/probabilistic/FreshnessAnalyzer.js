import { FreshnessStatus, EvidenceFreshness } from './EvidenceFreshness.js';
import { EvidenceDecayPolicy } from './EvidenceDecayPolicy.js';

export class FreshnessAnalyzer {
  /**
   * Evaluates freshness of an evidence item.
   * Safety invariant: Time passing alone does NOT automatically invalidate evidence unless configured.
   */
  static evaluate(evidence, policy = new EvidenceDecayPolicy(), context = {}) {
    const now = context.now || Date.now();
    const ageMs = Math.max(0, now - (evidence.timestamp || now));

    if (context.hasCodeChange && policy.invalidateOnCodeChange) {
      // Check if code change affects subject scope
      const affectsScope = context.affectedScopes
        ? context.affectedScopes.includes(evidence.subject)
        : true;

      if (affectsScope) {
        return new EvidenceFreshness({
          evidenceId: evidence.id,
          status: FreshnessStatus.INVALIDATED,
          ageMs,
          freshnessScore: 0.0,
          invalidationReason: 'Invalidated due to intersecting source code change'
        });
      }
    }

    if (ageMs > policy.staleThresholdMs) {
      return new EvidenceFreshness({
        evidenceId: evidence.id,
        status: FreshnessStatus.STALE,
        ageMs,
        freshnessScore: 0.2,
        invalidationReason: 'Exceeded stale threshold time'
      });
    }

    if (ageMs > policy.agingHalfLifeMs) {
      const score = Math.max(0.2, Math.exp(-ageMs / policy.agingHalfLifeMs));
      return new EvidenceFreshness({
        evidenceId: evidence.id,
        status: FreshnessStatus.AGING,
        ageMs,
        freshnessScore: score
      });
    }

    return new EvidenceFreshness({
      evidenceId: evidence.id,
      status: FreshnessStatus.FRESH,
      ageMs,
      freshnessScore: 1.0
    });
  }
}
