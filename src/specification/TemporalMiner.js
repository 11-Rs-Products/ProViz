/**
 * TemporalMiner — Mines bounded temporal properties and event orderings.
 */

import { TemporalProperty } from './TemporalProperty.js';
import { SpecificationConfidence } from './SpecificationConfidence.js';
import { SpecificationSource } from './SpecificationSource.js';
import { SpecificationStatus } from './SpecificationStatus.js';

export class TemporalMiner {
    /**
     * @param {string} functionId
     * @param {Array<object>|ObservationSet} observations
     * @param {object} [options={}]
     * @returns {Array<TemporalProperty>}
     */
    mine(functionId, observations, options = {}) {
        const obsList = Array.isArray(observations) ? observations : (observations.observations || []);
        const specs = [];

        // Check call stacks / traces
        for (const obs of obsList) {
            if (obs.callStack && obs.callStack.length >= 2) {
                const parent = obs.callStack[obs.callStack.length - 2];
                const current = obs.callStack[obs.callStack.length - 1];

                specs.push(new TemporalProperty({
                    subject: { functionId },
                    pattern: 'BEFORE',
                    eventA: parent,
                    eventB: current,
                    confidence: SpecificationConfidence.HIGH_CONFIDENCE,
                    source: SpecificationSource.RUNTIME_OBSERVATION,
                    status: SpecificationStatus.MINED,
                    evidence: [`Observed call sequence ${parent} -> ${current}`],
                }));
                break;
            }
        }

        return specs;
    }
}
