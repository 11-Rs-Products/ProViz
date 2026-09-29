/**
 * NullGuardRepairGenerator — Synthesizes guards for potential None / null dereferences.
 */

import { REPAIR_STRATEGIES } from './RepairStrategy.js';
import { RepairHypothesis } from './RepairHypothesis.js';
import { TransformationBuilder } from './TransformationBuilder.js';
import { PythonRepairAdapter } from './PythonRepairAdapter.js';

export class NullGuardRepairGenerator {
    /**
     * Generate hypotheses and transformations for null dereference findings.
     * @param {import('./RootCause.js').RootCause} rootCause
     * @param {string} sourceCode
     * @returns {Array<{ hypothesis: RepairHypothesis, transformation: import('./Transformation.js').Transformation }>}
     */
    static generate(rootCause, sourceCode = '') {
        const line = rootCause.location?.line || 1;
        const fileId = rootCause.location?.fileId || 'main.py';
        const varName = rootCause.variableName || 'x';

        const lines = sourceCode.split('\n');
        const targetLine = lines[line - 1] || '';
        const indent = PythonRepairAdapter.getIndentation(targetLine);

        const adapter = new PythonRepairAdapter();
        const guardCode = adapter.generateNullGuard(varName, indent, 'None');

        const hypothesis = new RepairHypothesis({
            strategy: REPAIR_STRATEGIES.NULL_GUARD,
            problem: `Possible None access on variable '${varName}' at line ${line}`,
            rootCause,
            expectedInvariant: `${varName} is not None`,
            expectedBehaviorChange: `Return None early if ${varName} is None`,
            supportingEvidence: ['Null safety analyzer', 'TypeFlow non-null inference'],
        });

        const transformation = TransformationBuilder.insertBeforeLine({
            fileId,
            line,
            codeToInsert: guardCode,
            kind: REPAIR_STRATEGIES.NULL_GUARD,
            expectedEffect: `Guard ${varName} against None access`,
        });

        return [{ hypothesis, transformation }];
    }
}
