/**
 * AttributeRepairGenerator — Synthesizes hasattr attribute guards.
 */

import { REPAIR_STRATEGIES } from './RepairStrategy.js';
import { RepairHypothesis } from './RepairHypothesis.js';
import { TransformationBuilder } from './TransformationBuilder.js';
import { PythonRepairAdapter } from './PythonRepairAdapter.js';

export class AttributeRepairGenerator {
    /**
     * Generate hypotheses and transformations for missing attribute findings.
     * @param {import('./RootCause.js').RootCause} rootCause
     * @param {string} sourceCode
     * @returns {Array<{ hypothesis: RepairHypothesis, transformation: import('./Transformation.js').Transformation }>}
     */
    static generate(rootCause, sourceCode = '') {
        const line = rootCause.location?.line || 1;
        const fileId = rootCause.location?.fileId || 'main.py';
        const objName = rootCause.variableName || 'obj';

        const lines = sourceCode.split('\n');
        const targetLine = lines[line - 1] || '';
        const indent = PythonRepairAdapter.getIndentation(targetLine);

        const attrMatch = targetLine.match(/([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)/);
        const attrName = attrMatch ? attrMatch[2] : 'value';

        const adapter = new PythonRepairAdapter();
        const guardCode = adapter.generateAttributeGuard(objName, attrName, indent, 'None');

        const hypothesis = new RepairHypothesis({
            strategy: REPAIR_STRATEGIES.ATTRIBUTE_GUARD,
            problem: `Possible missing attribute '${attrName}' on '${objName}' at line ${line}`,
            rootCause,
            expectedInvariant: `hasattr(${objName}, '${attrName}')`,
            expectedBehaviorChange: `Return None early if '${objName}' lacks attribute '${attrName}'`,
            supportingEvidence: ['Attribute safety analyzer'],
        });

        const transformation = TransformationBuilder.insertBeforeLine({
            fileId,
            line,
            codeToInsert: guardCode,
            kind: REPAIR_STRATEGIES.ATTRIBUTE_GUARD,
            expectedEffect: `Guard against AttributeError on ${objName}.${attrName}`,
        });

        return [{ hypothesis, transformation }];
    }
}
