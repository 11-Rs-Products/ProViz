/**
 * BasicBlock — Maximal sequence of instructions with single entry and single exit.
 */

export class BasicBlock {
    /**
     * @param {object} params
     * @param {string} params.id - Deterministic block ID (e.g. bb_main_0)
     * @param {string} [params.functionId='<module>']
     * @param {Array<string>} [params.statementIds=[]]
     * @param {Array<object>} [params.statements=[]] - Array of statement ASTs / descriptors
     * @param {string|null} [params.entryNodeId=null]
     * @param {string|null} [params.exitNodeId=null]
     * @param {Array<string>} [params.predecessors=[]] - Predecessor block IDs
     * @param {Array<string>} [params.successors=[]] - Successor block IDs
     * @param {Array<object>} [params.sourceLocations=[]]
     * @param {object} [params.metadata={}]
     */
    constructor({
        id,
        functionId = '<module>',
        statementIds = [],
        statements = [],
        entryNodeId = null,
        exitNodeId = null,
        predecessors = [],
        successors = [],
        sourceLocations = [],
        metadata = {},
    }) {
        if (!id) {
            throw new Error('BasicBlock requires a valid id');
        }
        this.id = id;
        this.functionId = functionId;
        this.statementIds = Array.isArray(statementIds) ? [...statementIds] : [];
        this.statements = Array.isArray(statements) ? statements.map(s => ({ ...s })) : [];
        this.entryNodeId = entryNodeId;
        this.exitNodeId = exitNodeId;
        this.predecessors = Array.isArray(predecessors) ? [...predecessors] : [];
        this.successors = Array.isArray(successors) ? [...successors] : [];
        this.sourceLocations = Array.isArray(sourceLocations) ? sourceLocations.map(l => ({ ...l })) : [];
        this.metadata = { ...metadata };
    }

    addStatement(stmt, nodeId = null) {
        if (!stmt) return;
        this.statements.push(typeof stmt === 'object' ? { ...stmt } : { code: stmt });
        if (nodeId) {
            this.statementIds.push(nodeId);
            if (!this.entryNodeId) this.entryNodeId = nodeId;
            this.exitNodeId = nodeId;
        }
        if (stmt?.sourceLocation) {
            this.sourceLocations.push({ ...stmt.sourceLocation });
        }
    }

    toJSON() {
        return {
            id: this.id,
            functionId: this.functionId,
            statementIds: this.statementIds,
            statements: this.statements,
            entryNodeId: this.entryNodeId,
            exitNodeId: this.exitNodeId,
            predecessors: this.predecessors,
            successors: this.successors,
            sourceLocations: this.sourceLocations,
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json || typeof json !== 'object') return null;
        return new BasicBlock(json);
    }
}
