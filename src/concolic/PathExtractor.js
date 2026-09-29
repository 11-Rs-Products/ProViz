/**
 * PathExtractor — Extracts executed CFG nodes, branch decisions, and path constraints from dynamic execution traces.
 */

import { ConcretePath } from './ConcretePath.js';
import { BranchPredicate } from './BranchPredicate.js';
import { PathConstraintBuilder } from './PathConstraintBuilder.js';

export class PathExtractor {
    /**
     * Extract a ConcretePath from execution observations and CFG.
     * @param {object} params
     * @param {import('../testing/TestObservation.js').TestObservation|object} params.observation
     * @param {import('../analysis/ControlFlowGraph.js').ControlFlowGraph|null} [params.cfg=null]
     * @param {string|null} [params.testCaseId=null]
     * @returns {ConcretePath}
     */
    static extract({ observation, cfg = null, testCaseId = null } = {}) {
        if (!observation) return new ConcretePath();

        const nodeSequence = [];
        const edgeSequence = [];
        const branchDecisions = [];
        const pathConstraints = [];
        const exceptions = observation.exception ? [observation.exception] : [];

        let frames = observation?.frames || [];
        if (frames.length === 0 && cfg) {
            frames = cfg.getNodes ? cfg.getNodes().map(n => ({ line: n.sourceLocations?.[0]?.line, cfgNodeId: n.id })) : [];
        }

        let prevNodeId = null;

        for (let i = 0; i < frames.length; i++) {
            const f = frames[i];
            const line = f.line;
            let cfgNode = null;

            if (cfg) {
                if (f.cfgNodeId && cfg.getNode) {
                    cfgNode = cfg.getNode(f.cfgNodeId);
                }
                if (!cfgNode && line !== undefined && line !== null && cfg.getNodes) {
                    const matched = cfg.getNodes().filter(n => n.sourceLocations?.some(sl => sl.line === line));
                    cfgNode = matched[0] || null;
                }
            }

            const nodeId = cfgNode?.id || f.cfgNodeId || `node_L${line}`;
            nodeSequence.push(nodeId);

            if (prevNodeId && prevNodeId !== nodeId) {
                const edgeId = `${prevNodeId}->${nodeId}`;
                edgeSequence.push(edgeId);
            }

            // Check if node represents a branch decision
            const isConditionNode = cfgNode && (
                cfgNode.type === 'CONDITION' ||
                cfgNode.type === 'LOOP_HEADER' ||
                cfgNode.type === 'BRANCH' ||
                cfgNode.type === 'IF' ||
                Boolean(cfgNode.condition) ||
                Boolean(cfgNode.metadata?.condition) ||
                (cfgNode.label && cfgNode.label.startsWith('if '))
            );

            if (isConditionNode) {
                const isTaken = f.branch ? (f.branch.includes('true') || !f.branch.includes('false')) : true;
                const condText = cfgNode.condition || cfgNode.metadata?.condition || (cfgNode.label?.startsWith('if ') ? cfgNode.label.substring(3) : cfgNode.label) || '';
                const bp = new BranchPredicate({
                    branchId: `${cfgNode.id}_decision`,
                    sourceLocation: cfgNode.sourceLocations?.[0] || { line },
                    condition: condText,
                    concreteValue: isTaken,
                    takenEdge: isTaken ? `${cfgNode.id}_true` : `${cfgNode.id}_false`,
                    alternativeEdge: isTaken ? `${cfgNode.id}_false` : `${cfgNode.id}_true`,
                });
                branchDecisions.push(bp);

                const pc = PathConstraintBuilder.buildFromCFGNode(cfgNode, isTaken, pathConstraints.length);
                if (pc) pathConstraints.push(pc);
            }

            prevNodeId = nodeId;
        }

        return new ConcretePath({
            testCaseId,
            nodeSequence,
            edgeSequence,
            branchDecisions,
            exceptions,
            returnState: observation.returnValue,
            pathConstraints,
        });
    }
}
