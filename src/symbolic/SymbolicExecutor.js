/**
 * SymbolicExecutor — Bounded symbolic interpreter executing over ControlFlowGraphs.
 */

import { SymbolicState } from './SymbolicState.js';
import { SymbolicPath } from './SymbolicPath.js';
import { SymbolicPathGraph } from './SymbolicPathGraph.js';
import { PathConditionBuilder } from './PathConditionBuilder.js';
import { SymbolicTransfer } from './SymbolicTransfer.js';

export class SymbolicExecutor {
    /**
     * @param {object} [config]
     * @param {number} [config.maxPaths=32]
     * @param {number} [config.maxDepth=50]
     * @param {number} [config.timeoutMs=500]
     */
    constructor({ maxPaths = 32, maxDepth = 50, timeoutMs = 500 } = {}) {
        this.maxPaths = maxPaths;
        this.maxDepth = maxDepth;
        this.timeoutMs = timeoutMs;
    }

    /**
     * Execute bounded symbolic paths starting from CFG entry.
     * @param {object} cfg - ControlFlowGraph
     * @param {object} [options]
     * @returns {SymbolicPathGraph}
     */
    execute(cfg, { functionId = '<module>' } = {}) {
        const pathGraph = new SymbolicPathGraph();
        if (!cfg) return pathGraph;
        const entryNode = cfg.getEntry ? cfg.getEntry() : (cfg.entryNode || (cfg.entryNodeId ? cfg.getNode(cfg.entryNodeId) : null));
        if (!entryNode) return pathGraph;

        const startTime = Date.now();
        const rootState = SymbolicTransfer.transferStatement(entryNode, new SymbolicState({ functionId, cfgNodeId: entryNode.id }));
        const queue = [
            {
                nodeIds: [entryNode.id],
                predicates: [],
                state: rootState,
                depth: 0,
            },
        ];

        while (queue.length > 0 && pathGraph.getPaths().length < this.maxPaths) {
            if (Date.now() - startTime > this.timeoutMs) break;

            const current = queue.shift();
            const lastNodeId = current.nodeIds[current.nodeIds.length - 1];
            const node = cfg.getNode(lastNodeId);

            if (!node || node.type === 'EXIT' || node.isTerminal || current.depth >= this.maxDepth) {
                pathGraph.addPath(
                    new SymbolicPath({
                        functionId,
                        nodeIds: current.nodeIds,
                        predicates: current.predicates,
                        finalState: current.state,
                        isFeasible: current.state.isReachable,
                    })
                );
                continue;
            }

            const outgoingEdges = cfg.getOutgoingEdges ? cfg.getOutgoingEdges(node.id) : cfg.getOutgoing(node.id);
            if (!outgoingEdges || outgoingEdges.length === 0) {
                pathGraph.addPath(
                    new SymbolicPath({
                        functionId,
                        nodeIds: current.nodeIds,
                        predicates: current.predicates,
                        finalState: current.state,
                        isFeasible: current.state.isReachable,
                    })
                );
                continue;
            }

            for (const edge of outgoingEdges) {
                const targetId = edge.toId || edge.to;
                let nextState = current.state.withNode(targetId);
                const nextPreds = [...current.predicates];

                if (edge.type === 'TRUE_BRANCH' || edge.conditionValue === true) {
                    const pred = PathConditionBuilder.buildPredicate(node, true);
                    if (pred) {
                        nextPreds.push(pred);
                        nextState = nextState.withConstraint(pred.effectiveConstraint(), pred.toString());
                    }
                } else if (edge.type === 'FALSE_BRANCH' || edge.conditionValue === false) {
                    const pred = PathConditionBuilder.buildPredicate(node, false);
                    if (pred) {
                        nextPreds.push(pred);
                        nextState = nextState.withConstraint(pred.effectiveConstraint(), pred.toString());
                    }
                }

                // Transfer statement assignment
                const targetNode = cfg.getNode(targetId);
                if (targetNode) {
                    nextState = SymbolicTransfer.transferStatement(targetNode, nextState);
                }

                queue.push({
                    nodeIds: [...current.nodeIds, targetId],
                    predicates: nextPreds,
                    state: nextState,
                    depth: current.depth + 1,
                });
            }
        }

        return pathGraph;
    }
}
