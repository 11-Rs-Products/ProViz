/**
 * TypeState — Abstract program state at a specific CFG point.
 */

import { TypeEnvironment } from './TypeEnvironment.js';

export class TypeState {
    /**
     * @param {object} params
     * @param {string} params.nodeId
     * @param {TypeEnvironment} [params.inEnv]
     * @param {TypeEnvironment} [params.outEnv]
     * @param {boolean} [params.reachable=true]
     * @param {Array<import('./TypeDiagnostics.js').TypeDiagnostic>} [params.diagnostics=[]]
     */
    constructor({
        nodeId,
        inEnv = null,
        outEnv = null,
        reachable = true,
        diagnostics = [],
    }) {
        this.nodeId = nodeId;
        this.inEnv = inEnv instanceof TypeEnvironment ? inEnv : new TypeEnvironment();
        this.outEnv = outEnv instanceof TypeEnvironment ? outEnv : new TypeEnvironment();
        this.reachable = reachable;
        this.diagnostics = Array.isArray(diagnostics) ? diagnostics : [];
    }

    toJSON() {
        return {
            nodeId: this.nodeId,
            inEnv: this.inEnv.toJSON(),
            outEnv: this.outEnv.toJSON(),
            reachable: this.reachable,
            diagnostics: this.diagnostics.map(d => d.toJSON ? d.toJSON() : d),
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new TypeState({
            nodeId: json.nodeId,
            inEnv: TypeEnvironment.fromJSON(json.inEnv),
            outEnv: TypeEnvironment.fromJSON(json.outEnv),
            reachable: json.reachable,
            diagnostics: json.diagnostics || [],
        });
    }
}
