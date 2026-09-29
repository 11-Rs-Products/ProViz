/**
 * ImpactNode — Node in the Universal Impact Graph.
 */

export const IMPACT_NODE_KINDS = Object.freeze({
    FILE: 'FILE',
    MODULE: 'MODULE',
    SYMBOL: 'SYMBOL',
    FUNCTION: 'FUNCTION',
    STATEMENT: 'STATEMENT',
    CFG_NODE: 'CFG_NODE',
    SSA_VALUE: 'SSA_VALUE',
    DATAFLOW_NODE: 'DATAFLOW_NODE',
    TYPE_NODE: 'TYPE_NODE',
    PROPERTY: 'PROPERTY',
    SYMBOLIC_PATH: 'SYMBOLIC_PATH',
    RUNTIME_OBJECT: 'RUNTIME_OBJECT',
    TEST: 'TEST',
    WATCH: 'WATCH',
    MUTATION: 'MUTATION',
    PATCH: 'PATCH',
});

export class ImpactNode {
    /**
     * @param {object} params
     * @param {string} params.id
     * @param {string} params.kind - From IMPACT_NODE_KINDS
     * @param {string} [params.name='']
     * @param {string} [params.entityId='']
     * @param {object} [params.metadata={}]
     */
    constructor({
        id,
        kind = IMPACT_NODE_KINDS.SYMBOL,
        name = '',
        entityId = '',
        metadata = {},
    } = {}) {
        if (!id) throw new Error('ImpactNode requires a non-empty id');
        this.id = String(id);
        this.kind = kind;
        this.name = String(name || id);
        this.entityId = String(entityId || id);
        this.metadata = Object.freeze({ ...metadata });
        Object.freeze(this);
    }

    toJSON() {
        return {
            id: this.id,
            kind: this.kind,
            name: this.name,
            entityId: this.entityId,
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new ImpactNode(json);
    }
}
