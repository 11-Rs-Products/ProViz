/**
 * MutationRecord — Captures an in-place mutation to a heap object.
 */

export const MUTATION_OPERATIONS = Object.freeze({
    APPEND: 'append',
    REMOVE: 'remove',
    INSERT: 'insert',
    REPLACE: 'replace',
    FIELD_WRITE: 'field_write',
    FIELD_DELETE: 'field_delete',
    DICT_WRITE: 'dict_write',
    DICT_DELETE: 'dict_delete',
    SET_ADD: 'set_add',
    SET_REMOVE: 'set_remove',
    CUSTOM_MUTATION: 'custom_mutation',
});

export class MutationRecord {
    /**
     * @param {object} params
     * @param {string} [params.id]
     * @param {string} params.objectId - Target heap object ID
     * @param {string} [params.operation] - One of MUTATION_OPERATIONS
     * @param {string|number|null} [params.target] - Mutated field, index, or key
     * @param {object|null} [params.previousValue] - Value before mutation
     * @param {object|null} [params.nextValue] - Value after mutation
     * @param {string|null} [params.mutatorVariable] - Name of variable used to execute mutation
     * @param {number} [params.frameIndex] - Frame index where mutation occurred
     * @param {object|null} [params.sourceLocation] - Location descriptor
     * @param {string|null} [params.nodeId] - Associated DataflowNode ID
     * @param {object} [params.metadata]
     */
    constructor({
        id = null,
        objectId,
        operation = MUTATION_OPERATIONS.CUSTOM_MUTATION,
        target = null,
        previousValue = null,
        nextValue = null,
        mutatorVariable = null,
        frameIndex = 0,
        sourceLocation = null,
        nodeId = null,
        metadata = {},
    }) {
        if (!objectId) {
            throw new Error('MutationRecord requires a valid objectId');
        }
        this.objectId = objectId;
        this.operation = operation;
        this.target = target;
        this.previousValue = previousValue ? { ...previousValue } : null;
        this.nextValue = nextValue ? { ...nextValue } : null;
        this.mutatorVariable = mutatorVariable;
        this.frameIndex = typeof frameIndex === 'number' ? frameIndex : 0;
        this.sourceLocation = sourceLocation ? { ...sourceLocation } : null;
        this.nodeId = nodeId;
        this.metadata = { ...metadata };

        const targetPart = target !== null ? `_${String(target).replace(/[^a-zA-Z0-9_]/g, '_')}` : '';
        this.id = id || `df_mut_${objectId}_${operation}${targetPart}_f${this.frameIndex}`;
    }

    toJSON() {
        return {
            id: this.id,
            objectId: this.objectId,
            operation: this.operation,
            target: this.target,
            previousValue: this.previousValue,
            nextValue: this.nextValue,
            mutatorVariable: this.mutatorVariable,
            frameIndex: this.frameIndex,
            sourceLocation: this.sourceLocation,
            nodeId: this.nodeId,
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json || typeof json !== 'object') return null;
        return new MutationRecord(json);
    }
}
