/**
 * SymbolicStateJoin — Joins symbolic states across merging CFG branches.
 */

import { SymbolicState } from './SymbolicState.js';
import { SymbolicExpression } from './SymbolicExpression.js';
import { SymbolicEnvironment } from './SymbolicEnvironment.js';

export class SymbolicStateJoin {
    /**
     * Join two symbolic states at a CFG branch merge.
     * @param {SymbolicState} leftState
     * @param {SymbolicState} rightState
     * @param {SymbolicExpression|null} [branchCondition=null]
     * @returns {SymbolicState}
     */
    static join(leftState, rightState, branchCondition = null) {
        if (!leftState || !leftState.isReachable) return rightState;
        if (!rightState || !rightState.isReachable) return leftState;

        const nextEnv = leftState.environment;
        const leftBindings = leftState.environment.getAllBindings();
        const rightBindings = rightState.environment.getAllBindings();

        const mergedEnv = new Map(leftBindings);

        for (const [varName, rExpr] of rightBindings.entries()) {
            if (!mergedEnv.has(varName)) {
                mergedEnv.set(varName, rExpr);
            } else {
                const lExpr = mergedEnv.get(varName);
                if (!lExpr.equals(rExpr)) {
                    if (branchCondition) {
                        mergedEnv.set(varName, SymbolicExpression.ite(branchCondition, lExpr, rExpr));
                    }
                }
            }
        }

        const sharedConstraints = leftState.constraints.intersection(rightState.constraints);

        return new SymbolicState({
            functionId: leftState.functionId,
            cfgNodeId: leftState.cfgNodeId,
            environment: new SymbolicEnvironment(mergedEnv),
            constraints: sharedConstraints,
            pathConditions: [],
            isReachable: leftState.isReachable || rightState.isReachable,
        });
    }
}
