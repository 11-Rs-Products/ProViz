/**
 * SemanticChange — Canonical representation of a single semantic modification in the program model.
 */

import { CHANGE_KINDS } from './ChangeKind.js';
import { CHANGE_SEVERITIES } from './ChangeSeverity.js';
import { CHANGE_CONFIDENCES } from './ChangeConfidence.js';
import { ChangeRegion } from './ChangeRegion.js';

export class SemanticChange {
    /**
     * @param {object} params
     * @param {string} [params.id=null]
     * @param {string} params.kind - From CHANGE_KINDS
     * @param {string} [params.severity=CHANGE_SEVERITIES.MINOR]
     * @param {string} [params.confidence=CHANGE_CONFIDENCES.PROVEN]
     * @param {string} [params.fileId='']
     * @param {string} [params.moduleId='']
     * @param {ChangeRegion|object|null} [params.sourceLocationBefore=null]
     * @param {ChangeRegion|object|null} [params.sourceLocationAfter=null]
     * @param {Array<string>} [params.symbolIds=[]]
     * @param {Array<string>} [params.functionIds=[]]
     * @param {*} [params.before=null]
     * @param {*} [params.after=null]
     * @param {Array<object|string>} [params.evidence=[]]
     * @param {Array<string>} [params.causes=[]]
     * @param {Array<string>} [params.consequences=[]]
     * @param {object} [params.metadata={}]
     */
    constructor({
        id = null,
        kind = CHANGE_KINDS.STATEMENT_MODIFIED,
        severity = CHANGE_SEVERITIES.MINOR,
        confidence = CHANGE_CONFIDENCES.PROVEN,
        fileId = '',
        moduleId = '',
        sourceLocationBefore = null,
        sourceLocationAfter = null,
        symbolIds = [],
        functionIds = [],
        before = null,
        after = null,
        evidence = [],
        causes = [],
        consequences = [],
        metadata = {},
    } = {}) {
        this.kind = kind;
        this.severity = severity;
        this.confidence = confidence;
        this.fileId = String(fileId || '');
        this.moduleId = String(moduleId || '');
        this.sourceLocationBefore = sourceLocationBefore instanceof ChangeRegion
            ? sourceLocationBefore
            : (sourceLocationBefore ? ChangeRegion.fromJSON(sourceLocationBefore) : null);
        this.sourceLocationAfter = sourceLocationAfter instanceof ChangeRegion
            ? sourceLocationAfter
            : (sourceLocationAfter ? ChangeRegion.fromJSON(sourceLocationAfter) : null);
        this.symbolIds = Object.freeze([...symbolIds].sort());
        this.functionIds = Object.freeze([...functionIds].sort());
        this.before = before !== null && typeof before === 'object' ? Object.freeze({ ...before }) : before;
        this.after = after !== null && typeof after === 'object' ? Object.freeze({ ...after }) : after;
        this.evidence = Object.freeze([...evidence]);
        this.causes = Object.freeze([...causes]);
        this.consequences = Object.freeze([...consequences]);
        this.metadata = Object.freeze({ ...metadata });

        const hashInput = JSON.stringify({
            kind: this.kind,
            fileId: this.fileId,
            moduleId: this.moduleId,
            locB: this.sourceLocationBefore?.toJSON?.() || null,
            locA: this.sourceLocationAfter?.toJSON?.() || null,
            symbols: this.symbolIds,
            functions: this.functionIds,
            before: this.before,
            after: this.after,
        });

        this.id = id || `change_${SemanticChange.computeHash(hashInput)}`;
        if (new.target === SemanticChange) {
            Object.freeze(this);
        }
    }

    static computeHash(str) {
        let hash = 5381;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) + hash) + str.charCodeAt(i);
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16);
    }

    toJSON() {
        return {
            id: this.id,
            kind: this.kind,
            severity: this.severity,
            confidence: this.confidence,
            fileId: this.fileId,
            moduleId: this.moduleId,
            sourceLocationBefore: this.sourceLocationBefore?.toJSON?.() || null,
            sourceLocationAfter: this.sourceLocationAfter?.toJSON?.() || null,
            symbolIds: [...this.symbolIds],
            functionIds: [...this.functionIds],
            before: this.before,
            after: this.after,
            evidence: [...this.evidence],
            causes: [...this.causes],
            consequences: [...this.consequences],
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new SemanticChange({
            id: json.id,
            kind: json.kind,
            severity: json.severity,
            confidence: json.confidence,
            fileId: json.fileId,
            moduleId: json.moduleId,
            sourceLocationBefore: json.sourceLocationBefore,
            sourceLocationAfter: json.sourceLocationAfter,
            symbolIds: json.symbolIds,
            functionIds: json.functionIds,
            before: json.before,
            after: json.after,
            evidence: json.evidence,
            causes: json.causes,
            consequences: json.consequences,
            metadata: json.metadata,
        });
    }
}
