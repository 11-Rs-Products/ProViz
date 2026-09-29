/**
 * BehaviorMiner — Mines behavior models, state models, and signatures from observations.
 */

import { BehaviorModel } from './BehaviorModel.js';
import { ObservationSet } from './ObservationSet.js';
import { BehaviorSignature } from './BehaviorSignature.js';
import { ValueModel } from './ValueModel.js';

export class BehaviorMiner {
    /**
     * @param {string} functionId
     * @param {Array<object>|ObservationSet} observations
     * @param {object} [options={}]
     * @returns {BehaviorModel}
     */
    mine(functionId, observations, options = {}) {
        const obsSet = observations instanceof ObservationSet ? observations : new ObservationSet(observations);
        const seenSigs = new Set();
        const signatures = [];
        const vmMap = {};
        const exceptions = [];

        for (const obs of obsSet.observations) {
            // Signatures (capped to 100 distinct signatures)
            if (signatures.length < 100) {
                const sig = BehaviorSignature.fromObservation(obs);
                if (!seenSigs.has(sig.signatureKey)) {
                    seenSigs.add(sig.signatureKey);
                    signatures.push(sig);
                }
            }

            // Value models
            if (obs.inputs) {
                for (const [k, v] of Object.entries(obs.inputs)) {
                    if (!vmMap[k]) vmMap[k] = new ValueModel({ name: k });
                    vmMap[k] = vmMap[k].observe(v);
                }
            }
            if (obs.returnValue !== undefined) {
                if (!vmMap['$return']) vmMap['$return'] = new ValueModel({ name: '$return' });
                vmMap['$return'] = vmMap['$return'].observe(obs.returnValue);
            }

            // Exceptions
            if (obs.exception) {
                const exType = obs.exception.type || obs.exception.name || 'Exception';
                if (!exceptions.includes(exType)) {
                    exceptions.push(exType);
                }
            }
        }

        return new BehaviorModel({
            functionId,
            observations: obsSet,
            valueModels: vmMap,
            signatures,
            exceptions,
        });
    }
}
