/**
 * TypeSnapshot — Immutable historical snapshot of TypeFlow and inference results.
 */

export class TypeSnapshot {
    /**
     * @param {object} params
     * @param {string} [params.functionId='<module>']
     * @param {number} [params.typeflowVersion=1]
     * @param {object|null} [params.typeFlowGraph=null]
     * @param {Array<object>} [params.diagnostics=[]]
     * @param {object} [params.metadata={}]
     */
    constructor({
        functionId = '<module>',
        typeflowVersion = 1,
        typeFlowGraph = null,
        diagnostics = [],
        metadata = {},
    } = {}) {
        this.functionId = functionId;
        this.typeflowVersion = typeflowVersion;
        this.typeFlowGraph = typeFlowGraph ? (typeFlowGraph.toJSON ? typeFlowGraph.toJSON() : typeFlowGraph) : null;
        this.diagnostics = Object.freeze(diagnostics.map(d => d.toJSON ? d.toJSON() : d));
        this.metadata = Object.freeze({ ...metadata });
        Object.freeze(this);
    }

    static capture({ functionId = '<module>', inference = null, typeFlowGraph = null, diagnostics = [], metadata = {} }) {
        return new TypeSnapshot({
            functionId,
            typeFlowGraph: typeFlowGraph || inference?.typeFlowGraph,
            diagnostics: diagnostics || inference?.diagnostics || [],
            metadata,
        });
    }

    toJSON() {
        return {
            functionId: this.functionId,
            typeflowVersion: this.typeflowVersion,
            typeFlowGraph: this.typeFlowGraph,
            diagnostics: this.diagnostics,
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json || typeof json !== 'object') return null;
        return new TypeSnapshot(json);
    }
}
