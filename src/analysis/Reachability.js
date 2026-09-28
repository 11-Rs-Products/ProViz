/**
 * Reachability — Computes node reachability, unreachable code detection, and branch reachability.
 */

export class Reachability {
    /**
     * Checks if toId is reachable from fromId in the given CFG.
     */
    static isReachable(fromId, toId, cfg, limits = {}) {
        if (!cfg) return false;
        return cfg.isReachable(fromId, toId, limits);
    }

    /**
     * Returns all nodes reachable from startId via forward CFG traversal.
     */
    static getReachableNodes(startId, cfg, { maxNodes = 512, timeoutMs = 200 } = {}) {
        if (!cfg || !cfg.hasNode(startId)) return [];

        const startMs = performance.now();
        const visited = new Set([startId]);
        const queue = [startId];

        while (queue.length > 0 && visited.size < maxNodes) {
            if (performance.now() - startMs > timeoutMs) break;
            const cur = queue.shift();
            const succs = cfg.getSuccessors(cur);

            for (const succ of succs) {
                if (!visited.has(succ.id)) {
                    visited.add(succ.id);
                    queue.push(succ.id);
                }
            }
        }

        return Array.from(visited).map(id => cfg.getNode(id)).filter(Boolean);
    }

    /**
     * Discovers structurally unreachable nodes in a CFG from its Entry node.
     */
    static getUnreachableNodes(cfg) {
        if (!cfg) return [];
        const entry = cfg.getEntry();
        if (!entry) return [];

        const reachable = new Set(this.getReachableNodes(entry.id, cfg).map(n => n.id));
        const allNodes = cfg.getNodes();

        return allNodes.filter(n => !reachable.has(n.id));
    }

    /**
     * Returns all branches reachable from a given condition node.
     */
    static getReachableBranches(nodeId, cfg) {
        if (!cfg || !cfg.hasNode(nodeId)) return [];
        const outgoing = cfg.getOutgoing(nodeId);
        return outgoing.filter(e => e.type === 'TRUE_BRANCH' || e.type === 'FALSE_BRANCH');
    }
}
