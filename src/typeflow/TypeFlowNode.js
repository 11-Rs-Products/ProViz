/**
 * TypeFlowNode — Canonical semantic node in the Type/Value Flow Graph.
 */

import { AbstractValue } from './AbstractValue.js';

export const TYPEFLOW_NODE_TYPES = Object.freeze({
    SSA_VALUE: 'SSA_VALUE',
    VARIABLE: 'VARIABLE',
    EXPRESSION: 'EXPRESSION',
    CONSTANT: 'CONSTANT',
    TYPE: 'TYPE',
    OBJECT_SHAPE: 'OBJECT_SHAPE',
    COLLECTION_SHAPE: 'COLLECTION_SHAPE',
    PARAMETER: 'PARAMETER',
    RETURN_VALUE: 'RETURN_VALUE',
});

export class TypeFlowNode {
    /**
     * @param {object} params
     * @param {string} params.id
     * @param {string} [params.type=TYPEFLOW_NODE_TYPES.VARIABLE]
     * @param {string} [params.label='']
     * @param {AbstractValue|null} [params.abstractValue=null]
     * @param {string|null} [params.ssaValueId=null]
     * @param {Array<object>} [params.sourceLocations=[]]
     * @param {object} [params.metadata={}]
     */
    constructor({
        id,
        type = TYPEFLOW_NODE_TYPES.VARIABLE,
        label = '',
        abstractValue = null,
        ssaValueId = null,
        sourceLocations = [],
        metadata = {},
    }) {
        this.id = id;
        this.type = type;
        this.label = label || id;
        this.abstractValue = abstractValue instanceof AbstractValue ? abstractValue : (abstractValue ? AbstractValue.fromJSON(abstractValue) : AbstractValue.unknown());
        this.ssaValueId = ssaValueId;
        this.sourceLocations = Array.isArray(sourceLocations) ? sourceLocations : [];
        this.metadata = Object.freeze({ ...metadata });
    }

    static createVariableNode({ variableName, functionId = '<module>', abstractValue = null, ssaValueId = null, line = null, fileId = 'main.py' }) {
        const id = `tfn_var_${String(functionId).replace(/[^a-zA-Z0-9_]/g, '_')}_${variableName}${ssaValueId ? `_${ssaValueId}` : ''}`;
        return new TypeFlowNode({
            id,
            type: TYPEFLOW_NODE_TYPES.VARIABLE,
            label: variableName,
            abstractValue,
            ssaValueId,
            sourceLocations: line ? [{ fileId, line }] : [],
            metadata: { variableName, functionId },
        });
    }

    toJSON() {
        return {
            id: this.id,
            type: this.type,
            label: this.label,
            abstractValue: this.abstractValue.toJSON(),
            ssaValueId: this.ssaValueId,
            sourceLocations: this.sourceLocations,
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new TypeFlowNode({
            ...json,
            abstractValue: AbstractValue.fromJSON(json.abstractValue),
        });
    }
}
