/**
 * MutationObjectiveGenerator — Generates objectives targeting surviving mutants.
 */

import { TestObjectiveKind } from './TestObjectiveKind.js';

export class MutationObjectiveGenerator {
    /**
     * @param {Array<object>} survivingMutants
     * @returns {Array<object>}
     */
    generate(survivingMutants = []) {
        const objectives = [];

        for (const mutant of survivingMutants) {
            const mutKey = mutant.id || mutant.name || 'mutant';
            objectives.push({
                id: `obj_mutation_${MutationObjectiveGenerator.computeHash(mutKey)}`,
                kind: TestObjectiveKind.EXERCISE_MUTATION,
                mutantId: mutant.id,
                targetFunction: mutant.functionId || mutant.fileId || 'global',
                targetLocation: mutant.location || null,
                priority: 0.9,
                reason: `Kill surviving mutant ${mutant.id} (${mutant.operator || 'mutation'})`,
            });
        }

        return objectives;
    }

    static computeHash(str) {
        let hash = 5381;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) + hash) + str.charCodeAt(i);
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16);
    }
}
