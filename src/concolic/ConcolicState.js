/**
 * ConcolicState — Immutable snapshot of combined concrete and symbolic execution state.
 */

import { ConcolicEnvironment } from './ConcolicEnvironment.js';

export class ConcolicState {
    /**
     * @param {object} params
     * @param {number} [params.frameIndex=0]
     * @param {string} [params.pathId='path_0']
     * @param {ConcolicEnvironment|object} [params.environment]
     * @param {Array<string>} [params.pathConditions=[]]
     * @param {Array<object>} [params.branchHistory=[]]
     * @param {string} [params.status='RUNNING']
     * @param {object} [params.metadata={}]
     */
    constructor({
        frameIndex = 0,
        pathId = 'path_0',
        environment = new ConcolicEnvironment(),
        pathConditions = [],
        branchHistory = [],
        status = 'RUNNING',
        metadata = {},
    } = {}) {
        this.frameIndex = Number(frameIndex) || 0;
        this.pathId = String(pathId);
        this.environment = environment instanceof ConcolicEnvironment ? environment : ConcolicEnvironment.fromJSON(environment);
        this.pathConditions = Object.freeze([...pathConditions]);
        this.branchHistory = Object.freeze([...branchHistory]);
        this.status = status;
        this.metadata = Object.freeze({ ...metadata });
        Object.freeze(this);
    }

    toJSON() {
        return {
            frameIndex: this.frameIndex,
            pathId: this.pathId,
            environment: this.environment.toJSON(),
            pathConditions: this.pathConditions,
            branchHistory: this.branchHistory,
            status: this.status,
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json) return new ConcolicState();
        return new ConcolicState({
            frameIndex: json.frameIndex,
            pathId: json.pathId,
            environment: ConcolicEnvironment.fromJSON(json.environment),
            pathConditions: json.pathConditions,
            branchHistory: json.branchHistory,
            status: json.status,
            metadata: json.metadata,
        });
    }
}
