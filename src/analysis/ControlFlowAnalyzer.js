/**
 * ControlFlowAnalyzer — Central orchestrator for CFG, SSA, dominator, and static dataflow construction.
 */

import { PythonControlFlowAdapter } from './PythonControlFlowAdapter.js';
import { DominatorTree } from './DominatorTree.js';
import { SSAConstructor } from './SSAConstructor.js';
import { StaticDataflow } from './StaticDataflow.js';
import { SSAProgram } from './SSAProgram.js';
import { AnalysisSnapshot } from './AnalysisSnapshot.js';

export class ControlFlowAnalyzer {
    /**
     * @param {object} [options]
     * @param {object} [options.adapters] - Map of language -> LanguageControlFlowAdapter
     */
    constructor({ adapters = {} } = {}) {
        this.adapters = {
            python: new PythonControlFlowAdapter(),
            ...adapters,
        };
    }

    /**
     * Analyzes source code and produces CFG, DominatorTree, SSA, and StaticDataflow.
     *
     * @param {string} sourceCode
     * @param {object} [options]
     * @param {string} [options.language='python']
     * @param {string} [options.functionId='<module>']
     * @param {string} [options.fileId='main.py']
     * @returns {{ cfg: import('./ControlFlowGraph.js').ControlFlowGraph, domTree: DominatorTree, ssa: import('./SSAFunction.js').SSAFunction, staticDataflow: StaticDataflow }}
     */
    analyzeSource(sourceCode, { language = 'python', functionId = '<module>', fileId = 'main.py' } = {}) {
        const adapter = this.adapters[language] || this.adapters.python || new PythonControlFlowAdapter();
        const cfg = adapter.buildCFG(sourceCode, { functionId, fileId });
        const domTree = new DominatorTree(cfg);
        const ssa = SSAConstructor.construct(cfg, domTree);
        const staticDataflow = new StaticDataflow(cfg, ssa);

        return {
            cfg,
            domTree,
            ssa,
            staticDataflow,
        };
    }

    /**
     * Analyzes an entire workspace snapshot across all files.
     */
    analyzeWorkspace(workspace) {
        const program = new SSAProgram();
        const cfgs = new Map();
        const domTrees = new Map();

        const files = workspace?.getAllFiles ? workspace.getAllFiles() : [];
        for (const file of files) {
            const analysis = this.analyzeSource(file.content || '', {
                fileId: file.id || file.path,
                functionId: file.moduleId || '<module>',
            });
            cfgs.set(file.id || file.path, analysis.cfg);
            domTrees.set(file.id || file.path, analysis.domTree);
            program.addFunction(analysis.ssa);
        }

        return {
            program,
            cfgs,
            domTrees,
        };
    }

    /**
     * Creates an immutable AnalysisSnapshot for source code.
     */
    createSnapshot(sourceCode, options = {}) {
        const analysis = this.analyzeSource(sourceCode, options);
        return AnalysisSnapshot.capture({
            cfg: analysis.cfg,
            ssa: analysis.ssa,
            functionId: options.functionId || '<module>',
            metadata: options.metadata || {},
        });
    }
}
