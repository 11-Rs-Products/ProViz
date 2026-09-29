/**
 * BehaviorModel — Comprehensive model of observed and inferred program behavior.
 */

import { BehaviorSignature } from './BehaviorSignature.js';
import { StateModel } from './StateModel.js';
import { TransitionModel } from './TransitionModel.js';
import { ValueModel } from './ValueModel.js';
import { ObservationSet } from './ObservationSet.js';

export class BehaviorModel {
    /**
     * @param {object} params
     * @param {string} [params.id]
     * @param {string} [params.functionId='']
     * @param {ObservationSet|Array<any>} [params.observations]
     * @param {Map<string, ValueModel>|object} [params.valueModels={}]
     * @param {Array<StateModel>} [params.states=[]]
     * @param {Array<TransitionModel>} [params.transitions=[]]
     * @param {Array<BehaviorSignature>} [params.signatures=[]]
     * @param {Array<string>} [params.exceptions=[]]
     * @param {object} [params.metadata={}]
     */
    constructor({
        id = null,
        functionId = '',
        observations = new ObservationSet(),
        valueModels = {},
        states = [],
        transitions = [],
        signatures = [],
        exceptions = [],
        metadata = {},
    } = {}) {
        this.functionId = String(functionId || '');
        this.observations = observations instanceof ObservationSet ? observations : ObservationSet.fromJSON(observations);
        
        const vmMap = {};
        if (valueModels instanceof Map) {
            for (const [k, v] of valueModels.entries()) {
                vmMap[k] = v instanceof ValueModel ? v : ValueModel.fromJSON(v);
            }
        } else if (valueModels && typeof valueModels === 'object') {
            for (const [k, v] of Object.entries(valueModels)) {
                vmMap[k] = v instanceof ValueModel ? v : ValueModel.fromJSON(v);
            }
        }
        this.valueModels = Object.freeze(vmMap);
        this.states = Object.freeze([...states].map(s => s instanceof StateModel ? s : StateModel.fromJSON(s)));
        this.transitions = Object.freeze([...transitions].map(t => t instanceof TransitionModel ? t : TransitionModel.fromJSON(t)));
        this.signatures = Object.freeze([...signatures].map(s => s instanceof BehaviorSignature ? s : BehaviorSignature.fromJSON(s)));
        this.exceptions = Object.freeze([...exceptions]);
        this.metadata = Object.freeze({ ...metadata });

        this.id = id || `bm_${this.functionId || 'global'}_${BehaviorModel.computeHash(JSON.stringify(this.signatures))}`;
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

    addObservation(obs) {
        const newObsSet = this.observations.add(obs);
        const sig = BehaviorSignature.fromObservation(obs);
        const existingSigs = [...this.signatures];
        if (!existingSigs.some(s => s.equals(sig))) {
            existingSigs.push(sig);
        }

        const newVms = { ...this.valueModels };
        if (obs.inputs) {
            for (const [k, v] of Object.entries(obs.inputs)) {
                const current = newVms[k] || new ValueModel({ name: k });
                newVms[k] = current.observe(v);
            }
        }
        if (obs.returnValue !== undefined) {
            const retVm = newVms['$return'] || new ValueModel({ name: '$return' });
            newVms['$return'] = retVm.observe(obs.returnValue);
        }

        const newExceptions = [...this.exceptions];
        if (obs.exception) {
            const exType = obs.exception.type || obs.exception.name || 'Exception';
            if (!newExceptions.includes(exType)) {
                newExceptions.push(exType);
            }
        }

        return new BehaviorModel({
            functionId: this.functionId,
            observations: newObsSet,
            valueModels: newVms,
            states: this.states,
            transitions: this.transitions,
            signatures: existingSigs,
            exceptions: newExceptions,
            metadata: this.metadata,
        });
    }

    toJSON() {
        const vmJson = {};
        for (const [k, v] of Object.entries(this.valueModels)) {
            vmJson[k] = v.toJSON();
        }
        return {
            id: this.id,
            functionId: this.functionId,
            observations: this.observations.toJSON(),
            valueModels: vmJson,
            states: this.states.map(s => s.toJSON()),
            transitions: this.transitions.map(t => t.toJSON()),
            signatures: this.signatures.map(s => s.toJSON()),
            exceptions: this.exceptions,
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new BehaviorModel(json);
    }
}
