/**
 * TestingAnalyzer — High-level entrypoint for test generation and validation analysis.
 */

import { SymbolicAnalyzer } from '../symbolic/SymbolicAnalyzer.js';
import { TestingEngine } from './TestingEngine.js';

export class TestingAnalyzer {
    /**
     * @param {object} [config]
     */
    constructor(config = {}) {
        this.symbolicAnalyzer = new SymbolicAnalyzer(config);
        this.engine = new TestingEngine(config);
    }

    /**
     * Analyze source code, generate tests, and validate predictions.
     * @param {string} sourceCode
     * @param {object} [options]
     * @returns {object} - { snapshot, tests, results, suites, coverage }
     */
    analyzeSource(sourceCode, { functionId = '<module>', fileId = 'main.py', workspaceVersion = 1 } = {}) {
        const symResult = this.symbolicAnalyzer.analyzeSource(sourceCode, { functionId, fileId });
        const snapshot = this.engine.generateAndValidate({
            sourceCode,
            findings: symResult.refinedFindings || symResult.findings || [],
            paths: symResult.paths || [],
            counterexamples: symResult.counterexamples || [],
            workspaceVersion,
        });

        return {
            snapshot,
            tests: snapshot.tests,
            results: snapshot.results,
            suites: snapshot.suites,
            coverage: snapshot.coverage,
            symbolicSnapshot: symResult.snapshot,
        };
    }
}
