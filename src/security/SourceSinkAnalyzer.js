/**
 * SourceSinkAnalyzer.js
 * Analyzes taint and information flow from untrusted sources to sensitive sinks:
 * Source -> DataFlow -> Sink
 * Classifications: SAFE, SANITIZED, UNTRUSTED, VIOLATION, UNKNOWN.
 */

export const FlowClassification = Object.freeze({
  SAFE: 'SAFE',
  SANITIZED: 'SANITIZED',
  UNTRUSTED: 'UNTRUSTED',
  VIOLATION: 'VIOLATION',
  UNKNOWN: 'UNKNOWN'
});

export class SourceSinkAnalyzer {
  /**
   * Evaluates dataflow safety between a source and a sink.
   * @param {Object} source
   * @param {SecuritySink} sink
   * @param {Array<string>} pathNodeIds
   * @param {Array<string>} activeSanitizers
   * @returns {Object}
   */
  analyzeFlow(source, sink, pathNodeIds = [], activeSanitizers = []) {
    if (!source || !sink) {
      return { classification: FlowClassification.UNKNOWN, isViolation: false, reasons: ['Missing source or sink'] };
    }

    const missingSanitizers = (sink.requiredSanitizers || []).filter(s => !activeSanitizers.includes(s));

    if (source.isUntrusted) {
      if (missingSanitizers.length === 0 && (sink.requiredSanitizers?.length || 0) > 0) {
        return {
          classification: FlowClassification.SANITIZED,
          isViolation: false,
          sanitizersApplied: activeSanitizers,
          reasons: ['Untrusted source appropriately neutralized by sanitizers']
        };
      }
      return {
        classification: FlowClassification.VIOLATION,
        isViolation: true,
        missingSanitizers,
        reasons: [`Untrusted data reaches sensitive sink ${sink.id} without required sanitizers: ${missingSanitizers.join(', ')}`]
      };
    }

    return {
      classification: FlowClassification.SAFE,
      isViolation: false,
      reasons: ['Source is trusted']
    };
  }
}
