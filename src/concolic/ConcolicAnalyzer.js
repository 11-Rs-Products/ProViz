/**
 * ConcolicAnalyzer — Top-level analyzer integrating CFG, Symbolic, and Concolic engines.
 */

import { PythonControlFlowAdapter } from '../analysis/PythonControlFlowAdapter.js';
import { ConcolicEngine } from './ConcolicEngine.js';

export class ConcolicAnalyzer {
    /**
     * @param {object} [config]
     */
    constructor(config = {}) {
        this.cfAdapter = new PythonControlFlowAdapter();
        this.engine = new ConcolicEngine(config);
    }

    /**
     * Analyze source code with concolic exploration.
     * @param {string} sourceCode
     * @param {object} [options]
     * @param {string} [options.functionId='<module>']
     * @param {string} [options.fileId='main.py']
     * @param {Array<import('../testing/TestCase.js').TestCase>} [options.initialTests=[]]
     * @returns {object} - { snapshot, cfg, paths, candidates, coverage }
     */
    analyzeSource(sourceCode, { functionId = '<module>', fileId = 'main.py', initialTests = [] } = {}) {
        const cfg = this.cfAdapter.buildCFG(sourceCode, { functionId, fileId });
        const snapshot = this.engine.explore({
            sourceCode,
            cfg,
            initialTests,
        });

        return {
            snapshot,
            cfg,
            paths: snapshot.paths,
            candidates: snapshot.candidates,
            coverage: snapshot.coverage,
        };
    }
}
