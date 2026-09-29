/**
 * VerificationRule — Declarative, extensible rule definition for property and defect matching.
 */

import { FINDING_SEVERITIES } from './FindingSeverity.js';

export class VerificationRule {
    /**
     * @param {object} params
     * @param {string} params.id
     * @param {string} params.name
     * @param {string} params.description
     * @param {string} params.kind - FINDING_KINDS member
     * @param {string} [params.severity] - FINDING_SEVERITIES member
     * @param {Array<string>} [params.requiredAnalyses]
     * @param {Function} [params.matcher] - (context) => Array<Finding>
     * @param {Function} [params.explanationBuilder]
     */
    constructor({
        id,
        name,
        description = '',
        kind,
        severity = FINDING_SEVERITIES.WARNING,
        requiredAnalyses = [],
        matcher = () => [],
        explanationBuilder = null,
    }) {
        this.id = String(id);
        this.name = String(name || id);
        this.description = String(description);
        this.kind = kind;
        this.severity = severity;
        this.requiredAnalyses = Object.freeze([...requiredAnalyses]);
        this.matcher = matcher;
        this.explanationBuilder = explanationBuilder;
        Object.freeze(this);
    }
}
