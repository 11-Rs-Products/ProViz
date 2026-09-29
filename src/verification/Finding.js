/**
 * Finding — Canonical representation of a static verification finding or defect.
 */

import { FINDING_KINDS } from './FindingKind.js';
import { FINDING_SEVERITIES } from './FindingSeverity.js';
import { FINDING_STATUSES } from './FindingStatus.js';
import { FindingLocation } from './FindingLocation.js';
import { FindingEvidence } from './FindingEvidence.js';

export class Finding {
    /**
     * @param {object} params
     * @param {string} [params.id]
     * @param {string} params.kind - FINDING_KINDS member
     * @param {string} [params.severity] - FINDING_SEVERITIES member
     * @param {string} [params.confidence] - 'STATIC_GUARANTEE' | 'STATIC_INFERENCE' | 'DYNAMIC_OBSERVATION' | 'HEURISTIC' | 'UNKNOWN'
     * @param {string} [params.status] - FINDING_STATUSES member
     * @param {string} params.message
     * @param {string} [params.shortMessage]
     * @param {FindingLocation|object} [params.sourceLocation]
     * @param {string} [params.moduleId]
     * @param {string} [params.fileId]
     * @param {string} [params.functionId]
     * @param {string|null} [params.cfgNodeId]
     * @param {string|null} [params.ssaValueId]
     * @param {string|null} [params.dataflowNodeId]
     * @param {string|null} [params.typeflowNodeId]
     * @param {object|null} [params.property]
     * @param {string|null} [params.pathCondition]
     * @param {Array<FindingEvidence|object>} [params.evidence]
     * @param {Array<string>} [params.relatedNodes]
     * @param {Array<string>} [params.relatedFindings]
     * @param {number|null} [params.firstFrame]
     * @param {number|null} [params.lastFrame]
     * @param {string|null} [params.explanation]
     * @param {object} [params.metadata]
     */
    constructor({
        id = null,
        kind,
        severity = FINDING_SEVERITIES.WARNING,
        confidence = 'STATIC_INFERENCE',
        status = FINDING_STATUSES.STATIC_INFERENCE,
        message,
        shortMessage = null,
        sourceLocation = null,
        moduleId = 'main',
        fileId = 'main.py',
        functionId = '<module>',
        cfgNodeId = null,
        ssaValueId = null,
        dataflowNodeId = null,
        typeflowNodeId = null,
        property = null,
        pathCondition = null,
        evidence = [],
        relatedNodes = [],
        relatedFindings = [],
        firstFrame = null,
        lastFrame = null,
        explanation = null,
        metadata = {},
    }) {
        this.kind = kind || FINDING_KINDS.POSSIBLE_TYPE_MISMATCH;
        this.severity = severity || FINDING_SEVERITIES.WARNING;
        this.confidence = confidence;
        this.status = status;
        this.message = String(message || '');
        this.shortMessage = shortMessage ? String(shortMessage) : this.message.split('.')[0];
        this.sourceLocation = sourceLocation instanceof FindingLocation
            ? sourceLocation
            : (sourceLocation ? new FindingLocation(sourceLocation) : new FindingLocation({ fileId }));
        this.moduleId = String(moduleId || 'main');
        this.fileId = String(fileId || this.sourceLocation.fileId || 'main.py');
        this.functionId = String(functionId || '<module>');
        this.cfgNodeId = cfgNodeId;
        this.ssaValueId = ssaValueId;
        this.dataflowNodeId = dataflowNodeId;
        this.typeflowNodeId = typeflowNodeId;
        this.property = property ? Object.freeze({ ...property }) : null;
        this.pathCondition = pathCondition;
        this.evidence = Object.freeze(evidence.map(e => (e instanceof FindingEvidence ? e : new FindingEvidence(e))));
        this.relatedNodes = Object.freeze([...relatedNodes]);
        this.relatedFindings = Object.freeze([...relatedFindings]);
        this.firstFrame = firstFrame;
        this.lastFrame = lastFrame;
        this.explanation = explanation;
        this.metadata = Object.freeze({ ...metadata });

        const locKey = this.sourceLocation.toString();
        const hashSeed = `${this.kind}:${locKey}:${this.cfgNodeId || ''}:${this.ssaValueId || ''}:${this.message}`;
        this.id = id || `find_${this.kind.toLowerCase()}_${Finding.computeHash(hashSeed)}`;

        Object.freeze(this);
    }

    static computeHash(str) {
        let hash = 5381;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) + hash) + str.charCodeAt(i);
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16);
    }

    isDefinite() {
        return this.kind.startsWith('DEFINITE_') || this.severity === FINDING_SEVERITIES.ERROR;
    }

    isPossible() {
        return this.kind.startsWith('POSSIBLE_') || this.severity === FINDING_SEVERITIES.WARNING;
    }

    equals(other) {
        if (!other || !(other instanceof Finding)) return false;
        return this.id === other.id;
    }

    toJSON() {
        return {
            id: this.id,
            kind: this.kind,
            severity: this.severity,
            confidence: this.confidence,
            status: this.status,
            message: this.message,
            shortMessage: this.shortMessage,
            sourceLocation: this.sourceLocation.toJSON(),
            moduleId: this.moduleId,
            fileId: this.fileId,
            functionId: this.functionId,
            cfgNodeId: this.cfgNodeId,
            ssaValueId: this.ssaValueId,
            dataflowNodeId: this.dataflowNodeId,
            typeflowNodeId: this.typeflowNodeId,
            property: this.property,
            pathCondition: this.pathCondition,
            evidence: this.evidence.map(e => e.toJSON()),
            relatedNodes: this.relatedNodes,
            relatedFindings: this.relatedFindings,
            firstFrame: this.firstFrame,
            lastFrame: this.lastFrame,
            explanation: this.explanation,
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new Finding({
            ...json,
            sourceLocation: FindingLocation.fromJSON(json.sourceLocation),
            evidence: (json.evidence || []).map(e => FindingEvidence.fromJSON(e)),
        });
    }
}
