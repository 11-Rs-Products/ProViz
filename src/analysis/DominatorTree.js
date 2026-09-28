/**
 * DominatorTree — Computes dominance, post-dominance, dominance frontiers, and control dependencies.
 */

export class DominatorTree {
    /**
     * @param {import('./ControlFlowGraph.js').ControlFlowGraph} cfg
     */
    constructor(cfg) {
        this.cfg = cfg;
        this.idom = new Map(); // nodeId -> immediate dominator nodeId
        this.dominators = new Map(); // nodeId -> Set<dominator nodeId>
        this.dominated = new Map(); // nodeId -> Set<dominated nodeId>
        this.frontiers = new Map(); // nodeId -> Set<frontier nodeId>

        this.ipdom = new Map(); // nodeId -> immediate post-dominator nodeId
        this.postDominators = new Map(); // nodeId -> Set<post-dominator nodeId>
        this.controlDependencies = new Map(); // nodeId -> Set<controlling condition nodeId>

        this._computeDominance();
        this._computeDominanceFrontiers();
        this._computePostDominance();
        this._computeControlDependencies();
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Forward Dominance
    // ─────────────────────────────────────────────────────────────────────────────

    _computeDominance() {
        const nodes = this.cfg.getNodes();
        const entry = this.cfg.getEntry();
        if (!entry || nodes.length === 0) return;

        const allNodeIds = new Set(nodes.map(n => n.id));

        // Initialize dominators
        for (const node of nodes) {
            if (node.id === entry.id) {
                this.dominators.set(node.id, new Set([entry.id]));
            } else {
                this.dominators.set(node.id, new Set(allNodeIds));
            }
            this.dominated.set(node.id, new Set());
        }

        // Iterative fixed-point algorithm
        let changed = true;
        let iterations = 0;
        const maxIterations = nodes.length * 4;

        while (changed && iterations < maxIterations) {
            changed = false;
            iterations++;

            for (const node of nodes) {
                if (node.id === entry.id) continue;

                const preds = this.cfg.getPredecessors(node.id);
                if (preds.length === 0) continue;

                // Intersection of dominators of all predecessors
                let newDom = null;
                for (const pred of preds) {
                    const predDom = this.dominators.get(pred.id);
                    if (predDom) {
                        if (newDom === null) {
                            newDom = new Set(predDom);
                        } else {
                            for (const elem of newDom) {
                                if (!predDom.has(elem)) newDom.delete(elem);
                            }
                        }
                    }
                }

                newDom = newDom || new Set();
                newDom.add(node.id);

                const currentDom = this.dominators.get(node.id);
                if (!this._areSetsEqual(newDom, currentDom)) {
                    this.dominators.set(node.id, newDom);
                    changed = true;
                }
            }
        }

        // Compute immediate dominators (idom)
        for (const node of nodes) {
            if (node.id === entry.id) {
                this.idom.set(entry.id, null);
                continue;
            }

            const doms = Array.from(this.dominators.get(node.id) || []).filter(id => id !== node.id);
            let candidateIdom = null;
            let maxDomSize = -1;

            for (const d of doms) {
                const dSize = this.dominators.get(d)?.size || 0;
                if (dSize > maxDomSize) {
                    maxDomSize = dSize;
                    candidateIdom = d;
                }
            }

            if (candidateIdom) {
                this.idom.set(node.id, candidateIdom);
                if (!this.dominated.has(candidateIdom)) this.dominated.set(candidateIdom, new Set());
                this.dominated.get(candidateIdom).add(node.id);
            }
        }
    }

    _computeDominanceFrontiers() {
        const nodes = this.cfg.getNodes();
        for (const n of nodes) {
            this.frontiers.set(n.id, new Set());
        }

        for (const node of nodes) {
            const preds = this.cfg.getPredecessors(node.id);
            if (preds.length >= 2) {
                for (const pred of preds) {
                    let runner = pred.id;
                    const nodeIDom = this.idom.get(node.id);
                    while (runner && runner !== nodeIDom) {
                        this.frontiers.get(runner)?.add(node.id);
                        runner = this.idom.get(runner);
                    }
                }
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Post-Dominance (Reverse Dominance)
    // ─────────────────────────────────────────────────────────────────────────────

    _computePostDominance() {
        const nodes = this.cfg.getNodes();
        const exit = this.cfg.getExit();
        if (!exit || nodes.length === 0) return;

        const allNodeIds = new Set(nodes.map(n => n.id));

        for (const node of nodes) {
            if (node.id === exit.id) {
                this.postDominators.set(node.id, new Set([exit.id]));
            } else {
                this.postDominators.set(node.id, new Set(allNodeIds));
            }
        }

        let changed = true;
        let iterations = 0;
        const maxIterations = nodes.length * 4;

        while (changed && iterations < maxIterations) {
            changed = false;
            iterations++;

            for (const node of nodes) {
                if (node.id === exit.id) continue;

                const succs = this.cfg.getSuccessors(node.id);
                if (succs.length === 0) continue;

                let newPdom = null;
                for (const succ of succs) {
                    const succPdom = this.postDominators.get(succ.id);
                    if (succPdom) {
                        if (newPdom === null) {
                            newPdom = new Set(succPdom);
                        } else {
                            for (const elem of newPdom) {
                                if (!succPdom.has(elem)) newPdom.delete(elem);
                            }
                        }
                    }
                }

                newPdom = newPdom || new Set();
                newPdom.add(node.id);

                const currentPdom = this.postDominators.get(node.id);
                if (!this._areSetsEqual(newPdom, currentPdom)) {
                    this.postDominators.set(node.id, newPdom);
                    changed = true;
                }
            }
        }

        for (const node of nodes) {
            if (node.id === exit.id) {
                this.ipdom.set(exit.id, null);
                continue;
            }

            const pdoms = Array.from(this.postDominators.get(node.id) || []).filter(id => id !== node.id);
            let candidateIpdom = null;
            let maxPdomSize = -1;

            for (const p of pdoms) {
                const pSize = this.postDominators.get(p)?.size || 0;
                if (pSize > maxPdomSize) {
                    maxPdomSize = pSize;
                    candidateIpdom = p;
                }
            }

            if (candidateIpdom) {
                this.ipdom.set(node.id, candidateIpdom);
            }
        }
    }

    _computeControlDependencies() {
        const nodes = this.cfg.getNodes();
        for (const n of nodes) {
            this.controlDependencies.set(n.id, new Set());
        }

        // For every edge A -> B where B does not post-dominate A:
        // All nodes on the post-dominator tree between B and ipdom(A) are control dependent on A.
        for (const edge of this.cfg.getEdges()) {
            const a = edge.fromId;
            const b = edge.toId;

            const aPostDoms = this.postDominators.get(a) || new Set();
            if (!aPostDoms.has(b)) {
                let runner = b;
                const ipdomA = this.ipdom.get(a);

                while (runner && runner !== ipdomA) {
                    this.controlDependencies.get(runner)?.add(a);
                    runner = this.ipdom.get(runner);
                }
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Query APIs
    // ─────────────────────────────────────────────────────────────────────────────

    dominates(a, b) {
        if (!a || !b) return false;
        if (a === b) return true;
        const doms = this.dominators.get(b);
        return Boolean(doms && doms.has(a));
    }

    getImmediateDominator(nodeId) {
        return this.idom.get(nodeId) || null;
    }

    getDominators(nodeId) {
        return Array.from(this.dominators.get(nodeId) || []);
    }

    getDominatedNodes(nodeId) {
        return Array.from(this.dominated.get(nodeId) || []);
    }

    getFrontier(nodeId) {
        return Array.from(this.frontiers.get(nodeId) || []);
    }

    postDominates(a, b) {
        if (!a || !b) return false;
        if (a === b) return true;
        const pdoms = this.postDominators.get(b);
        return Boolean(pdoms && pdoms.has(a));
    }

    getImmediatePostDominator(nodeId) {
        return this.ipdom.get(nodeId) || null;
    }

    getPostDominators(nodeId) {
        return Array.from(this.postDominators.get(nodeId) || []);
    }

    getControlDependencies(nodeId) {
        return Array.from(this.controlDependencies.get(nodeId) || []);
    }

    _areSetsEqual(a, b) {
        if (!a || !b) return a === b;
        if (a.size !== b.size) return false;
        for (const item of a) if (!b.has(item)) return false;
        return true;
    }
}
