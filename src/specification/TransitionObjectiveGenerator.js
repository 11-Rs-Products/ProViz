/**
 * TransitionObjectiveGenerator — Generates objectives to trigger state transitions.
 */

import { TestObjectiveKind } from './TestObjectiveKind.js';

export class TransitionObjectiveGenerator {
    /**
     * @param {Array<TransitionModel>} transitions
     * @returns {Array<object>}
     */
    generate(transitions = []) {
        const objectives = [];

        for (const trans of transitions) {
            objectives.push({
                id: `obj_trans_${TransitionObjectiveGenerator.computeHash(trans.id)}`,
                kind: TestObjectiveKind.DISTINGUISH_BEHAVIOR,
                transitionId: trans.id,
                targetCondition: trans.guard || 'true',
                fromState: trans.fromStateId,
                toState: trans.toStateId,
                priority: 0.75,
                reason: `Trigger state transition from ${trans.fromStateId} to ${trans.toStateId}`,
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
