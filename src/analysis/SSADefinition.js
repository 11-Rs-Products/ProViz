/**
 * SSADefinition — Associates an SSAValue with its definition site, basic block, and dependencies.
 */

export class SSADefinition {
    /**
     * @param {object} params
     * @param {string} [params.id]
     * @param {string} params.ssaValueId - Resulting SSAValue ID
     * @param {string} params.variableId - Variable identifier
     * @param {number} params.version - SSA version
     * @param {string} [params.blockId=null] - Containing BasicBlock ID
     * @param {string} [params.cfgNodeId=null] - Originating CFG node ID
     * @param {object|null} [params.sourceLocation=null]
     * @param {Array<string>} [params.dependencies=[]] - Input SSAValue IDs or variable names
     * @param {object} [params.metadata={}]
     */
    constructor({
        id = null,
        ssaValueId,
        variableId,
        version = 0,
        blockId = null,
        cfgNodeId = null,
        sourceLocation = null,
        dependencies = [],
        metadata = {},
    }) {
        if (!ssaValueId || !variableId) {
            throw new Error('SSADefinition requires ssaValueId and variableId');
        }
        this.ssaValueId = ssaValueId;
        this.variableId = variableId;
        this.version = version;
        this.blockId = blockId;
        this.cfgNodeId = cfgNodeId;
        this.sourceLocation = sourceLocation ? { ...sourceLocation } : null;
        this.dependencies = Array.isArray(dependencies) ? [...dependencies] : [];
        this.metadata = { ...metadata };
        this.id = id || `ssa_def_${ssaValueId}`;
    }

    toJSON() {
        return {
            id: this.id,
            ssaValueId: this.ssaValueId,
            variableId: this.variableId,
            version: this.version,
            blockId: this.blockId,
            cfgNodeId: this.cfgNodeId,
            sourceLocation: this.sourceLocation,
            dependencies: this.dependencies,
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json || typeof json !== 'object') return null;
        return new SSADefinition(json);
    }
}
