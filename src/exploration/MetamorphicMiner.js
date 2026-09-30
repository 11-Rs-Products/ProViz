/**
 * MetamorphicMiner — Mines candidate metamorphic relations from program signatures and observations.
 */

import { MetamorphicRelation } from './MetamorphicRelation.js';
import { ExplorationConfidence } from './ExplorationConfidence.js';

export class MetamorphicMiner {
    /**
     * @param {string} functionName
     * @param {Array<object>} [observations=[]]
     * @returns {Array<MetamorphicRelation>}
     */
    static mineRelations(functionName, observations = []) {
        const relations = [];

        // Check if function works on lists / collections (e.g. sort, reverse, sum)
        if (functionName.includes('sort') || functionName.includes('order')) {
            relations.push(new MetamorphicRelation({
                name: `${functionName}_permutation_invariance`,
                relationType: 'PERMUTATION_INVARIANCE',
                targetFunction: functionName,
                transformation: 'PERMUTATION',
                outputRelation: 'EQUALS',
                confidence: ExplorationConfidence.HIGH,
                evidence: ['Sorting is invariant under input permutation'],
            }));

            relations.push(new MetamorphicRelation({
                name: `${functionName}_idempotence`,
                relationType: 'IDEMPOTENCE',
                targetFunction: functionName,
                transformation: 'IDEMPOTENCE',
                outputRelation: 'IDEMPOTENCE',
                confidence: ExplorationConfidence.HIGH,
                evidence: ['Sorting twice produces the same sorted result: sort(sort(x)) == sort(x)'],
            }));
        }

        if (functionName.includes('normalize') || functionName.includes('clean') || functionName.includes('format')) {
            relations.push(new MetamorphicRelation({
                name: `${functionName}_idempotence`,
                relationType: 'IDEMPOTENCE',
                targetFunction: functionName,
                transformation: 'IDEMPOTENCE',
                outputRelation: 'IDEMPOTENCE',
                confidence: ExplorationConfidence.MEDIUM,
                evidence: ['Normalization is idempotent'],
            }));
        }

        return relations;
    }
}
