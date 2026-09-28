/**
 * DataflowSnapshot — Immutable historical snapshot of dataflow state at a specific timeline frame.
 */

export class DataflowSnapshot {
    /**
     * @param {object} params
     * @param {number} params.frameIndex - Timeline frame index
     * @param {Array} [params.definitions] - Active definitions at this frame
     * @param {Array} [params.uses] - Uses up to this frame
     * @param {Array} [params.aliases] - Active alias mappings at this frame
     * @param {Array} [params.mutations] - Mutations up to this frame
     * @param {number} [params.graphVersion] - Version sequence
     * @param {object} [params.metadata]
     */
    constructor({
        frameIndex = 0,
        definitions = [],
        uses = [],
        aliases = [],
        mutations = [],
        graphVersion = 1,
        metadata = {},
    }) {
        this.frameIndex = frameIndex;
        this.definitions = Object.freeze(definitions.map(d => ({ ...d })));
        this.uses = Object.freeze(uses.map(u => ({ ...u })));
        this.aliases = Object.freeze(aliases.map(a => ({ ...a })));
        this.mutations = Object.freeze(mutations.map(m => ({ ...m })));
        this.graphVersion = graphVersion;
        this.metadata = Object.freeze({ ...metadata });
        Object.freeze(this);
    }

    /**
     * Captures a DataflowSnapshot from a DataflowGraph at a specific frame index.
     *
     * @param {import('./DataflowGraph.js').DataflowGraph} graph
     * @param {number} frameIndex
     * @param {object} [metadata]
     * @returns {DataflowSnapshot}
     */
    static capture(graph, frameIndex = 0, metadata = {}) {
        if (!graph) {
            return new DataflowSnapshot({ frameIndex, metadata });
        }

        const definitions = graph.getDefinitions(null, frameIndex).map(d => d.toJSON());
        const uses = graph.getUses(null, frameIndex).map(u => u.toJSON());
        const mutations = graph.getMutations(null, { fromFrame: 0, toFrame: frameIndex }).map(m => m.toJSON());

        const aliases = [];
        for (const [objId, aliasSet] of graph.aliasSets.entries()) {
            const vars = aliasSet.getVariables(frameIndex);
            if (vars.length > 0) {
                aliases.push({ objectId: objId, variables: vars });
            }
        }

        return new DataflowSnapshot({
            frameIndex,
            definitions,
            uses,
            aliases,
            mutations,
            graphVersion: 1,
            metadata,
        });
    }

    /**
     * Computes the semantic diff between two historical dataflow snapshots.
     *
     * @param {DataflowSnapshot} other
     * @returns {{ newDefinitions: any[], newMutations: any[], newUses: any[] }}
     */
    diff(other) {
        if (!other || !(other instanceof DataflowSnapshot)) {
            return {
                newDefinitions: this.definitions,
                newMutations: this.mutations,
                newUses: this.uses,
            };
        }

        const prevDefIds = new Set(other.definitions.map(d => d.id));
        const newDefinitions = this.definitions.filter(d => !prevDefIds.has(d.id));

        const prevMutIds = new Set(other.mutations.map(m => m.id));
        const newMutations = this.mutations.filter(m => !prevMutIds.has(m.id));

        const prevUseIds = new Set(other.uses.map(u => u.id));
        const newUses = this.uses.filter(u => !prevUseIds.has(u.id));

        return {
            fromFrame: other.frameIndex,
            toFrame: this.frameIndex,
            newDefinitions,
            newMutations,
            newUses,
        };
    }

    toJSON() {
        return {
            frameIndex: this.frameIndex,
            definitions: Array.from(this.definitions),
            uses: Array.from(this.uses),
            aliases: Array.from(this.aliases),
            mutations: Array.from(this.mutations),
            graphVersion: this.graphVersion,
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json || typeof json !== 'object') return null;
        return new DataflowSnapshot(json);
    }
}
