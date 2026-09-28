/**
 * ProgramSlice — Canonical representation of a static or dynamic program slice.
 */

export const SLICE_DIRECTIONS = Object.freeze({
    BACKWARD: 'BACKWARD',
    FORWARD: 'FORWARD',
    BIDIRECTIONAL: 'BIDIRECTIONAL',
});

export const SLICE_MODES = Object.freeze({
    STATIC: 'static',
    DYNAMIC: 'dynamic',
});

export class ProgramSlice {
    /**
     * @param {object} params
     * @param {object} params.criterion - Slicing criterion: { variable, line, nodeId, functionId, sourceLocation }
     * @param {string} [params.direction=SLICE_DIRECTIONS.BACKWARD]
     * @param {string} [params.mode=SLICE_MODES.STATIC]
     * @param {Array<object>} [params.nodes=[]]
     * @param {Array<object>} [params.edges=[]]
     * @param {Array<object>} [params.sourceLocations=[]]
     * @param {Array<string>} [params.statements=[]] - Source line strings / statements included in slice
     * @param {Array<string>} [params.dependencies=[]]
     * @param {object} [params.metadata={}]
     */
    constructor({
        criterion,
        direction = SLICE_DIRECTIONS.BACKWARD,
        mode = SLICE_MODES.STATIC,
        nodes = [],
        edges = [],
        sourceLocations = [],
        statements = [],
        dependencies = [],
        metadata = {},
    }) {
        if (!criterion) {
            throw new Error('ProgramSlice requires a slicing criterion');
        }
        this.criterion = { ...criterion };
        this.direction = direction;
        this.mode = mode;
        this.nodes = Array.isArray(nodes) ? nodes.map(n => ({ ...n })) : [];
        this.edges = Array.isArray(edges) ? edges.map(e => ({ ...e })) : [];
        this.sourceLocations = Array.isArray(sourceLocations) ? sourceLocations.map(l => ({ ...l })) : [];
        this.statements = Array.isArray(statements) ? [...statements] : [];
        this.dependencies = Array.isArray(dependencies) ? [...dependencies] : [];
        this.metadata = { ...metadata };
    }

    containsLine(fileId, line) {
        return this.sourceLocations.some(l => (l.fileId === fileId || l.file === fileId) && l.line === line);
    }

    containsVariable(varName) {
        return this.dependencies.includes(varName) || this.criterion.variable === varName;
    }

    toJSON() {
        return {
            criterion: this.criterion,
            direction: this.direction,
            mode: this.mode,
            nodes: this.nodes,
            edges: this.edges,
            sourceLocations: this.sourceLocations,
            statements: this.statements,
            dependencies: this.dependencies,
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json || typeof json !== 'object') return null;
        return new ProgramSlice(json);
    }
}
