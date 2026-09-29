/**
 * ExplorationGraph — Comprehensive graph recording all visited paths, branches, and negations.
 */

import { ExplorationNode, EXPLORATION_NODE_KINDS } from './ExplorationNode.js';
import { ExplorationEdge, EXPLORATION_EDGE_KINDS } from './ExplorationEdge.js';

export class ExplorationGraph {
    constructor() {
        this.nodes = new Map();
        this.edges = new Map();
        this.unexploredBranches = new Set();
        this.exploredPaths = new Set();
    }

    addNode(node) {
        if (!node) return null;
        const n = node instanceof ExplorationNode ? node : new ExplorationNode(node);
        this.nodes.set(n.id, n);
        return n;
    }

    addEdge(edge) {
        if (!edge) return null;
        const e = edge instanceof ExplorationEdge ? edge : new ExplorationEdge(edge);
        this.edges.set(e.id, e);
        return e;
    }

    addPath(concretePath) {
        if (!concretePath) return;
        this.exploredPaths.add(concretePath.pathId);

        const pathNode = this.addNode(new ExplorationNode({
            id: concretePath.pathId,
            kind: concretePath.exceptions.length > 0 ? EXPLORATION_NODE_KINDS.EXCEPTION : EXPLORATION_NODE_KINDS.PATH,
            pathId: concretePath.pathId,
        }));

        for (const bp of concretePath.branchDecisions) {
            const branchNode = this.addNode(new ExplorationNode({
                id: bp.branchId,
                kind: EXPLORATION_NODE_KINDS.BRANCH,
                branchId: bp.branchId,
            }));
            this.addEdge(new ExplorationEdge({
                fromId: pathNode.id,
                toId: branchNode.id,
                kind: EXPLORATION_EDGE_KINDS.EXECUTED,
            }));
        }
    }

    markUnexploredBranch(branchId) {
        this.unexploredBranches.add(String(branchId));
    }

    markExploredBranch(branchId) {
        this.unexploredBranches.delete(String(branchId));
    }

    getUnexploredBranches() {
        return Array.from(this.unexploredBranches);
    }

    getNodes() {
        return Array.from(this.nodes.values());
    }

    getEdges() {
        return Array.from(this.edges.values());
    }

    toJSON() {
        return {
            nodes: this.getNodes().map(n => n.toJSON()),
            edges: this.getEdges().map(e => e.toJSON()),
            unexploredBranches: this.getUnexploredBranches(),
            exploredPaths: Array.from(this.exploredPaths),
        };
    }

    static fromJSON(json) {
        const graph = new ExplorationGraph();
        if (!json) return graph;
        for (const n of json.nodes || []) graph.addNode(ExplorationNode.fromJSON(n));
        for (const e of json.edges || []) graph.addEdge(ExplorationEdge.fromJSON(e));
        for (const ub of json.unexploredBranches || []) graph.unexploredBranches.add(ub);
        for (const ep of json.exploredPaths || []) graph.exploredPaths.add(ep);
        return graph;
    }
}
