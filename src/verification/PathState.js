/**
 * PathState — Immutable abstract state traversing a specific program path.
 */

import { PathCondition } from './PathCondition.js';
import { RangeValue } from './RangeValue.js';

export class PathState {
    /**
     * @param {object} params
     * @param {string} [params.id]
     * @param {string} [params.functionId]
     * @param {string} [params.cfgNodeId]
     * @param {Array<PathCondition>} [params.pathConditions]
     * @param {Map<string, RangeValue>|object} [params.rangeEnv]
     * @param {object} [params.typeEnv]
     * @param {boolean} [params.isReachable=true]
     * @param {object} [params.originInfo]
     */
    constructor({
        id = null,
        functionId = '<module>',
        cfgNodeId = null,
        pathConditions = [],
        rangeEnv = new Map(),
        typeEnv = null,
        isReachable = true,
        originInfo = {},
    } = {}) {
        this.functionId = String(functionId || '<module>');
        this.cfgNodeId = cfgNodeId;
        this.pathConditions = Object.freeze([...pathConditions]);
        this.rangeEnv = rangeEnv instanceof Map ? new Map(rangeEnv) : new Map(Object.entries(rangeEnv || {}));
        this.typeEnv = typeEnv;
        this.isReachable = Boolean(isReachable);
        this.originInfo = Object.freeze({ ...originInfo });

        const condStr = this.pathConditions.map(c => c.toString()).join(' && ');
        this.id = id || `pstate_${this.functionId}_${this.cfgNodeId || 'entry'}_${PathState.computeHash(condStr)}`;

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

    getRange(variable) {
        return this.rangeEnv.get(variable) || RangeValue.unknown();
    }

    withRange(variable, range) {
        const nextEnv = new Map(this.rangeEnv);
        nextEnv.set(variable, range);
        return new PathState({
            functionId: this.functionId,
            cfgNodeId: this.cfgNodeId,
            pathConditions: this.pathConditions,
            rangeEnv: nextEnv,
            typeEnv: this.typeEnv,
            isReachable: this.isReachable && !range.isEmpty,
            originInfo: this.originInfo,
        });
    }

    withCondition(condition) {
        const cond = condition instanceof PathCondition ? condition : new PathCondition(condition);
        const nextConds = [...this.pathConditions, cond];
        const nextEnv = new Map(this.rangeEnv);

        let reachable = this.isReachable;
        if (cond.subject) {
            const currentRange = this.getRange(cond.subject);
            const refined = cond.applyToRange(currentRange);
            nextEnv.set(cond.subject, refined);
            if (refined.isEmpty) {
                reachable = false;
            }
        }

        return new PathState({
            functionId: this.functionId,
            cfgNodeId: this.cfgNodeId,
            pathConditions: nextConds,
            rangeEnv: nextEnv,
            typeEnv: this.typeEnv,
            isReachable: reachable,
            originInfo: this.originInfo,
        });
    }

    withNode(cfgNodeId) {
        return new PathState({
            functionId: this.functionId,
            cfgNodeId: cfgNodeId,
            pathConditions: this.pathConditions,
            rangeEnv: this.rangeEnv,
            typeEnv: this.typeEnv,
            isReachable: this.isReachable,
            originInfo: this.originInfo,
        });
    }

    toJSON() {
        const rangeObj = {};
        for (const [k, v] of this.rangeEnv.entries()) {
            rangeObj[k] = v.toJSON();
        }
        return {
            id: this.id,
            functionId: this.functionId,
            cfgNodeId: this.cfgNodeId,
            pathConditions: this.pathConditions.map(c => c.toJSON()),
            rangeEnv: rangeObj,
            isReachable: this.isReachable,
            originInfo: this.originInfo,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        const rangeEnv = new Map();
        if (json.rangeEnv) {
            for (const [k, v] of Object.entries(json.rangeEnv)) {
                rangeEnv.set(k, RangeValue.fromJSON(v));
            }
        }
        return new PathState({
            ...json,
            pathConditions: (json.pathConditions || []).map(c => PathCondition.fromJSON(c)),
            rangeEnv,
        });
    }
}
