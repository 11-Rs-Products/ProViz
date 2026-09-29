/**
 * DivisionRepairGenerator — Synthesizes denominator guards for possible division by zero.
 */

import { REPAIR_STRATEGIES } from './RepairStrategy.js';
import { RepairHypothesis } from './RepairHypothesis.js';
import { TransformationBuilder } from './TransformationBuilder.js';
import { PythonRepairAdapter } from './PythonRepairAdapter.js';

export class DivisionRepairGenerator {
    /**
     * Generate hypotheses and transformations for division by zero findings.
     * @param {import('./RootCause.js').RootCause} rootCause
     * @param {string} sourceCode
     * @returns {Array<{ hypothesis: RepairHypothesis, transformation: import('./Transformation.js').Transformation }>}
     */
    static generate(rootCause, sourceCode = '') {
        const line = rootCause.location?.line || 1;
        const fileId = rootCause.location?.fileId || 'main.py';
        const denominator = rootCause.variableName || 'x';

        const lines = sourceCode.split('\n');
        const targetLine = lines[line - 1] || '';
        const indent = PythonRepairAdapter.getIndentation(targetLine);

        const adapter = new PythonRepairAdapter();
        const guardCode = adapter.generateDivisionGuard(denominator, indent, '0');

        const hypothesis = new RepairHypothesis({
            strategy: REPAIR_STRATEGIES.DIVISION_GUARD,
            problem: `Possible division by zero with denominator '${denominator}' at line ${line}`,
            rootCause,
            expectedInvariant: `${denominator} != 0`,
            expectedBehaviorChange: `Return 0 when denominator ${denominator} == 0`,
            supportingEvidence: ['Division safety analyzer', 'Interval zero-containment check'],
        });

        const transformation = TransformationBuilder.insertBeforeLine({
            fileId,
            line,
            codeToInsert: guardCode,
            kind: REPAIR_STRATEGIES.DIVISION_GUARD,
            expectedEffect: `Guard against zero denominator on ${denominator}`,
        });

        return [{ hypothesis, transformation }];
    }
}
