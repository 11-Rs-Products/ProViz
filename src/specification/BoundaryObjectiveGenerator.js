/**
 * BoundaryObjectiveGenerator — Generates test objectives targeting parameter and value boundaries.
 */

import { TestObjectiveKind } from './TestObjectiveKind.js';

export class BoundaryObjectiveGenerator {
    /**
     * @param {string} functionId
     * @param {Array<string>} parameters
     * @param {object} [context={}]
     * @returns {Array<object>}
     */
    generate(functionId, parameters = [], context = {}) {
        const objectives = [];
        const params = parameters.length > 0 ? parameters : ['a', 'b'];

        for (const param of params) {
            const boundaries = [0, 1, -1, 100, -100];
            for (const val of boundaries) {
                const idPayload = `${functionId}:${param}:boundary:${val}`;
                objectives.push({
                    id: `obj_boundary_${BoundaryObjectiveGenerator.computeHash(idPayload)}`,
                    kind: TestObjectiveKind.EXERCISE_BOUNDARY,
                    targetFunction: functionId,
                    parameter: param,
                    boundaryValue: val,
                    targetCondition: `${param} == ${val}`,
                    suggestedInputs: { [param]: val },
                    priority: val === 0 ? 0.95 : 0.8,
                    reason: `Exercise numerical boundary value ${val} on parameter ${param}`,
                });
            }

            // Collection / null boundaries
            objectives.push({
                id: `obj_boundary_${BoundaryObjectiveGenerator.computeHash(`${functionId}:${param}:boundary:null`)}`,
                kind: TestObjectiveKind.EXERCISE_BOUNDARY,
                targetFunction: functionId,
                parameter: param,
                boundaryValue: null,
                targetCondition: `${param} is None`,
                suggestedInputs: { [param]: null },
                priority: 0.7,
                reason: `Exercise null / None boundary value on parameter ${param}`,
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
