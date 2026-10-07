/**
 * EventFilter.js
 * Predicate matcher for filtering VerificationEvents by kind, source, scope, or causation.
 */

export class EventFilter {
  /**
   * @param {Object} [criteria]
   * @param {string|string[]} [criteria.kinds]
   * @param {string|string[]} [criteria.sources]
   * @param {string|string[]} [criteria.scopes]
   * @param {string} [criteria.correlationId]
   */
  constructor(criteria = {}) {
    this.kinds = criteria.kinds ? (Array.isArray(criteria.kinds) ? new Set(criteria.kinds) : new Set([criteria.kinds])) : null;
    this.sources = criteria.sources ? (Array.isArray(criteria.sources) ? new Set(criteria.sources) : new Set([criteria.sources])) : null;
    this.scopes = criteria.scopes ? (Array.isArray(criteria.scopes) ? new Set(criteria.scopes) : new Set([criteria.scopes])) : null;
    this.correlationId = criteria.correlationId || null;
  }

  matches(event) {
    if (this.kinds && !this.kinds.has(event.kind)) return false;
    if (this.sources && !this.sources.has(event.source)) return false;
    if (this.correlationId && event.correlationId !== this.correlationId) return false;
    if (this.scopes && event.scope) {
      const hasOverlap = event.scope.some(s => this.scopes.has(s));
      if (!hasOverlap) return false;
    }
    return true;
  }
}
