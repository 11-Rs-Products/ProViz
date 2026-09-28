/**
 * SSAValue — Represents a statically versioned value in Static Single Assignment (SSA) form.
 */

export class SSAValue {
    /**
     * @param {object} params
     * @param {string} [params.id] - e.g. ssa_main_x_1
     * @param {string} params.variableId - Base variable name (e.g. 'x')
     * @param {number} params.version - SSA version sequence (0, 1, 2...)
     * @param {string} [params.functionId='<module>']
     * @param {string|null} [params.definitionNodeId=null] - CFG node ID defining this SSA version
     * @param {object|null} [params.sourceLocation=null]
     * @param {boolean} [params.isParameter=false]
     * @param {boolean} [params.isPhi=false]
     * @param {object} [params.metadata={}]
     */
    constructor({
        id = null,
        variableId,
        version = 0,
        functionId = '<module>',
        definitionNodeId = null,
        sourceLocation = null,
        isParameter = false,
        isPhi = false,
        metadata = {},
    }) {
        if (!variableId) {
            throw new Error('SSAValue requires a valid variableId');
        }
        this.variableId = variableId;
        this.version = version;
        this.functionId = functionId;
        this.definitionNodeId = definitionNodeId;
        this.sourceLocation = sourceLocation ? { ...sourceLocation } : null;
        this.isParameter = Boolean(isParameter);
        this.isPhi = Boolean(isPhi);
        this.metadata = { ...metadata };

        const cleanFunc = String(functionId).replace(/[^a-zA-Z0-9_]/g, '_');
        this.id = id || `ssa_${cleanFunc}_${variableId}_${version}`;
    }

    get name() {
        return `${this.variableId}_${this.version}`;
    }

    toJSON() {
        return {
            id: this.id,
            variableId: this.variableId,
            version: this.version,
            functionId: this.functionId,
            definitionNodeId: this.definitionNodeId,
            sourceLocation: this.sourceLocation,
            isParameter: this.isParameter,
            isPhi: this.isPhi,
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json || typeof json !== 'object') return null;
        return new SSAValue(json);
    }
}
