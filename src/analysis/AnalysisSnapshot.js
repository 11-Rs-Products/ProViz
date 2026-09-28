/**
 * AnalysisSnapshot — Immutable snapshot of CFG, Dominance, SSA, and static analysis structures.
 */

import { ControlFlowGraph } from './ControlFlowGraph.js';
import { SSAFunction } from './SSAFunction.js';

export class AnalysisSnapshot {
    /**
     * @param {object} params
     * @param {string} [params.functionId='<module>']
     * @param {number} [params.analysisVersion=1]
     * @param {object|null} [params.cfg=null]
     * @param {object|null} [params.ssa=null]
     * @param {object} [params.metadata={}]
     */
    constructor({
        functionId = '<module>',
        analysisVersion = 1,
        cfg = null,
        ssa = null,
        metadata = {},
    } = {}) {
        this.functionId = functionId;
        this.analysisVersion = analysisVersion;
        this.cfg = cfg ? (cfg instanceof ControlFlowGraph ? cfg.toJSON() : cfg) : null;
        this.ssa = ssa ? (ssa instanceof SSAFunction ? ssa.toJSON() : ssa) : null;
        this.graphs = Object.freeze({ cfg: this.cfg, ssa: this.ssa });
        this.metadata = Object.freeze({ ...metadata });
        Object.freeze(this);
    }

    static capture({ cfg, ssa, functionId = '<module>', metadata = {} }) {
        return new AnalysisSnapshot({
            functionId,
            cfg,
            ssa,
            metadata,
        });
    }

    toJSON() {
        return {
            functionId: this.functionId,
            analysisVersion: this.analysisVersion,
            cfg: this.cfg,
            ssa: this.ssa,
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json || typeof json !== 'object') return null;
        return new AnalysisSnapshot(json);
    }
}
