/**
 * PropertyObjectiveGenerator — Generates objectives to confirm or challenge candidate specifications.
 */

import { TestObjectiveKind } from './TestObjectiveKind.js';

export class PropertyObjectiveGenerator {
    /**
     * @param {Array<Specification>} specifications
     * @returns {Array<object>}
     */
    generate(specifications = []) {
        const objectives = [];

        for (const spec of specifications) {
            const funcId = spec.subject.functionId || spec.subject.name || 'global';
            
            // Generate objective to confirm property
            objectives.push({
                id: `obj_prop_confirm_${PropertyObjectiveGenerator.computeHash(spec.id + ':confirm')}`,
                kind: TestObjectiveKind.CONFIRM_PROPERTY,
                targetFunction: funcId,
                specificationId: spec.id,
                targetCondition: spec.condition || spec.expression || 'true',
                priority: 0.8,
                reason: `Confirm candidate specification ${spec.id} (${spec.kind})`,
            });

            // Generate objective to challenge / violate property
            objectives.push({
                id: `obj_prop_violate_${PropertyObjectiveGenerator.computeHash(spec.id + ':violate')}`,
                kind: TestObjectiveKind.VIOLATE_PROPERTY,
                targetFunction: funcId,
                specificationId: spec.id,
                targetCondition: `not (${spec.condition || spec.expression || 'true'})`,
                priority: 0.85,
                reason: `Challenge candidate specification ${spec.id} with counterexample candidates`,
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
