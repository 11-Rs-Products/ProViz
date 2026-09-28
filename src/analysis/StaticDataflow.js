/**
 * StaticDataflow — Analyzes reaching definitions, live variables, and static def-use chains.
 */

import { ReachingDefinition } from './ReachingDefinition.js';

export class StaticDataflow {
    /**
     * @param {import('./ControlFlowGraph.js').ControlFlowGraph} cfg
     * @param {import('./SSAFunction.js').SSAFunction} [ssaFunction=null]
     */
    constructor(cfg, ssaFunction = null) {
        this.cfg = cfg;
        this.ssaFunction = ssaFunction;
        this.reachingDefs = new ReachingDefinition(cfg);
        this.liveVariables = new Map(); // blockId -> Set<varName>

        this._computeLiveVariables();
    }

    _computeLiveVariables() {
        const blocks = this.cfg.getBasicBlocks();
        const useSets = new Map(); // blockId -> Set<varName>
        const defSets = new Map(); // blockId -> Set<varName>

        for (const bb of blocks) {
            const uses = new Set();
            const defs = new Set();

            for (const stmt of bb.statements) {
                // Uses before defs
                for (const u of (stmt.dependencies || [])) {
                    if (!defs.has(u)) uses.add(u);
                }
                if (stmt.targetVariable) {
                    defs.add(stmt.targetVariable);
                }
            }

            useSets.set(bb.id, uses);
            defSets.set(bb.id, defs);
            this.liveVariables.set(bb.id, new Set(uses));
        }

        // Backward iterative analysis: In[B] = Use[B] U (Out[B] - Def[B]), Out[B] = U In[S]
        let changed = true;
        let iterations = 0;
        const maxIterations = blocks.length * 4;

        while (changed && iterations < maxIterations) {
            changed = false;
            iterations++;

            for (const bb of blocks) {
                const outLive = new Set();
                for (const sId of bb.successors) {
                    const sIn = this.liveVariables.get(sId);
                    if (sIn) {
                        for (const v of sIn) outLive.add(v);
                    }
                }

                const uses = useSets.get(bb.id) || new Set();
                const defs = defSets.get(bb.id) || new Set();
                const newIn = new Set(uses);

                for (const v of outLive) {
                    if (!defs.has(v)) newIn.add(v);
                }

                const curIn = this.liveVariables.get(bb.id);
                if (!this._areSetsEqual(newIn, curIn)) {
                    this.liveVariables.set(bb.id, newIn);
                    changed = true;
                }
            }
        }
    }

    getReachingDefinitions(nodeOrBlockId) {
        return this.reachingDefs.getReachingDefinitions(nodeOrBlockId);
    }

    getLiveVariables(blockId) {
        const set = this.liveVariables.get(blockId);
        return set ? Array.from(set) : [];
    }

    _areSetsEqual(a, b) {
        if (!a || !b) return a === b;
        if (a.size !== b.size) return false;
        for (const item of a) if (!b.has(item)) return false;
        return true;
    }
}
