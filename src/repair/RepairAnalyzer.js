/**
 * RepairAnalyzer — Top-level entrypoint integrating Stages 12-18 for Stage 19 program repair.
 */

import { RepairEngine } from './RepairEngine.js';
import { RepairQueries } from './RepairQueries.js';
import { VerificationAnalyzer } from '../verification/VerificationAnalyzer.js';

export class RepairAnalyzer {
    /**
     * Analyze source code or workspace, detect findings, synthesize candidate fixes, and validate them.
     *
     * @param {string|import('../workspace/WorkspaceSnapshot.js').WorkspaceSnapshot} input
     * @param {object} [options={}]
     * @returns {RepairQueries}
     */
    static analyze(input, options = {}) {
        let sourceCode = '';
        if (typeof input === 'string') {
            sourceCode = input;
        } else if (input && typeof input.getAllFiles === 'function') {
            const file = input.getAllFiles()[0];
            sourceCode = file ? file.content : '';
        }

        // 1. Run static verification to find target defects
        const vAnalyzer = new VerificationAnalyzer();
        const vResult = vAnalyzer.analyzeSource(sourceCode);
        const findings = vResult?.findings || [];

        const engine = new RepairEngine(options);
        const primaryFinding = findings[0] || { kind: 'POSSIBLE_DIVISION_BY_ZERO', location: { line: 1 } };

        const repairSnapshot = engine.runPipeline(primaryFinding, input, {
            sourceRevision: input?.version || 1,
            findings,
        });

        return new RepairQueries(repairSnapshot);
    }
}
