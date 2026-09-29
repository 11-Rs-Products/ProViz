/**
 * SymbolicState — Encapsulates the symbolic environment, active constraints, and path conditions at a CFG location.
 */

import { SymbolicEnvironment } from './SymbolicEnvironment.js';
import { ConstraintSet } from './ConstraintSet.js';

export class SymbolicState {
    /**
     * @param {object} params
     * @param {string} [params.id]
     * @param {string} [params.functionId]
     * @param {string|null} [params.cfgNodeId]
     * @param {SymbolicEnvironment|object} [params.environment]
     * @param {ConstraintSet|Array} [params.constraints]
     * @param {Array<string>} [params.pathConditions]
     * @param {boolean} [params.isReachable=true]
     * @param {object} [params.metadata]
     */
    constructor({
        id = null,
        functionId = '<module>',
        cfgNodeId = null,
        environment = new SymbolicEnvironment(),
        constraints = new ConstraintSet(),
        pathConditions = [],
        isReachable = true,
        metadata = {},
    } = {}) {
        this.functionId = String(functionId || '<module>');
        this.cfgNodeId = cfgNodeId;
        this.environment = environment instanceof SymbolicEnvironment ? environment : SymbolicEnvironment.fromJSON(environment);
        this.constraints = constraints instanceof ConstraintSet ? constraints : new ConstraintSet(constraints);
        this.pathConditions = Object.freeze([...pathConditions]);
        this.isReachable = Boolean(isReachable && this.constraints.isSatisfiable());
        this.metadata = Object.freeze({ ...metadata });

        const condStr = this.pathConditions.join(' && ');
        this.id = id || `symstate_${this.functionId}_${this.cfgNodeId || 'entry'}_${SymbolicState.computeHash(condStr)}`;
        Object.freeze(this);
    }

    static computeHash(str) {
        let hash = 5381;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) + hash) + str.charCodeAt(i);
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16);
    }

    withBinding(name, expr) {
        const nextEnv = this.environment.set(name, expr);
        return new SymbolicState({
            functionId: this.functionId,
            cfgNodeId: this.cfgNodeId,
            environment: nextEnv,
            constraints: this.constraints,
            pathConditions: this.pathConditions,
            isReachable: this.isReachable,
            metadata: this.metadata,
        });
    }

    withConstraint(constraint, conditionText = '') {
        const nextCst = this.constraints.union(new ConstraintSet([constraint]));
        const nextConds = conditionText ? [...this.pathConditions, conditionText] : this.pathConditions;
        return new SymbolicState({
            functionId: this.functionId,
            cfgNodeId: this.cfgNodeId,
            environment: this.environment,
            constraints: nextCst,
            pathConditions: nextConds,
            isReachable: this.isReachable && nextCst.isSatisfiable(),
            metadata: this.metadata,
        });
    }

    withNode(cfgNodeId) {
        return new SymbolicState({
            functionId: this.functionId,
            cfgNodeId,
            environment: this.environment,
            constraints: this.constraints,
            pathConditions: this.pathConditions,
            isReachable: this.isReachable,
            metadata: this.metadata,
        });
    }

    toJSON() {
        return {
            id: this.id,
            functionId: this.functionId,
            cfgNodeId: this.cfgNodeId,
            environment: this.environment.toJSON(),
            constraints: this.constraints.toJSON(),
            pathConditions: this.pathConditions,
            isReachable: this.isReachable,
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new SymbolicState({
            ...json,
            environment: SymbolicEnvironment.fromJSON(json.environment),
            constraints: ConstraintSet.fromJSON(json.constraints),
        });
    }
}
