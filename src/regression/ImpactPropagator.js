/**
 * ImpactPropagator — Bounded forward and backward impact propagation engine across the ImpactGraph.
 */

export class ImpactPropagator {
    /**
     * Propagate impact from seed change nodes throughout the graph.
     *
     * @param {import('./SemanticChangeSet.js').SemanticChangeSet|Array<string>} changeSetOrSeeds
     * @param {import('./ImpactGraph.js').ImpactGraph} graph
     * @param {object} [options={}]
     * @returns {object} Propagation results containing impacted node map, pathways, and evidence chains
     */
    static propagate(changeSetOrSeeds, graph, options = {}) {
        const maxDepth = Number(options.maxDepth) || 50;
        const maxNodes = Number(options.maxNodes) || 10000;

        // Extract seed node IDs
        const seedIds = new Set();
        if (Array.isArray(changeSetOrSeeds)) {
            for (const item of changeSetOrSeeds) {
                if (typeof item === 'string') seedIds.add(item);
                else if (item?.id) seedIds.add(item.id);
            }
        } else if (changeSetOrSeeds?.changes) {
            for (const c of changeSetOrSeeds.changes) {
                seedIds.add(c.id);
                for (const sym of c.symbolIds) seedIds.add(sym);
                for (const fn of c.functionIds) seedIds.add(fn);
                if (c.fileId) seedIds.add(c.fileId);
            }
        }

        const impacted = new Map(); // nodeId -> { node, depth, path: [], reasons: [], distance: number }
        const queue = [];

        for (const seedId of seedIds) {
            if (graph.hasNode(seedId)) {
                const node = graph.getNode(seedId);
                impacted.set(seedId, {
                    node,
                    depth: 0,
                    distance: 0,
                    path: [seedId],
                    reasons: ['Directly modified seed change'],
                });
                queue.push({ id: seedId, depth: 0, path: [seedId] });
            }
        }

        while (queue.length > 0 && impacted.size < maxNodes) {
            const { id, depth, path } = queue.shift();
            if (depth >= maxDepth) continue;

            const outgoingEdges = graph.getOutgoingEdges(id);

            for (const edge of outgoingEdges) {
                const nextId = edge.toId;
                const nextDepth = depth + 1;

                if (!impacted.has(nextId)) {
                    const nextNode = graph.getNode(nextId);
                    const newPath = [...path, nextId];
                    const reason = `${edge.kind} from ${id} (${edge.evidence || 'dependency'})`;

                    impacted.set(nextId, {
                        node: nextNode,
                        depth: nextDepth,
                        distance: nextDepth,
                        path: newPath,
                        reasons: [reason],
                    });

                    if (impacted.size >= maxNodes) break;
                    queue.push({ id: nextId, depth: nextDepth, path: newPath });
                } else {
                    // Update reasons
                    const existing = impacted.get(nextId);
                    const reason = `${edge.kind} from ${id}`;
                    if (!existing.reasons.includes(reason)) {
                        existing.reasons.push(reason);
                    }
                }
            }
        }

        return {
            seedCount: seedIds.size,
            impactedCount: impacted.size,
            impactedNodes: impacted,
            explain(targetId) {
                const entry = impacted.get(String(targetId));
                if (!entry) return null;
                return {
                    targetId,
                    node: entry.node,
                    depth: entry.depth,
                    path: entry.path,
                    reasons: entry.reasons,
                    explanation: `Entity '${targetId}' impacted via path: ${entry.path.join(' → ')} (${entry.reasons.join('; ')})`,
                };
            },
        };
    }
}
