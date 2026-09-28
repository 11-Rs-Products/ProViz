/**
 * DataflowQueries — High-level query engine over the Program Dependency Graph (PDG).
 *
 * Guaranteed Properties:
 *  1. Deterministic Answers: Results depend strictly on the state model and PDG, independent of debugger history.
 *  2. Cyclic-Safe: Graph traversals use visited tracking and bounded recursion depth.
 *  3. Structured Explanations: Explains origins ("Where did this value come from?"), dependents ("What depends on this?"), and watch changes.
 */

export class DataflowQueries {
    /**
     * @param {import('./DataflowGraph.js').DataflowGraph} graph
     */
    constructor(graph) {
        this.graph = graph;
    }

    /**
     * Finds the most recent definition for a variable at or before a specific frame index.
     *
     * @param {string} variableName
     * @param {number} [frameIndex=Infinity]
     * @returns {import('./Definition.js').Definition|null}
     */
    findLastDefinition(variableName, frameIndex = Infinity) {
        const defs = this.graph.getDefinitions(variableName, frameIndex);
        if (defs.length === 0) return null;
        return defs[defs.length - 1];
    }

    /**
     * Finds all definitions for a variable up to a frame index.
     */
    findDefinition(variableName, frameIndex = null) {
        return this.graph.getDefinitions(variableName, frameIndex);
    }

    /**
     * Finds all uses of a variable up to a frame index.
     */
    findUses(variableName, frameIndex = null) {
        return this.graph.getUses(variableName, frameIndex);
    }

    /**
     * "Where did this value come from?"
     * Discovers originating definitions, expressions, and input variables contributing to target.
     *
     * @param {string} target - Variable name or Node ID
     * @param {number} [frameIndex=Infinity]
     * @param {object} [limits]
     * @param {number} [limits.maxDepth=16]
     * @param {number} [limits.maxNodes=64]
     * @returns {{ target: string, frameIndex: number, origins: object[], path: object[], sourceLocations: object[] }}
     */
    findOrigins(target, frameIndex = Infinity, { maxDepth = 16, maxNodes = 64 } = {}) {
        const lastDef = this.findLastDefinition(target, frameIndex);
        const startNode = lastDef?.nodeId ? this.graph.getNode(lastDef.nodeId) : this.graph.getNode(target);

        if (!startNode) {
            return {
                target,
                frameIndex,
                origins: [],
                path: [],
                sourceLocations: [],
            };
        }

        const queue = [{ node: startNode, depth: 0 }];
        const visited = new Set([startNode.id]);
        const pathNodes = [startNode];
        const origins = [];

        while (queue.length > 0) {
            const { node, depth } = queue.shift();
            if (depth >= maxDepth || pathNodes.length >= maxNodes) continue;

            const incoming = this.graph.getIncoming(node.id);
            if (incoming.length === 0) {
                // Leaf producer / origin
                origins.push({
                    id: node.id,
                    type: node.type,
                    label: node.label,
                    value: node.value,
                    sourceLocation: node.sourceLocation,
                    frameIndex: node.frameIndex,
                });
            } else {
                for (const edge of incoming) {
                    const producer = this.graph.getNode(edge.fromId);
                    if (producer && !visited.has(producer.id)) {
                        visited.add(producer.id);
                        pathNodes.push(producer);
                        queue.push({ node: producer, depth: depth + 1 });
                    }
                }
            }
        }

        const sourceLocations = Array.from(new Set(
            pathNodes.map(n => n.sourceLocation ? JSON.stringify(n.sourceLocation) : null).filter(Boolean)
        )).map(s => JSON.parse(s));

        return {
            target,
            frameIndex,
            currentValue: startNode.value,
            origins,
            path: pathNodes.map(n => ({
                id: n.id,
                label: n.label,
                type: n.type,
                frameIndex: n.frameIndex,
                sourceLocation: n.sourceLocation,
            })),
            sourceLocations,
        };
    }

    /**
     * "What depends on this value?"
     * Discovers all downstream variables, expressions, and mutations affected by target.
     *
     * @param {string} target - Variable name or Node ID
     * @param {number} [frameIndex=0]
     * @param {object} [limits]
     * @returns {{ target: string, dependents: object[], sourceLocations: object[] }}
     */
    findDependents(target, frameIndex = 0, { maxDepth = 16, maxNodes = 64 } = {}) {
        const matchingNodes = this.graph.nodesByVariable.get(target) || [];
        const startNode = matchingNodes.find(n => (n.frameIndex ?? 0) >= frameIndex) || this.graph.getNode(target);

        if (!startNode) {
            return { target, dependents: [], sourceLocations: [] };
        }

        const dependentNodes = this.graph.getDependents(startNode.id, { maxDepth, maxNodes });
        const sourceLocations = Array.from(new Set(
            dependentNodes.map(n => n.sourceLocation ? JSON.stringify(n.sourceLocation) : null).filter(Boolean)
        )).map(s => JSON.parse(s));

        return {
            target,
            dependents: dependentNodes.map(n => ({
                id: n.id,
                label: n.label,
                type: n.type,
                frameIndex: n.frameIndex,
                sourceLocation: n.sourceLocation,
                value: n.value,
            })),
            sourceLocations,
        };
    }

    /**
     * Discovers all aliases and variables pointing to an object.
     * @param {string} objectId
     * @param {number} [frameIndex=null]
     * @returns {string[]}
     */
    findAliases(objectId, frameIndex = null) {
        return this.graph.getAliases(objectId, frameIndex);
    }

    /**
     * Retrieves mutations applied to an object across a frame range.
     * @param {string} objectId
     * @param {object} [range]
     * @param {number} [range.fromFrame=0]
     * @param {number} [range.toFrame=Infinity]
     * @returns {import('./MutationRecord.js').MutationRecord[]}
     */
    findMutations(objectId, { fromFrame = 0, toFrame = Infinity } = {}) {
        return this.graph.getMutations(objectId, { fromFrame, toFrame });
    }

    /**
     * Finds the shortest semantic data path between two variables or nodes.
     */
    findDataPath(from, to, limits = {}) {
        const fromNode = this.graph.getNode(from) || (this.graph.nodesByVariable.get(from)?.[0]);
        const toNode = this.graph.getNode(to) || (this.graph.nodesByVariable.get(to)?.[this.graph.nodesByVariable.get(to).length - 1]);

        if (!fromNode || !toNode) {
            return { found: false, nodes: [], edges: [], sourceLocations: [] };
        }

        return this.graph.findPath(fromNode.id, toNode.id, limits);
    }

    /**
     * Computes the complete impact set of a variable or object across the program.
     */
    findImpact(target, frameIndex = null, limits = {}) {
        const dependents = this.findDependents(target, frameIndex ?? 0, limits);
        const aliases = typeof target === 'string' && target.startsWith('obj_') ? this.findAliases(target, frameIndex) : [];
        const mutations = typeof target === 'string' && target.startsWith('obj_') ? this.findMutations(target) : [];

        return {
            target,
            dependents: dependents.dependents,
            aliases,
            mutations,
            affectedLocations: dependents.sourceLocations,
        };
    }

    /**
     * Explains why a watch expression changed value between two frames.
     *
     * @param {object} params
     * @param {string} params.expression - Expression query string
     * @param {number} params.fromFrame
     * @param {number} params.toFrame
     * @param {any} [params.fromValue]
     * @param {any} [params.toValue]
     * @returns {object} Structured explanation
     */
    explainWatchChange({ expression, fromFrame, toFrame, fromValue = null, toValue = null }) {
        // Extract variable dependencies from watch expression
        const varTokens = expression.match(/[a-zA-Z_]\w*/g) || [];
        const relevantDefs = [];
        const relevantMutations = [];

        for (const token of varTokens) {
            const defs = this.graph.getDefinitions(token).filter(d => d.frameIndex > fromFrame && d.frameIndex <= toFrame);
            relevantDefs.push(...defs);
        }

        const mutations = this.graph.getMutations(null, { fromFrame: fromFrame + 1, toFrame });
        relevantMutations.push(...mutations);

        const sourceLocations = [
            ...relevantDefs.map(d => d.sourceLocation).filter(Boolean),
            ...relevantMutations.map(m => m.sourceLocation).filter(Boolean),
        ];

        const isChanged = fromValue !== null || toValue !== null
            ? JSON.stringify(fromValue) !== JSON.stringify(toValue)
            : (relevantDefs.length > 0 || relevantMutations.length > 0);

        return {
            expression,
            fromFrame,
            toFrame,
            fromValue,
            toValue,
            changed: isChanged,
            relevantDefinitions: relevantDefs,
            relevantMutations,
            sourceLocations,
            summary: `Watch '${expression}' changed between frame ${fromFrame} and ${toFrame} due to ${relevantDefs.length} definition(s) and ${relevantMutations.length} mutation(s).`,
        };
    }
}
