/**
 * PathExplorer — Bounded abstract path exploration through CFG structures.
 */

import { PathState } from './PathState.js';
import { PathCondition } from './PathCondition.js';
import { RangeValue } from './RangeValue.js';

export class PathExplorer {
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
     * Explore feasible abstract paths starting from CFG entry.
     * @param {object} cfg - ControlFlowGraph
     * @param {object} [options]
     * @returns {Array<PathState>}
     */
    explorePaths(cfg, { functionId = '<module>', initialRangeEnv = new Map() } = {}) {
        if (!cfg || !cfg.entryNode) return [];

        const startTime = Date.now();
        const completedPaths = [];
        const queue = [
            {
                state: new PathState({
                    functionId,
                    cfgNodeId: cfg.entryNode.id,
                    rangeEnv: initialRangeEnv,
                }),
                depth: 0,
            },
        ];

        while (queue.length > 0 && completedPaths.length < this.maxPaths) {
            if (Date.now() - startTime > this.timeoutMs) break;

            const { state, depth } = queue.shift();
            if (depth > this.maxDepth) {
                completedPaths.push(state);
                continue;
            }

            const currentNode = cfg.getNode(state.cfgNodeId);
            if (!currentNode || currentNode.type === 'EXIT' || currentNode.isTerminal) {
                completedPaths.push(state);
                continue;
            }

            const outgoingEdges = cfg.getOutgoingEdges(currentNode.id);
            if (outgoingEdges.length === 0) {
                completedPaths.push(state);
                continue;
            }

            for (const edge of outgoingEdges) {
                let nextState = state.withNode(edge.to);

                // Branch condition narrowing
                if (edge.type === 'TRUE_BRANCH' || edge.conditionValue === true) {
                    const cond = this.extractPathCondition(currentNode, false);
                    if (cond) nextState = nextState.withCondition(cond);
                } else if (edge.type === 'FALSE_BRANCH' || edge.conditionValue === false) {
                    const cond = this.extractPathCondition(currentNode, true);
                    if (cond) nextState = nextState.withCondition(cond);
                }

                // Process statement definition ranges if simple assignment
                if (currentNode.statement) {
                    nextState = this.applyStatement(currentNode.statement, nextState);
                }

                if (nextState.isReachable) {
                    queue.push({ state: nextState, depth: depth + 1 });
                }
            }
        }

        return completedPaths;
    }

    extractPathCondition(node, isNegated = false) {
        if (!node) return null;
        const expr = node.condition || node.statement?.expression || node.expression || '';
        const exprStr = typeof expr === 'string' ? expr : (expr.source || expr.raw || '');

        const noneMatch = exprStr.match(/^([a-zA-Z_]\w*)\s+is\s+None$/);
        if (noneMatch) {
            const cond = PathCondition.isNone(noneMatch[1], node.sourceLocation);
            return isNegated ? cond.negate() : cond;
        }

        const notNoneMatch = exprStr.match(/^([a-zA-Z_]\w*)\s+is\s+not\s+None$/);
        if (notNoneMatch) {
            const cond = PathCondition.isNotNone(notNoneMatch[1], node.sourceLocation);
            return isNegated ? cond.negate() : cond;
        }

        const cmpMatch = exprStr.match(/^([a-zA-Z_]\w*)\s*(==|!=|<=|>=|<|>)\s*(-?\d+(?:\.\d+)?)$/);
        if (cmpMatch) {
            const subject = cmpMatch[1];
            const op = cmpMatch[2];
            const val = Number(cmpMatch[3]);
            const cond = PathCondition.comparison(subject, op, val, node.sourceLocation);
            return isNegated ? cond.negate() : cond;
        }

        const varMatch = exprStr.match(/^([a-zA-Z_]\w*)$/);
        if (varMatch) {
            const cond = PathCondition.truthy(varMatch[1], node.sourceLocation);
            return isNegated ? cond.negate() : cond;
        }

        return null;
    }

    applyStatement(stmt, state) {
        if (!stmt) return state;
        const target = stmt.target || stmt.variable;
        const raw = stmt.expression || stmt.value || stmt.raw || '';
        if (!target || typeof target !== 'string') return state;

        // Number literal
        if (typeof raw === 'number' || /^-?\d+(?:\.\d+)?$/.test(String(raw).trim())) {
            const num = Number(raw);
            return state.withRange(target, RangeValue.exact(num));
        }

        // Binary operation like x + 1, x - 1
        const binMatch = String(raw).trim().match(/^([a-zA-Z_]\w*)\s*([\+\-\*\/])\s*(-?\d+(?:\.\d+)?)$/);
        if (binMatch) {
            const leftVar = binMatch[1];
            const op = binMatch[2];
            const rightNum = Number(binMatch[3]);
            const leftRange = state.getRange(leftVar);
            const rightRange = RangeValue.exact(rightNum);

            let resRange = RangeValue.unknown();
            if (op === '+') resRange = leftRange.add(rightRange);
            else if (op === '-') resRange = leftRange.sub(rightRange);
            else if (op === '*') resRange = leftRange.mul(rightRange);
            else if (op === '/') resRange = leftRange.div(rightRange);

            return state.withRange(target, resRange);
        }

        return state;
    }
}
