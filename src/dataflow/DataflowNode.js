/**
 * DataflowNode — Canonical representation of a node in the Program Dependency Graph (PDG).
 *
 * Guaranteed Properties:
 *  1. Deterministic IDs: IDs are constructed deterministically (e.g. df_var_1_main_x).
 *  2. Language-Agnostic: Accommodates expressions, variables, objects, calls, parameters.
 *  3. Serializable: Clean JSON round-trip.
 */

export const DATAFLOW_NODE_TYPES = Object.freeze({
    PROGRAM: 'program',
    MODULE: 'module',
    STATEMENT: 'statement',
    EXPRESSION: 'expression',
    VARIABLE: 'variable',
    VALUE: 'value',
    OBJECT: 'object',
    COLLECTION_ELEMENT: 'collection_element',
    OBJECT_FIELD: 'object_field',
    PARAMETER: 'parameter',
    RETURN_VALUE: 'return_value',
    CALL: 'call',
    CALL_FRAME: 'call_frame',
    SCOPE: 'scope',
    SOURCE_LOCATION: 'source_location',
});

export class DataflowNode {
    /**
     * @param {object} params
     * @param {string} params.id - Deterministic node ID
     * @param {string} params.type - One of DATAFLOW_NODE_TYPES
     * @param {string} [params.label] - Human readable label
     * @param {object} [params.sourceLocation] - { fileId, moduleId, line, column, endLine, endColumn }
     * @param {string} [params.fileId] - File ID
     * @param {string} [params.moduleId] - Module ID
     * @param {string} [params.frameId] - CallFrame ID
     * @param {string} [params.variableId] - Variable name or binding identifier
     * @param {string} [params.objectId] - Heap object ID (e.g. 'obj_1')
     * @param {number} [params.frameIndex] - Timeline frame index
     * @param {object} [params.value] - Structured runtime Value descriptor
     * @param {object} [params.metadata] - Extra metadata
     */
    constructor({
        id,
        type = DATAFLOW_NODE_TYPES.VARIABLE,
        label = null,
        sourceLocation = null,
        fileId = null,
        moduleId = null,
        frameId = null,
        variableId = null,
        objectId = null,
        frameIndex = null,
        value = null,
        metadata = {},
    }) {
        if (!id || typeof id !== 'string') {
            throw new Error('DataflowNode requires a valid non-empty string id');
        }
        this.id = id;
        this.type = type;
        this.label = label || variableId || objectId || id;
        this.sourceLocation = sourceLocation ? { ...sourceLocation } : null;
        this.fileId = fileId || sourceLocation?.fileId || sourceLocation?.file || null;
        this.moduleId = moduleId || sourceLocation?.moduleId || null;
        this.frameId = frameId;
        this.variableId = variableId;
        this.objectId = objectId;
        this.frameIndex = typeof frameIndex === 'number' ? frameIndex : null;
        this.value = value ? { ...value } : null;
        this.metadata = { ...metadata };
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Deterministic Factory Helpers
    // ─────────────────────────────────────────────────────────────────────────────

    static createVariableNode({ name, frameIndex = 0, scopeId = 'local', fileId = 'main.py', value = null, sourceLocation = null }) {
        const cleanFile = String(fileId || 'main').replace(/[^a-zA-Z0-9_]/g, '_');
        const id = `df_var_${frameIndex}_${scopeId}_${cleanFile}_${name}`;
        return new DataflowNode({
            id,
            type: DATAFLOW_NODE_TYPES.VARIABLE,
            label: name,
            variableId: name,
            frameIndex,
            fileId,
            value,
            sourceLocation,
        });
    }

    static createObjectNode({ objectId, frameIndex = 0, objectType = 'object', sourceLocation = null }) {
        const id = `df_obj_${objectId}_f${frameIndex}`;
        return new DataflowNode({
            id,
            type: DATAFLOW_NODE_TYPES.OBJECT,
            label: `${objectType} (${objectId})`,
            objectId,
            frameIndex,
            sourceLocation,
        });
    }

    static createExpressionNode({ expression, frameIndex = 0, sourceLocation = null, value = null }) {
        const hash = DataflowNode._hashString(expression);
        const id = `df_expr_${frameIndex}_${hash}`;
        return new DataflowNode({
            id,
            type: DATAFLOW_NODE_TYPES.EXPRESSION,
            label: expression,
            frameIndex,
            sourceLocation,
            value,
            metadata: { expression },
        });
    }

    static createParameterNode({ paramName, functionName, frameIndex = 0, fileId = 'main.py', value = null, sourceLocation = null }) {
        const cleanFile = String(fileId || 'main').replace(/[^a-zA-Z0-9_]/g, '_');
        const id = `df_param_${frameIndex}_${cleanFile}_${functionName}_${paramName}`;
        return new DataflowNode({
            id,
            type: DATAFLOW_NODE_TYPES.PARAMETER,
            label: `${functionName}(${paramName})`,
            variableId: paramName,
            frameIndex,
            fileId,
            value,
            sourceLocation,
            metadata: { functionName, paramName },
        });
    }

    static createReturnValueNode({ functionName, frameIndex = 0, fileId = 'main.py', value = null, sourceLocation = null }) {
        const cleanFile = String(fileId || 'main').replace(/[^a-zA-Z0-9_]/g, '_');
        const id = `df_ret_${frameIndex}_${cleanFile}_${functionName}`;
        return new DataflowNode({
            id,
            type: DATAFLOW_NODE_TYPES.RETURN_VALUE,
            label: `return ${functionName}()`,
            frameIndex,
            fileId,
            value,
            sourceLocation,
            metadata: { functionName },
        });
    }

    static createFieldNode({ objectId, fieldName, frameIndex = 0, value = null, sourceLocation = null }) {
        const id = `df_field_${objectId}_${fieldName}_f${frameIndex}`;
        return new DataflowNode({
            id,
            type: DATAFLOW_NODE_TYPES.OBJECT_FIELD,
            label: `${objectId}.${fieldName}`,
            objectId,
            variableId: fieldName,
            frameIndex,
            value,
            sourceLocation,
            metadata: { objectId, fieldName },
        });
    }

    static createElementNode({ objectId, index, frameIndex = 0, value = null, sourceLocation = null }) {
        const id = `df_elem_${objectId}_${index}_f${frameIndex}`;
        return new DataflowNode({
            id,
            type: DATAFLOW_NODE_TYPES.COLLECTION_ELEMENT,
            label: `${objectId}[${index}]`,
            objectId,
            variableId: String(index),
            frameIndex,
            value,
            sourceLocation,
            metadata: { objectId, index },
        });
    }

    static _hashString(str) {
        let hash = 2166136261;
        for (let i = 0; i < str.length; i++) {
            hash ^= str.charCodeAt(i);
            hash = Math.imul(hash, 16777619);
        }
        return (hash >>> 0).toString(36);
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Serialization
    // ─────────────────────────────────────────────────────────────────────────────

    toJSON() {
        return {
            id: this.id,
            type: this.type,
            label: this.label,
            sourceLocation: this.sourceLocation,
            fileId: this.fileId,
            moduleId: this.moduleId,
            frameId: this.frameId,
            variableId: this.variableId,
            objectId: this.objectId,
            frameIndex: this.frameIndex,
            value: this.value,
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json || typeof json !== 'object') return null;
        return new DataflowNode(json);
    }
}
