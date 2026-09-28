/**
 * ControlFlowGraph — Canonical container and query interface for a function/module CFG.
 */

import { ControlFlowNode, CFG_NODE_TYPES } from './ControlFlowNode.js';
import { ControlFlowEdge, CFG_EDGE_TYPES } from './ControlFlowEdge.js';
import { BasicBlock } from './BasicBlock.js';

export class ControlFlowGraph {
    /**
     * @param {object} [params]
     * @param {string} [params.functionId='<module>']
     * @param {string} [params.moduleId='main']
     * @param {string} [params.fileId='main.py']
     */
    constructor({ functionId = '<module>', moduleId = 'main', fileId = 'main.py' } = {}) {
        this.functionId = functionId;
        this.moduleId = moduleId;
        this.fileId = fileId;

        this.nodes = new Map(); // id -> ControlFlowNode
        this.edges = new Map(); // id -> ControlFlowEdge
        this.basicBlocks = new Map(); // id -> BasicBlock

        this.incomingEdges = new Map(); // nodeId -> Set<edgeId>
        this.outgoingEdges = new Map(); // nodeId -> Set<edgeId>

        this.entryNodeId = null;
        this.exitNodeId = null;
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Node Management
    // ─────────────────────────────────────────────────────────────────────────────

    addNode(node) {
        if (!node || !node.id) return node;
        const cfgNode = node instanceof ControlFlowNode ? node : new ControlFlowNode(node);
        this.nodes.set(cfgNode.id, cfgNode);

        if (!this.incomingEdges.has(cfgNode.id)) this.incomingEdges.set(cfgNode.id, new Set());
        if (!this.outgoingEdges.has(cfgNode.id)) this.outgoingEdges.set(cfgNode.id, new Set());

        if (cfgNode.type === CFG_NODE_TYPES.ENTRY || cfgNode.type === CFG_NODE_TYPES.FUNCTION_ENTRY) {
            this.entryNodeId = cfgNode.id;
        } else if (cfgNode.type === CFG_NODE_TYPES.EXIT || cfgNode.type === CFG_NODE_TYPES.FUNCTION_EXIT) {
            this.exitNodeId = cfgNode.id;
        }

        return cfgNode;
    }

    getNode(id) {
        return this.nodes.get(id) || null;
    }

    hasNode(id) {
        return this.nodes.has(id);
    }

    getNodes() {
        return Array.from(this.nodes.values());
    }

    getEntry() {
        return this.entryNodeId ? this.nodes.get(this.entryNodeId) : null;
    }

    getExit() {
        return this.exitNodeId ? this.nodes.get(this.exitNodeId) : null;
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Edge Management
    // ─────────────────────────────────────────────────────────────────────────────

    addEdge(edge) {
        if (!edge) return null;
        const cfgEdge = edge instanceof ControlFlowEdge ? edge : new ControlFlowEdge(edge);
        this.edges.set(cfgEdge.id, cfgEdge);

        if (!this.outgoingEdges.has(cfgEdge.fromId)) this.outgoingEdges.set(cfgEdge.fromId, new Set());
        if (!this.incomingEdges.has(cfgEdge.toId)) this.incomingEdges.set(cfgEdge.toId, new Set());

        this.outgoingEdges.get(cfgEdge.fromId).add(cfgEdge.id);
        this.incomingEdges.get(cfgEdge.toId).add(cfgEdge.id);

        return cfgEdge;
    }

    getEdge(id) {
        return this.edges.get(id) || null;
    }

    hasEdge(id) {
        return this.edges.has(id);
    }

    getEdges() {
        return Array.from(this.edges.values());
    }

    getIncoming(nodeId) {
        const edgeIds = this.incomingEdges.get(nodeId);
        if (!edgeIds) return [];
        return Array.from(edgeIds).map(id => this.edges.get(id)).filter(Boolean);
    }

    getOutgoing(nodeId) {
        const edgeIds = this.outgoingEdges.get(nodeId);
        if (!edgeIds) return [];
        return Array.from(edgeIds).map(id => this.edges.get(id)).filter(Boolean);
    }

    getPredecessors(nodeId) {
        return this.getIncoming(nodeId).map(e => this.getNode(e.fromId)).filter(Boolean);
    }

    getSuccessors(nodeId) {
        return this.getOutgoing(nodeId).map(e => this.getNode(e.toId)).filter(Boolean);
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Basic Blocks
    // ─────────────────────────────────────────────────────────────────────────────

    addBasicBlock(block) {
        if (!block || !block.id) return block;
        const bb = block instanceof BasicBlock ? block : new BasicBlock(block);
        this.basicBlocks.set(bb.id, bb);
        return bb;
    }

    getBasicBlock(id) {
        return this.basicBlocks.get(id) || null;
    }

    getBasicBlocks() {
        return Array.from(this.basicBlocks.values());
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Structural Queries
    // ─────────────────────────────────────────────────────────────────────────────

    getBackEdges() {
        return Array.from(this.edges.values()).filter(e => e.type === CFG_EDGE_TYPES.LOOP_BACK);
    }

    getBranches() {
        return Array.from(this.edges.values()).filter(e => e.type === CFG_EDGE_TYPES.TRUE_BRANCH || e.type === CFG_EDGE_TYPES.FALSE_BRANCH);
    }

    getReturns() {
        return Array.from(this.edges.values()).filter(e => e.type === CFG_EDGE_TYPES.RETURN);
    }

    getExceptionEdges() {
        return Array.from(this.edges.values()).filter(e => e.type === CFG_EDGE_TYPES.EXCEPTION);
    }

    getLoops() {
        const backEdges = this.getBackEdges();
        return backEdges.map(be => ({
            headerNodeId: be.toId,
            latchNodeId: be.fromId,
            backEdge: be,
        }));
    }

    /**
     * Finds the shortest control flow path from fromId to toId.
     */
    findPath(fromId, toId, { maxDepth = 64, timeoutMs = 200 } = {}) {
        const startMs = performance.now();
        if (!this.hasNode(fromId) || !this.hasNode(toId)) {
            return { found: false, nodes: [], edges: [] };
        }

        if (fromId === toId) {
            return { found: true, nodes: [this.getNode(fromId)], edges: [] };
        }

        const queue = [{ nodeId: fromId, pathNodes: [fromId], pathEdges: [] }];
        const visited = new Set([fromId]);

        while (queue.length > 0) {
            if (performance.now() - startMs > timeoutMs) break;
            const current = queue.shift();

            if (current.pathNodes.length > maxDepth) continue;

            const outgoing = this.getOutgoing(current.nodeId);
            for (const edge of outgoing) {
                const nextId = edge.toId;
                if (nextId === toId) {
                    const nodes = [...current.pathNodes, nextId].map(id => this.getNode(id)).filter(Boolean);
                    const edges = [...current.pathEdges, edge.id].map(id => this.getEdge(id)).filter(Boolean);
                    return { found: true, nodes, edges };
                }

                if (!visited.has(nextId)) {
                    visited.add(nextId);
                    queue.push({
                        nodeId: nextId,
                        pathNodes: [...current.pathNodes, nextId],
                        pathEdges: [...current.pathEdges, edge.id],
                    });
                }
            }
        }

        return { found: false, nodes: [], edges: [] };
    }

    isReachable(fromId, toId, limits = {}) {
        return this.findPath(fromId, toId, limits).found;
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Serialization
    // ─────────────────────────────────────────────────────────────────────────────

    toJSON() {
        return {
            functionId: this.functionId,
            moduleId: this.moduleId,
            fileId: this.fileId,
            entryNodeId: this.entryNodeId,
            exitNodeId: this.exitNodeId,
            nodes: Array.from(this.nodes.values()).map(n => n.toJSON()),
            edges: Array.from(this.edges.values()).map(e => e.toJSON()),
            basicBlocks: Array.from(this.basicBlocks.values()).map(b => b.toJSON()),
        };
    }

    static fromJSON(json) {
        if (!json || typeof json !== 'object') return null;
        const cfg = new ControlFlowGraph({
            functionId: json.functionId,
            moduleId: json.moduleId,
            fileId: json.fileId,
        });

        if (Array.isArray(json.nodes)) {
            json.nodes.forEach(n => cfg.addNode(ControlFlowNode.fromJSON(n)));
        }
        if (Array.isArray(json.edges)) {
            json.edges.forEach(e => cfg.addEdge(ControlFlowEdge.fromJSON(e)));
        }
        if (Array.isArray(json.basicBlocks)) {
            json.basicBlocks.forEach(b => cfg.addBasicBlock(BasicBlock.fromJSON(b)));
        }

        cfg.entryNodeId = json.entryNodeId || null;
        cfg.exitNodeId = json.exitNodeId || null;

        return cfg;
    }
}
