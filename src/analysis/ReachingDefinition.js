/**
 * ReachingDefinition — Computes reaching definitions across basic blocks and statement nodes.
 */

export class ReachingDefinition {
    /**
     * @param {import('./ControlFlowGraph.js').ControlFlowGraph} cfg
     */
    constructor(cfg) {
        this.cfg = cfg;
        this.inSets = new Map(); // blockId -> Set<defId>
        this.outSets = new Map(); // blockId -> Set<defId>
        this.genSets = new Map(); // blockId -> Set<defId>
        this.killSets = new Map(); // blockId -> Set<defId>

        this._computeReachingDefinitions();
    }

    _computeReachingDefinitions() {
        const blocks = this.cfg.getBasicBlocks();
        const allDefs = new Map(); // defId -> { variable, blockId }
        const varToDefs = new Map(); // variable -> Set<defId>

        // 1. Collect all definitions across blocks
        for (const bb of blocks) {
            for (const stmt of bb.statements) {
                if (stmt.targetVariable) {
                    const defId = stmt.defId || `def_${bb.id}_${stmt.targetVariable}_L${stmt.sourceLocation?.line || 0}`;
                    allDefs.set(defId, { variable: stmt.targetVariable, blockId: bb.id, stmt });
                    if (!varToDefs.has(stmt.targetVariable)) varToDefs.set(stmt.targetVariable, new Set());
                    varToDefs.get(stmt.targetVariable).add(defId);
                }
            }
        }

        // 2. Compute Gen and Kill sets for each block
        for (const bb of blocks) {
            const gen = new Set();
            const kill = new Set();

            for (const stmt of bb.statements) {
                if (stmt.targetVariable) {
                    const varName = stmt.targetVariable;
                    const defId = stmt.defId || `def_${bb.id}_${varName}_L${stmt.sourceLocation?.line || 0}`;

                    // Kill all other definitions of varName in the program
                    const otherDefs = varToDefs.get(varName) || new Set();
                    for (const od of otherDefs) {
                        if (od !== defId) kill.add(od);
                    }

                    // Gen this definition
                    gen.add(defId);
                }
            }

            this.genSets.set(bb.id, gen);
            this.killSets.set(bb.id, kill);
            this.inSets.set(bb.id, new Set());
            this.outSets.set(bb.id, new Set(gen));
        }

        // 3. Iterative fixed-point algorithm: In[B] = U Out[P], Out[B] = Gen[B] U (In[B] - Kill[B])
        let changed = true;
        let iterations = 0;
        const maxIterations = blocks.length * 4;

        while (changed && iterations < maxIterations) {
            changed = false;
            iterations++;

            for (const bb of blocks) {
                const newIn = new Set();
                const preds = bb.predecessors;

                for (const pId of preds) {
                    const pOut = this.outSets.get(pId);
                    if (pOut) {
                        for (const d of pOut) newIn.add(d);
                    }
                }

                this.inSets.set(bb.id, newIn);

                // Out[B] = Gen[B] U (In[B] - Kill[B])
                const gen = this.genSets.get(bb.id) || new Set();
                const kill = this.killSets.get(bb.id) || new Set();
                const newOut = new Set(gen);

                for (const d of newIn) {
                    if (!kill.has(d)) newOut.add(d);
                }

                const curOut = this.outSets.get(bb.id);
                if (!this._areSetsEqual(newOut, curOut)) {
                    this.outSets.set(bb.id, newOut);
                    changed = true;
                }
            }
        }
    }

    /**
     * Retrieves definitions reaching the entry of a basic block.
     * @param {string} blockId
     * @returns {string[]} Array of definition IDs
     */
    getReachingDefinitions(blockId) {
        const inSet = this.inSets.get(blockId);
        return inSet ? Array.from(inSet) : [];
    }

    _areSetsEqual(a, b) {
        if (!a || !b) return a === b;
        if (a.size !== b.size) return false;
        for (const item of a) if (!b.has(item)) return false;
        return true;
    }
}
