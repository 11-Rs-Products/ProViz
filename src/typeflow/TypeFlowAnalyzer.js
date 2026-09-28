/**
 * TypeFlowAnalyzer — Central orchestrator for static type and value-flow analysis.
 */

import { PythonControlFlowAdapter } from '../analysis/PythonControlFlowAdapter.js';
import { SSAConstructor } from '../analysis/SSAConstructor.js';
import { PythonTypeAdapter } from './PythonTypeAdapter.js';
import { TypeInference } from './TypeInference.js';
import { TypeSnapshot } from './TypeSnapshot.js';

export class TypeFlowAnalyzer {
    /**
     * @param {object} [options]
     * @param {object} [options.adapters]
     */
    constructor({ adapters = {} } = {}) {
        this.cfAdapter = new PythonControlFlowAdapter();
        this.typeAdapter = new PythonTypeAdapter();
    }

    /**
     * Analyzes source code and returns inference results, type state, and type flow graph.
     */
    analyzeSource(sourceCode, { functionId = '<module>', moduleId = 'main', fileId = 'main.py' } = {}) {
        const cfg = this.cfAdapter.buildCFG(sourceCode, { functionId, moduleId, fileId });

        const inference = new TypeInference({
            cfg,
            adapter: this.typeAdapter,
        });

        inference.infer();

        return {
            cfg,
            inference,
            typeFlowGraph: inference.typeFlowGraph,
            nodeStates: inference.nodeStates,
            diagnostics: inference.diagnostics,
        };
    }

    /**
     * Creates an immutable TypeSnapshot.
     */
    createSnapshot(sourceCode, options = {}) {
        const analysis = this.analyzeSource(sourceCode, options);
        return TypeSnapshot.capture({
            functionId: options.functionId || '<module>',
            inference: analysis.inference,
            typeFlowGraph: analysis.typeFlowGraph,
            diagnostics: analysis.diagnostics,
            metadata: options.metadata || {},
        });
    }
}
