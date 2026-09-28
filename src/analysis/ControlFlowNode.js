/**
 * ControlFlowNode — Canonical node in the Universal Control-Flow Graph (CFG).
 *
 * Guaranteed Properties:
 *  1. Deterministic Identity: IDs are constructed deterministically (e.g. cfg_node_main_stmt_1).
 *  2. Language-Agnostic: Accommodates statements, conditions, branches, loops, function entries/exits, exceptions.
 *  3. Immutable & Serializable: Clean round-trip JSON serialization.
 */

export const CFG_NODE_TYPES = Object.freeze({
    ENTRY: 'ENTRY',
    EXIT: 'EXIT',
    BASIC_BLOCK: 'BASIC_BLOCK',
    STATEMENT: 'STATEMENT',
    CONDITION: 'CONDITION',
    LOOP_HEADER: 'LOOP_HEADER',
    LOOP_LATCH: 'LOOP_LATCH',
    FUNCTION_ENTRY: 'FUNCTION_ENTRY',
    FUNCTION_EXIT: 'FUNCTION_EXIT',
    EXCEPTION_HANDLER: 'EXCEPTION_HANDLER',
    RETURN: 'RETURN',
    YIELD: 'YIELD',
    IMPORT: 'IMPORT',
});

export class ControlFlowNode {
    /**
     * @param {object} params
     * @param {string} params.id - Deterministic node ID
     * @param {string} params.type - One of CFG_NODE_TYPES
     * @param {string} [params.label] - Human-readable label / code snippet
     * @param {string} [params.fileId] - File ID (e.g. 'main.py')
     * @param {string} [params.moduleId] - Module ID (e.g. 'main')
     * @param {string} [params.functionId] - Function identifier (e.g. 'calc' or '<module>')
     * @param {Array<object>} [params.sourceLocations] - Source locations associated with this node
     * @param {Array<string>} [params.statementIds] - IDs of statements contained in this node
     * @param {object} [params.metadata] - Extra semantic metadata
     */
    constructor({
        id,
        type = CFG_NODE_TYPES.STATEMENT,
        label = null,
        fileId = 'main.py',
        moduleId = 'main',
        functionId = '<module>',
        sourceLocations = [],
        statementIds = [],
        metadata = {},
    }) {
        if (!id || typeof id !== 'string') {
            throw new Error('ControlFlowNode requires a valid non-empty string id');
        }
        this.id = id;
        this.type = type;
        this.label = label || type;
        this.fileId = fileId;
        this.moduleId = moduleId;
        this.functionId = functionId;
        this.sourceLocations = Array.isArray(sourceLocations) ? sourceLocations.map(loc => ({ ...loc })) : [];
        this.statementIds = Array.isArray(statementIds) ? [...statementIds] : [];
        this.metadata = { ...metadata };
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Deterministic Factory Helpers
    // ─────────────────────────────────────────────────────────────────────────────

    static createEntryNode(functionId = '<module>', fileId = 'main.py') {
        const cleanFunc = String(functionId).replace(/[^a-zA-Z0-9_]/g, '_');
        return new ControlFlowNode({
            id: `cfg_node_${cleanFunc}_ENTRY`,
            type: CFG_NODE_TYPES.ENTRY,
            label: `Entry: ${functionId}`,
            fileId,
            functionId,
        });
    }

    static createExitNode(functionId = '<module>', fileId = 'main.py') {
        const cleanFunc = String(functionId).replace(/[^a-zA-Z0-9_]/g, '_');
        return new ControlFlowNode({
            id: `cfg_node_${cleanFunc}_EXIT`,
            type: CFG_NODE_TYPES.EXIT,
            label: `Exit: ${functionId}`,
            fileId,
            functionId,
        });
    }

    static createStatementNode({ functionId = '<module>', fileId = 'main.py', line = 0, label = '', ordinal = 0, metadata = {} }) {
        const cleanFunc = String(functionId).replace(/[^a-zA-Z0-9_]/g, '_');
        const id = `cfg_node_${cleanFunc}_L${line}_${ordinal}`;
        return new ControlFlowNode({
            id,
            type: CFG_NODE_TYPES.STATEMENT,
            label: label || `Statement (L${line})`,
            fileId,
            functionId,
            sourceLocations: [{ fileId, line }],
            metadata,
        });
    }

    static createConditionNode({ functionId = '<module>', fileId = 'main.py', line = 0, condition = '', ordinal = 0 }) {
        const cleanFunc = String(functionId).replace(/[^a-zA-Z0-9_]/g, '_');
        const id = `cfg_node_${cleanFunc}_COND_L${line}_${ordinal}`;
        return new ControlFlowNode({
            id,
            type: CFG_NODE_TYPES.CONDITION,
            label: `if ${condition}`,
            fileId,
            functionId,
            sourceLocations: [{ fileId, line }],
            metadata: { condition },
        });
    }

    static createLoopHeaderNode({ functionId = '<module>', fileId = 'main.py', line = 0, condition = '', ordinal = 0 }) {
        const cleanFunc = String(functionId).replace(/[^a-zA-Z0-9_]/g, '_');
        const id = `cfg_node_${cleanFunc}_LOOP_L${line}_${ordinal}`;
        return new ControlFlowNode({
            id,
            type: CFG_NODE_TYPES.LOOP_HEADER,
            label: `while/for ${condition}`,
            fileId,
            functionId,
            sourceLocations: [{ fileId, line }],
            metadata: { condition },
        });
    }

    toJSON() {
        return {
            id: this.id,
            type: this.type,
            label: this.label,
            fileId: this.fileId,
            moduleId: this.moduleId,
            functionId: this.functionId,
            sourceLocations: this.sourceLocations,
            statementIds: this.statementIds,
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json || typeof json !== 'object') return null;
        return new ControlFlowNode(json);
    }
}
