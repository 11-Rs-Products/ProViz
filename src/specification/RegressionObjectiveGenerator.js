/**
 * RegressionObjectiveGenerator — Generates objectives targeting changed semantic regions and regression gaps.
 */

import { TestObjectiveKind } from './TestObjectiveKind.js';

export class RegressionObjectiveGenerator {
    /**
     * @param {Array<object>} changes
     * @returns {Array<object>}
     */
    generate(changes = []) {
        const objectives = [];

        for (const change of changes) {
            const chgKey = change.id || change.fileId || 'change';
            objectives.push({
                id: `obj_regr_${RegressionObjectiveGenerator.computeHash(chgKey)}`,
                kind: TestObjectiveKind.VALIDATE_REGRESSION,
                changeId: change.id,
                targetFunction: change.functionIds?.[0] || 'global',
                targetLocation: change.sourceLocationAfter || change.sourceLocationBefore,
                priority: 0.95,
                reason: `Validate changed semantic behavior for ${change.kind} in ${change.fileId || ''}`,
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
