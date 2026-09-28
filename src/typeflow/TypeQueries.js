/**
 * TypeQueries — Unified query API for static types, abstract values, shapes, and explanations.
 */

import { AbstractValue, VALUE_CONFIDENCE } from './AbstractValue.js';
import { TypeExplanation } from './TypeExplanation.js';

export class TypeQueries {
    /**
     * @param {object} params
     * @param {import('./TypeInference.js').TypeInference} params.inference
     * @param {import('../analysis/ControlFlowGraph.js').ControlFlowGraph} [params.cfg]
     * @param {import('./TypeFlowGraph.js').TypeFlowGraph} [params.typeFlowGraph]
     */
    constructor({ inference, cfg = null, typeFlowGraph = null }) {
        this.inference = inference;
        this.cfg = cfg || inference?.cfg;
        this.typeFlowGraph = typeFlowGraph || inference?.typeFlowGraph;
    }

    getAbstractValue(target, nodeId = null) {
        if (!this.inference) return AbstractValue.unknown();

        // 1. If nodeId specified, check node's outEnv / inEnv
        if (nodeId && this.inference.nodeStates.has(nodeId)) {
            const state = this.inference.nodeStates.get(nodeId);
            const val = state.outEnv.get(target) || state.inEnv.get(target);
            if (val) return val;
        }

        // 2. Fast O(1) global / function-level bindings index
        if (!nodeId && this.inference.latestBindings?.has(target)) {
            return this.inference.latestBindings.get(target);
        }

        // 3. Check exit state of the CFG (which accumulates merged branch states)
        const exitNode = this.cfg?.getExit();
        if (exitNode && this.inference.nodeStates.has(exitNode.id)) {
            const exitState = this.inference.nodeStates.get(exitNode.id);
            const val = exitState.inEnv.get(target) || exitState.outEnv.get(target);
            if (val && !val.typeSet.isUnknown()) return val;
        }

        // 3. Check all nodeStates and join definitions of target
        let merged = null;
        for (const state of this.inference.nodeStates.values()) {
            const val = state.outEnv.get(target);
            if (val && !val.typeSet.isUnknown()) {
                merged = merged ? merged.join(val) : val;
            }
        }
        if (merged) return merged;

        // 4. Fallback: Check TypeFlowGraph
        const tfn = this.typeFlowGraph?.getNode(`tfn_var_${String(this.cfg?.functionId || '<module>').replace(/[^a-zA-Z0-9_]/g, '_')}_${target}`);
        if (tfn) return tfn.abstractValue;

        return AbstractValue.unknown();
    }

    getType(target, nodeId = null) {
        const val = this.getAbstractValue(target, nodeId);
        return val.typeSet.first();
    }

    getTypes(target, nodeId = null) {
        const val = this.getAbstractValue(target, nodeId);
        return val.typeSet.toArray();
    }

    getConstant(target, nodeId = null) {
        const val = this.getAbstractValue(target, nodeId);
        return val.getConstant();
    }

    getNullability(target, nodeId = null) {
        const val = this.getAbstractValue(target, nodeId);
        return val.nullability;
    }

    getCollectionShape(target, nodeId = null) {
        const val = this.getAbstractValue(target, nodeId);
        return val.shape;
    }

    getObjectShape(target, nodeId = null) {
        const val = this.getAbstractValue(target, nodeId);
        return val.shape;
    }

    getDiagnostics(nodeId = null) {
        if (!this.inference) return [];
        if (!nodeId) return this.inference.diagnostics;
        return this.inference.diagnostics.filter(d => d.sourceLocation?.nodeId === nodeId);
    }

    getReturnType(functionId = '<module>') {
        return this.inference ? this.inference.getReturnType() : null;
    }

    explainType(target, nodeId = null) {
        const val = this.getAbstractValue(target, nodeId);
        return new TypeExplanation({
            target,
            inferredType: val.toString(),
            confidence: val.confidence,
            constraints: [],
            provenance: val.provenance,
            summary: `Variable '${target}' inferred as '${val.toString()}' (${val.confidence}) with nullability ${val.nullability}.`,
        });
    }
}
