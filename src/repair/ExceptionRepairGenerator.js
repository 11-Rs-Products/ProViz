/**
 * ExceptionRepairGenerator — Synthesizes narrowly-scoped try/except blocks.
 */

import { REPAIR_STRATEGIES } from './RepairStrategy.js';
import { RepairHypothesis } from './RepairHypothesis.js';
import { TransformationBuilder } from './TransformationBuilder.js';
import { PythonRepairAdapter } from './PythonRepairAdapter.js';
import { Patch } from './Patch.js';

export class ExceptionRepairGenerator {
    /**
     * Generate hypotheses and transformations for scoped exception handling.
     * @param {import('./RootCause.js').RootCause} rootCause
     * @param {string} sourceCode
     * @returns {Array<{ hypothesis: RepairHypothesis, transformation: import('./Transformation.js').Transformation }>}
     */
    static generate(rootCause, sourceCode = '') {
        const line = rootCause.location?.line || 1;
        const fileId = rootCause.location?.fileId || 'main.py';

        const lines = sourceCode.split('\n');
        const targetLine = lines[line - 1] || '';
        const indent = PythonRepairAdapter.getIndentation(targetLine);

        const adapter = new PythonRepairAdapter();
        const wrappedCode = adapter.generateExceptionHandling(targetLine.trim(), indent, 'Exception', 'return None');

        const hypothesis = new RepairHypothesis({
            strategy: REPAIR_STRATEGIES.EXCEPTION_HANDLING,
            problem: `Unhandled exception risk at line ${line}`,
            rootCause,
            expectedInvariant: `Safe execution of line ${line} under exception handler`,
            expectedBehaviorChange: `Catch exception and return None gracefully`,
            supportingEvidence: ['Exception safety analyzer'],
        });

        const patch = new Patch({
            fileId,
            startLine: line,
            startColumn: 1,
            endLine: line,
            endColumn: targetLine.length + 1,
            replacement: wrappedCode,
            originalText: targetLine,
        });

        const transformation = TransformationBuilder.buildTransformation({
            kind: REPAIR_STRATEGIES.EXCEPTION_HANDLING,
            location: { fileId, line, col: 1 },
            patches: [patch],
            expectedEffect: `Wrap line ${line} in safe exception handler`,
        });

        return [{ hypothesis, transformation }];
    }
}
