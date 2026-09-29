/**
 * CounterexampleRefiner — Refines specifications and generates targeted objectives from counterexamples.
 */

import { SpecificationRefiner } from './SpecificationRefiner.js';
import { TestObjectiveKind } from './TestObjectiveKind.js';

export class CounterexampleRefiner {
    /**
     * @param {Specification} spec
     * @param {object} counterexample
     * @returns {{ refinedSpec: Specification, newObjective: object }}
     */
    static processCounterexample(spec, counterexample) {
        const refinedSpec = SpecificationRefiner.invalidate(spec, counterexample);

        const newObjective = {
            id: `obj_ce_${CounterexampleRefiner.computeHash(JSON.stringify(counterexample))}`,
            kind: TestObjectiveKind.DISTINGUISH_BEHAVIOR,
            targetFunction: spec.subject?.functionId || 'global',
            suggestedInputs: counterexample.inputs || {},
            priority: 0.95,
            reason: `Target counterexample behavior for invalidated specification ${spec.id}`,
        };

        return {
            refinedSpec,
            newObjective,
        };
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
