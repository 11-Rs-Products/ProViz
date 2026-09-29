/**
 * ObservationSet — Immutable collection of observations indexed by function and outcome.
 */

import { Observation } from './Observation.js';

export class ObservationSet {
    /**
     * @param {Array<Observation>} [observations=[]]
     */
    constructor(observations = []) {
        this.observations = Object.freeze(observations.map(o => o instanceof Observation ? o : Observation.fromJSON(o)));

        const byId = new Map();
        const byFunction = new Map();
        const normalRuns = [];
        const exceptionRuns = [];

        for (const obs of this.observations) {
            byId.set(obs.id, obs);

            if (!byFunction.has(obs.functionId)) byFunction.set(obs.functionId, []);
            byFunction.get(obs.functionId).push(obs);

            if (obs.exception) {
                exceptionRuns.push(obs);
            } else {
                normalRuns.push(obs);
            }
        }

        this._byId = byId;
        this._byFunction = byFunction;
        this.normalRuns = Object.freeze(normalRuns);
        this.exceptionRuns = Object.freeze(exceptionRuns);

        Object.freeze(this);
    }

    get size() {
        return this.observations.length;
    }

    get(id) {
        return this._byId.get(id) || null;
    }

    has(id) {
        return this._byId.has(id);
    }

    getByFunction(functionId) {
        return Object.freeze([...(this._byFunction.get(functionId) || [])]);
    }

    add(obs) {
        if (this.has(obs.id)) return this;
        return new ObservationSet([...this.observations, obs]);
    }

    addAll(observations) {
        const list = [...this.observations];
        for (const o of observations) {
            if (!this.has(o.id)) {
                list.push(o);
            }
        }
        return new ObservationSet(list);
    }

    [Symbol.iterator]() {
        return this.observations[Symbol.iterator]();
    }

    toJSON() {
        return {
            observations: this.observations.map(o => o.toJSON()),
        };
    }

    static fromJSON(json) {
        if (!json || !Array.isArray(json.observations)) {
            return new ObservationSet([]);
        }
        return new ObservationSet(json.observations.map(o => Observation.fromJSON(o)));
    }
}
