/**
 * BoundsRepairGenerator — Synthesizes array and sequence bounds checks.
 */

import { REPAIR_STRATEGIES } from './RepairStrategy.js';
import { RepairHypothesis } from './RepairHypothesis.js';
import { TransformationBuilder } from './TransformationBuilder.js';
import { PythonRepairAdapter } from './PythonRepairAdapter.js';

export class BoundsRepairGenerator {
    /**
     * Generate hypotheses and transformations for index out of bounds findings.
     * @param {import('./RootCause.js').RootCause} rootCause
     * @param {string} sourceCode
     * @returns {Array<{ hypothesis: RepairHypothesis, transformation: import('./Transformation.js').Transformation }>}
     */
    static generate(rootCause, sourceCode = '') {
        const line = rootCause.location?.line || 1;
        const fileId = rootCause.location?.fileId || 'main.py';
        const indexVar = rootCause.variableName || 'i';

        const lines = sourceCode.split('\n');
        const targetLine = lines[line - 1] || '';
        const indent = PythonRepairAdapter.getIndentation(targetLine);

        // Try to identify collection name from target line
        const match = targetLine.match(/([a-zA-Z0-9_]+)\[/);
        const collVar = match ? match[1] : 'xs';

        const adapter = new PythonRepairAdapter();
        const guardCode = adapter.generateBoundsGuard(collVar, indexVar, indent, 'None');

        const hypothesis = new RepairHypothesis({
            strategy: REPAIR_STRATEGIES.BOUNDS_CHECK,
            problem: `Possible index out of bounds for index '${indexVar}' on collection '${collVar}' at line ${line}`,
            rootCause,
            expectedInvariant: `0 <= ${indexVar} < len(${collVar})`,
            expectedBehaviorChange: `Return None early when index ${indexVar} is out of bounds`,
            supportingEvidence: ['Index safety analyzer', 'Interval bounds checking'],
        });

        const transformation = TransformationBuilder.insertBeforeLine({
            fileId,
            line,
            codeToInsert: guardCode,
            kind: REPAIR_STRATEGIES.BOUNDS_CHECK,
            expectedEffect: `Guard index access on ${collVar}`,
        });

        return [{ hypothesis, transformation }];
    }
}
