/**
 * TypeGuardRepairGenerator — Synthesizes safe runtime type guards.
 */

import { REPAIR_STRATEGIES } from './RepairStrategy.js';
import { RepairHypothesis } from './RepairHypothesis.js';
import { TransformationBuilder } from './TransformationBuilder.js';
import { PythonRepairAdapter } from './PythonRepairAdapter.js';

export class TypeGuardRepairGenerator {
    /**
     * Generate hypotheses and transformations for type mismatch findings.
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
        const guardCode = adapter.generateTypeGuard(varName, 'int', indent, 'None');

        const hypothesis = new RepairHypothesis({
            strategy: REPAIR_STRATEGIES.TYPE_GUARD,
            problem: `Possible type mismatch for variable '${varName}' at line ${line}`,
            rootCause,
            expectedInvariant: `isinstance(${varName}, ExpectedType)`,
            expectedBehaviorChange: `Return None early if ${varName} is not of expected type`,
            supportingEvidence: ['TypeFlow type inference', 'Contract argument validation'],
        });

        const transformation = TransformationBuilder.insertBeforeLine({
            fileId,
            line,
            codeToInsert: guardCode,
            kind: REPAIR_STRATEGIES.TYPE_GUARD,
            expectedEffect: `Guard against unexpected type on ${varName}`,
        });

        return [{ hypothesis, transformation }];
    }
}
