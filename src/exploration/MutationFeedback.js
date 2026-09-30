/**
 * MutationTarget / MutationFeedback / MutationExplorer / SurvivorExplorer — Integration with Stage 20 mutation testing.
 */

export class MutationTarget {
    /**
     * @param {object} params
     * @param {string} params.mutantId
     * @param {string} [params.functionId='global']
     * @param {string} [params.operator='MUTATION']
     * @param {object|null} [params.location=null]
     */
    constructor({
        mutantId,
        functionId = 'global',
        operator = 'MUTATION',
        location = null,
    } = {}) {
        this.mutantId = String(mutantId || '');
        this.functionId = String(functionId || 'global');
        this.operator = String(operator);
        this.location = location ? Object.freeze({ ...location }) : null;
        Object.freeze(this);
    }
}

export class MutationFeedback {
    /**
     * @param {object} params
     * @param {Array<string>} [params.killedMutants=[]]
     * @param {Array<string>} [params.survivingMutants=[]]
     * @param {number} [params.mutationScoreDelta=0.0]
     */
    constructor({
        killedMutants = [],
        survivingMutants = [],
        mutationScoreDelta = 0.0,
    } = {}) {
        this.killedMutants = Object.freeze([...killedMutants]);
        this.survivingMutants = Object.freeze([...survivingMutants]);
        this.mutationScoreDelta = Number(mutationScoreDelta);
        Object.freeze(this);
    }
}

export class MutationExplorer {
    /**
     * Generates input candidates targeting surviving mutants.
     * @param {Array<object>} survivingMutants
     * @returns {Array<MutationTarget>}
     */
    static extractTargets(survivingMutants = []) {
        return survivingMutants.map(m => new MutationTarget({
            mutantId: m.id,
            functionId: m.functionId || m.fileId || 'global',
            operator: m.operator,
            location: m.location,
        }));
    }
}

export class SurvivorExplorer extends MutationExplorer {}
