/**
 * TestObjectiveGenerator — Master test objective coordinator.
 */

import { BoundaryObjectiveGenerator } from './BoundaryObjectiveGenerator.js';
import { PathObjectiveGenerator } from './PathObjectiveGenerator.js';
import { PropertyObjectiveGenerator } from './PropertyObjectiveGenerator.js';
import { TransitionObjectiveGenerator } from './TransitionObjectiveGenerator.js';
import { MutationObjectiveGenerator } from './MutationObjectiveGenerator.js';
import { RegressionObjectiveGenerator } from './RegressionObjectiveGenerator.js';
import { TestObjectiveKind } from './TestObjectiveKind.js';

export class TestObjectiveGenerator {
    constructor(options = {}) {
        this.options = Object.freeze({
            maxObjectives: options.maxObjectives || 1000,
            ...options,
        });

        this.boundaryGen = new BoundaryObjectiveGenerator();
        this.pathGen = new PathObjectiveGenerator();
        this.propertyGen = new PropertyObjectiveGenerator();
        this.transitionGen = new TransitionObjectiveGenerator();
        this.mutationGen = new MutationObjectiveGenerator();
        this.regressionGen = new RegressionObjectiveGenerator();
    }

    /**
     * Generates a test objective directly from a discovered Gap.
     * @param {object} gap
     * @returns {object}
     */
    static fromGap(gap) {
        if (!gap) return null;
        let kind = TestObjectiveKind.EXPLORE_UNKNOWN_REGION;

        if (gap.kind === 'UNCOVERED_BRANCH') kind = TestObjectiveKind.COVER_BRANCH;
        else if (gap.kind === 'UNCOVERED_PATH') kind = TestObjectiveKind.COVER_PATH;
        else if (gap.kind === 'UNVALIDATED_PROPERTY') kind = TestObjectiveKind.CONFIRM_PROPERTY;
        else if (gap.kind === 'UNTESTED_EXCEPTION') kind = TestObjectiveKind.EXERCISE_EXCEPTION;
        else if (gap.kind === 'UNTESTED_BOUNDARY') kind = TestObjectiveKind.EXERCISE_BOUNDARY;
        else if (gap.kind === 'MUTATION_SURVIVOR') kind = TestObjectiveKind.EXERCISE_MUTATION;
        else if (gap.kind === 'REGRESSION_GAP') kind = TestObjectiveKind.VALIDATE_REGRESSION;

        const idPayload = `gap_obj_${gap.id || gap.kind}_${gap.functionId || ''}`;
        return {
            id: `obj_${TestObjectiveGenerator.computeHash(idPayload)}`,
            kind,
            gapId: gap.id,
            targetFunction: gap.functionId || 'global',
            targetCondition: gap.suggestedObjective?.targetCondition || 'true',
            suggestedInputs: gap.suggestedInputs || gap.suggestedObjective?.suggestedInputs || {},
            priority: gap.priority || 0.85,
            reason: `Generated from gap: ${gap.reason || gap.kind}`,
        };
    }

    /**
     * Generates a comprehensive set of test objectives from program artifacts.
     * @param {object} params
     * @param {string} [params.functionId='global']
     * @param {Array<string>} [params.parameters=[]]
     * @param {Array<object>} [params.specifications=[]]
     * @param {Array<object>} [params.uncoveredBranches=[]]
     * @param {Array<object>} [params.symbolicPaths=[]]
     * @param {Array<object>} [params.survivingMutants=[]]
     * @param {Array<object>} [params.changes=[]]
     * @param {Array<object>} [params.gaps=[]]
     * @returns {Array<object>}
     */
    generateAll({
        functionId = 'global',
        parameters = [],
        specifications = [],
        uncoveredBranches = [],
        symbolicPaths = [],
        survivingMutants = [],
        changes = [],
        gaps = [],
    } = {}) {
        const objectives = [];

        // 1. Boundary objectives
        objectives.push(...this.boundaryGen.generate(functionId, parameters));

        // 2. Path objectives
        objectives.push(...this.pathGen.generate(functionId, uncoveredBranches, symbolicPaths));

        // 3. Property objectives
        objectives.push(...this.propertyGen.generate(specifications));

        // 4. Mutation objectives
        objectives.push(...this.mutationGen.generate(survivingMutants));

        // 5. Regression objectives
        objectives.push(...this.regressionGen.generate(changes));

        // 6. Gap objectives
        for (const g of gaps) {
            objectives.push(TestObjectiveGenerator.fromGap(g));
        }

        // Deduplicate and enforce maxObjectives limit
        const byId = new Map();
        for (const obj of objectives) {
            if (!byId.has(obj.id)) {
                byId.set(obj.id, obj);
            }
        }

        const sorted = [...byId.values()].sort((a, b) => (b.priority || 0) - (a.priority || 0));
        return sorted.slice(0, this.options.maxObjectives);
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
