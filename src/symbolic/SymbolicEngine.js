/**
 * SymbolicEngine — Central symbolic reasoning orchestrator combining execution, constraint solving, and proof generation.
 */

import { SymbolicExecutor } from './SymbolicExecutor.js';
import { ConstraintSolver } from './ConstraintSolver.js';
import { SymbolicVerification } from './SymbolicVerification.js';
import { SymbolicSnapshot } from './SymbolicSnapshot.js';

export class SymbolicEngine {
    /**
     * @param {object} [config]
     * @param {number} [config.maxPaths=32]
     * @param {number} [config.maxDepth=50]
     * @param {number} [config.timeoutMs=500]
     */
    constructor({ maxPaths = 32, maxDepth = 50, timeoutMs = 500 } = {}) {
        this.executor = new SymbolicExecutor({ maxPaths, maxDepth, timeoutMs });
        this.solver = new ConstraintSolver();
        this.verification = new SymbolicVerification();
    }

    /**
     * Run symbolic analysis across CFG and optional Stage 15 findings.
     * @param {object} context
     * @param {object} context.cfg - ControlFlowGraph
     * @param {Array<object>} [context.findings=[]] - Stage 15 findings
     * @param {string} [context.functionId='<module>']
     * @returns {SymbolicSnapshot}
     */
    analyze({ cfg, findings = [], functionId = '<module>' } = {}) {
        const pathGraph = this.executor.execute(cfg, { functionId });
        const proofs = [];
        const counterexamples = [];
        const refinedFindings = [];

        for (const f of findings) {
            const ref = this.verification.refineFinding(f, pathGraph);
            refinedFindings.push({
                findingId: f.id,
                status: ref.status,
                proof: ref.proof,
                counterexample: ref.counterexample,
            });
            if (ref.proof) proofs.push(ref.proof);
            if (ref.counterexample) counterexamples.push(ref.counterexample);
        }

        return new SymbolicSnapshot({
            functionId,
            paths: pathGraph.getPaths(),
            proofs,
            counterexamples,
            refinedFindings,
            status: 'SUCCESS',
        });
    }
}
