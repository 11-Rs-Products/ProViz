/**
 * PathObjectiveGenerator — Generates objectives targeting uncovered CFG branches and symbolic paths.
 */

import { TestObjectiveKind } from './TestObjectiveKind.js';

export class PathObjectiveGenerator {
    /**
     * @param {string} functionId
     * @param {Array<object>} [uncoveredBranches=[]]
     * @param {Array<object>} [symbolicPaths=[]]
     * @returns {Array<object>}
     */
    generate(functionId, uncoveredBranches = [], symbolicPaths = []) {
        const objectives = [];

        for (const branch of uncoveredBranches) {
            const branchKey = `${functionId}:branch:${branch.nodeId || branch.id || 'uncovered'}`;
            objectives.push({
                id: `obj_path_${PathObjectiveGenerator.computeHash(branchKey)}`,
                kind: TestObjectiveKind.COVER_BRANCH,
                targetFunction: functionId,
                branchId: branch.id || branch.nodeId,
                targetCondition: branch.condition || 'true',
                priority: 0.9,
                reason: `Cover uncovered branch ${branch.id || branch.nodeId}`,
            });
        }

        for (const path of symbolicPaths) {
            const pathKey = `${functionId}:path:${path.id || 'path'}`;
            objectives.push({
                id: `obj_path_${PathObjectiveGenerator.computeHash(pathKey)}`,
                kind: TestObjectiveKind.COVER_PATH,
                targetFunction: functionId,
                pathId: path.id,
                targetCondition: path.condition || path.predicate || 'true',
                priority: 0.85,
                reason: `Cover symbolic path ${path.id}`,
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
