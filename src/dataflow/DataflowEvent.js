/**
 * DataflowEvent — Normalized dataflow event abstraction produced during trace analysis.
 */

export const DATAFLOW_EVENT_TYPES = Object.freeze({
    DEFINITION: 'definition',
    USE: 'use',
    ASSIGNMENT: 'assignment',
    ARGUMENT_PASS: 'argument_pass',
    PARAMETER_RECEIVE: 'parameter_receive',
    RETURN: 'return',
    OBJECT_CREATE: 'object_create',
    OBJECT_MUTATION: 'object_mutation',
    FIELD_READ: 'field_read',
    FIELD_WRITE: 'field_write',
    ELEMENT_READ: 'element_read',
    ELEMENT_WRITE: 'element_write',
    ALIAS_CREATE: 'alias_create',
    ALIAS_REMOVE: 'alias_remove',
    CALL_ENTER: 'call_enter',
    CALL_EXIT: 'call_exit',
});

export class DataflowEvent {
    /**
     * @param {object} params
     * @param {string} [params.id]
     * @param {string} params.type - One of DATAFLOW_EVENT_TYPES
     * @param {number} params.frameIndex - Timeline frame index
     * @param {object} [params.sourceLocation] - Location descriptor
     * @param {object} [params.subject] - Target of event (variable name, objectId, field, etc.)
     * @param {Array} [params.dependencies] - List of input subjects / variable names contributing to event
     * @param {object} [params.value] - Value descriptor if applicable
     * @param {object} [params.metadata]
     */
    constructor({
        id = null,
        type,
        frameIndex = 0,
        sourceLocation = null,
        subject = {},
        dependencies = [],
        value = null,
        metadata = {},
    }) {
        this.type = type;
        this.frameIndex = frameIndex;
        this.id = id || `df_ev_${frameIndex}_${type}_${DataflowEvent._hashSubject(subject)}`;
        this.sourceLocation = sourceLocation ? { ...sourceLocation } : null;
        this.subject = { ...subject };
        this.dependencies = Array.isArray(dependencies) ? [...dependencies] : [];
        this.value = value ? { ...value } : null;
        this.metadata = { ...metadata };
    }

    static _hashSubject(subject) {
        const str = JSON.stringify(subject || {});
        let hash = 2166136261;
        for (let i = 0; i < str.length; i++) {
            hash ^= str.charCodeAt(i);
            hash = Math.imul(hash, 16777619);
        }
        return (hash >>> 0).toString(36);
    }

    toJSON() {
        return {
            id: this.id,
            type: this.type,
            frameIndex: this.frameIndex,
            sourceLocation: this.sourceLocation,
            subject: this.subject,
            dependencies: this.dependencies,
            value: this.value,
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json || typeof json !== 'object') return null;
        return new DataflowEvent(json);
    }
}
