/**
 * VerificationAnalyzer — High-level entrypoint for static verification across source code or workspaces.
 */

import { ControlFlowAnalyzer as Stage13CFGAnalyzer } from '../analysis/ControlFlowAnalyzer.js';
import { SSAConstructor } from '../analysis/SSAConstructor.js';
import { TypeFlowAnalyzer } from '../typeflow/TypeFlowAnalyzer.js';
import { VerificationEngine } from './VerificationEngine.js';

export class VerificationAnalyzer {
    /**
     * @param {object} [config]
     */
    constructor(config = {}) {
        this.engine = new VerificationEngine(config);
        this.cfgAnalyzer = new Stage13CFGAnalyzer();
        this.ssaConstructor = new SSAConstructor();
        this.typeAnalyzer = new TypeFlowAnalyzer();
    }

    /**
     * Analyze source code and produce a VerificationSnapshot.
     * @param {string} sourceCode
     * @param {object} [options]
     * @param {string} [options.functionId='<module>']
     * @param {string} [options.fileId='main.py']
     * @param {object} [options.dataflowGraph]
     * @param {Array<object>} [options.contracts]
     * @returns {object} - { snapshot, cfg, ssa, typeAnalysis }
     */
    analyzeSource(sourceCode, {
        functionId = '<module>',
        fileId = 'main.py',
        dataflowGraph = null,
        contracts = [],
    } = {}) {
        const typeAnalysis = this.typeAnalyzer.analyzeSource(sourceCode, { functionId, fileId });
        const cfg = typeAnalysis.cfg;

        const snapshot = this.engine.verify({
            cfg,
            ssa: null,
            typeInference: typeAnalysis.inference,
            dataflowGraph,
            contracts,
            functionId,
        });

        return {
            snapshot,
            cfg,
            ssa: null,
            typeAnalysis,
            findings: snapshot.findings,
            properties: snapshot.properties,
            verificationGraph: snapshot.verificationGraph,
        };
    }
}
