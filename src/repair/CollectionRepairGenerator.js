/**
 * CollectionRepairGenerator — Synthesizes empty collection and dictionary key existence guards.
 */

import { REPAIR_STRATEGIES } from './RepairStrategy.js';
import { RepairHypothesis } from './RepairHypothesis.js';
import { TransformationBuilder } from './TransformationBuilder.js';
import { PythonRepairAdapter } from './PythonRepairAdapter.js';

export class CollectionRepairGenerator {
    /**
     * Generate hypotheses and transformations for missing dictionary keys or empty collections.
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

        const dictMatch = targetLine.match(/([a-zA-Z0-9_]+)\[['"]?([a-zA-Z0-9_]+)['"]?\]/);
        const mapName = dictMatch ? dictMatch[1] : 'mapping';
        const keyName = dictMatch ? dictMatch[2] : (rootCause.variableName || 'key');

        const adapter = new PythonRepairAdapter();
        const guardCode = adapter.generateKeyGuard(mapName, keyName, indent, 'None');

        const hypothesis = new RepairHypothesis({
            strategy: REPAIR_STRATEGIES.KEY_EXISTENCE_GUARD,
            problem: `Possible missing key '${keyName}' in dictionary '${mapName}' at line ${line}`,
            rootCause,
            expectedInvariant: `${keyName} in ${mapName}`,
            expectedBehaviorChange: `Return None early if key '${keyName}' is not in '${mapName}'`,
            supportingEvidence: ['Collection safety analyzer', 'Key existence check'],
        });

        const transformation = TransformationBuilder.insertBeforeLine({
            fileId,
            line,
            codeToInsert: guardCode,
            kind: REPAIR_STRATEGIES.KEY_EXISTENCE_GUARD,
            expectedEffect: `Guard against KeyError on ${mapName}[${keyName}]`,
        });

        return [{ hypothesis, transformation }];
    }
}
