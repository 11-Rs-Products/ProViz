/**
 * InvariantMiner — Mines candidate invariants from runtime observations and static analysis.
 */

import { Invariant } from './Invariant.js';
import { SpecificationConfidence } from './SpecificationConfidence.js';
import { SpecificationSource } from './SpecificationSource.js';
import { SpecificationStatus } from './SpecificationStatus.js';

export class InvariantMiner {
    /**
     * @param {string} functionId
     * @param {Array<object>|ObservationSet} observations
     * @param {object} [options={}]
     * @returns {Array<Invariant>}
     */
    mine(functionId, observations, options = {}) {
        const obsList = Array.isArray(observations) ? observations : (observations.observations || []);
        if (obsList.length === 0) return [];

        const invariants = [];
        const varSamples = new Map();

        for (const obs of obsList) {
            if (obs.inputs) {
                for (const [k, v] of Object.entries(obs.inputs)) {
                    if (!varSamples.has(k)) varSamples.set(k, []);
                    const arr = varSamples.get(k);
                    if (arr.length < 100) arr.push(v);
                }
            }
            if (obs.postState) {
                for (const [k, v] of Object.entries(obs.postState)) {
                    if (!varSamples.has(k)) varSamples.set(k, []);
                    const arr = varSamples.get(k);
                    if (arr.length < 100) arr.push(v);
                }
            }
        }

        for (const [varName, samples] of varSamples.entries()) {
            const nonNullSamples = samples.filter(s => s !== null && s !== undefined);
            const allNumbers = nonNullSamples.length > 0 && nonNullSamples.every(s => typeof s === 'number');

            if (allNumbers) {
                let min = Infinity;
                let max = -Infinity;
                for (const s of nonNullSamples) {
                    if (s < min) min = s;
                    if (s > max) max = s;
                }

                if (min >= 0) {
                    invariants.push(new Invariant({
                        subject: { name: varName, functionId },
                        expression: `${varName} >= 0`,
                        variables: [varName],
                        confidence: samples.length >= 3 ? SpecificationConfidence.HIGH_CONFIDENCE : SpecificationConfidence.OBSERVED_ONLY,
                        source: SpecificationSource.RUNTIME_OBSERVATION,
                        status: SpecificationStatus.MINED,
                        evidence: [`Observed ${samples.length} values with min ${min} >= 0`],
                    }));
                }

                if (min === max && samples.length >= 2) {
                    invariants.push(new Invariant({
                        subject: { name: varName, functionId },
                        expression: `${varName} == ${min}`,
                        variables: [varName],
                        confidence: SpecificationConfidence.OBSERVED_ONLY,
                        source: SpecificationSource.RUNTIME_OBSERVATION,
                        status: SpecificationStatus.CANDIDATE,
                        evidence: [`Observed constant value ${min} across ${samples.length} executions`],
                    }));
                }
            }

            const neverNull = samples.length > 0 && samples.every(s => s !== null && s !== undefined);
            if (neverNull) {
                invariants.push(new Invariant({
                    subject: { name: varName, functionId },
                    expression: `${varName} is not None`,
                    variables: [varName],
                    confidence: samples.length >= 3 ? SpecificationConfidence.MEDIUM_CONFIDENCE : SpecificationConfidence.OBSERVED_ONLY,
                    source: SpecificationSource.RUNTIME_OBSERVATION,
                    status: SpecificationStatus.MINED,
                    evidence: [`${samples.length} samples were non-null`],
                }));
            }
        }

        return invariants;
    }
}
