/**
 * SymbolicAnalyzer — High-level entrypoint for symbolic execution and constraint analysis.
 */

import { PythonControlFlowAdapter } from '../analysis/PythonControlFlowAdapter.js';
import { VerificationAnalyzer } from '../verification/VerificationAnalyzer.js';
import { SymbolicEngine } from './SymbolicEngine.js';

export class SymbolicAnalyzer {
    /**
     * @param {object} [config]
     */
    constructor(config = {}) {
        this.cfAdapter = new PythonControlFlowAdapter();
        this.verificationAnalyzer = new VerificationAnalyzer();
        this.engine = new SymbolicEngine(config);
    }

    /**
     * Analyze source code symbolically.
     * @param {string} sourceCode
     * @param {object} [options]
     * @param {string} [options.functionId='<module>']
     * @param {string} [options.fileId='main.py']
     * @returns {object} - { snapshot, cfg, paths, proofs, counterexamples, refinedFindings }
     */
    analyzeSource(sourceCode, { functionId = '<module>', fileId = 'main.py' } = {}) {
        const cfg = this.cfAdapter.buildCFG(sourceCode, { functionId, fileId });
        const vResult = this.verificationAnalyzer.analyzeSource(sourceCode, { functionId, fileId });
        const snapshot = this.engine.analyze({
            cfg,
            findings: vResult.findings,
            functionId,
        });

        return {
            snapshot,
            cfg,
            paths: snapshot.paths,
            proofs: snapshot.proofs,
            counterexamples: snapshot.counterexamples,
            refinedFindings: snapshot.refinedFindings,
        };
    }
}
