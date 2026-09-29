/**
 * StateModel — Represents an observed or inferred abstract/concrete state in the program.
 */

export class StateModel {
    /**
     * @param {object} params
     * @param {string} params.id
     * @param {string} [params.name]
     * @param {object} [params.variables={}]
     * @param {object} [params.heapSummary={}]
     * @param {Array<string>} [params.activeWatches=[]]
     */
    constructor({
        id,
        name = '',
        variables = {},
        heapSummary = {},
        activeWatches = [],
    } = {}) {
        this.id = id || `state_${StateModel.computeHash(JSON.stringify(variables))}`;
        this.name = name || this.id;
        this.variables = Object.freeze({ ...variables });
        this.heapSummary = Object.freeze({ ...heapSummary });
        this.activeWatches = Object.freeze([...activeWatches]);
        Object.freeze(this);
    }

    static computeHash(str) {
        let hash = 5381;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) + hash) + str.charCodeAt(i);
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16);
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            variables: this.variables,
            heapSummary: this.heapSummary,
            activeWatches: this.activeWatches,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new StateModel(json);
    }
}
