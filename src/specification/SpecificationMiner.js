/**
 * SpecificationMiner — Master orchestrator for mining specifications and detecting observation conflicts.
 */

import { SpecificationSet } from './SpecificationSet.js';
import { InvariantMiner } from './InvariantMiner.js';
import { ContractMiner } from './ContractMiner.js';
import { ExceptionMiner } from './ExceptionMiner.js';
import { RelationMiner } from './RelationMiner.js';
import { TemporalMiner } from './TemporalMiner.js';
import { BehaviorMiner } from './BehaviorMiner.js';
import { Specification } from './Specification.js';
import { SpecificationKind } from './SpecificationKind.js';
import { SpecificationStatus } from './SpecificationStatus.js';
import { SpecificationConfidence } from './SpecificationConfidence.js';
import { SpecificationSource } from './SpecificationSource.js';
import { ObservationSet } from './ObservationSet.js';

export class SpecificationMiner {
    constructor(options = {}) {
        this.options = Object.freeze({
            maxObservations: options.maxObservations || 10000,
            maxSpecifications: options.maxSpecifications || 1000,
            ...options,
        });

        this.invariantMiner = new InvariantMiner();
        this.contractMiner = new ContractMiner();
        this.exceptionMiner = new ExceptionMiner();
        this.relationMiner = new RelationMiner();
        this.temporalMiner = new TemporalMiner();
        this.behaviorMiner = new BehaviorMiner();
    }

    /**
     * @param {string} functionId
     * @param {Array<object>|ObservationSet} observations
     * @param {object} [context={}]
     * @returns {{ specifications: SpecificationSet, behaviorModel: any, conflicts: Array<object> }}
     */
    mine(functionId, observations, context = {}) {
        const obsSet = observations instanceof ObservationSet ? observations : new ObservationSet(observations);
        const conflicts = this.detectConflicts(functionId, obsSet);

        const specs = [];

        // If there are conflicts, record explicit conflict specification
        for (const conflict of conflicts) {
            specs.push(new Specification({
                kind: SpecificationKind.RETURN_PROPERTY,
                subject: { functionId, conflictInput: conflict.inputs },
                status: SpecificationStatus.INCONCLUSIVE,
                confidence: SpecificationConfidence.UNKNOWN,
                source: SpecificationSource.RUNTIME_OBSERVATION,
                evidence: [
                    `CONFLICTING_OBSERVATIONS: inputs ${JSON.stringify(conflict.inputs)} produced differing outputs: ${JSON.stringify(conflict.outputs)}`,
                ],
                metadata: {
                    conflictType: 'CONFLICTING_OBSERVATIONS',
                    conflict,
                },
            }));
        }

        // Run sub-miners
        specs.push(...this.invariantMiner.mine(functionId, obsSet));
        specs.push(...this.contractMiner.mine(functionId, obsSet));
        specs.push(...this.exceptionMiner.mine(functionId, obsSet));
        specs.push(...this.relationMiner.mine(functionId, obsSet));
        specs.push(...this.temporalMiner.mine(functionId, obsSet));

        // Enforce maxSpecifications bound
        const boundedSpecs = specs.slice(0, this.options.maxSpecifications);
        const specSet = new SpecificationSet(boundedSpecs);
        const behaviorModel = this.behaviorMiner.mine(functionId, obsSet);

        return {
            specifications: specSet,
            behaviorModel,
            conflicts,
        };
    }

    /**
     * Detects conflicting outputs for identical inputs
     * @param {string} functionId
     * @param {ObservationSet} obsSet
     * @returns {Array<object>}
     */
    detectConflicts(functionId, obsSet) {
        const byInput = new Map();
        for (const obs of obsSet) {
            const inputKey = JSON.stringify(obs.inputs || {});
            if (!byInput.has(inputKey)) {
                byInput.set(inputKey, []);
            }
            byInput.get(inputKey).push(obs);
        }

        const conflicts = [];
        for (const [inputKey, list] of byInput.entries()) {
            if (list.length >= 2) {
                const returnValues = list.map(o => o.returnValue);
                const hasMismatch = returnValues.some(v => JSON.stringify(v) !== JSON.stringify(returnValues[0]));
                if (hasMismatch) {
                    conflicts.push({
                        functionId,
                        inputs: list[0].inputs,
                        outputs: returnValues,
                        observations: list.map(o => o.id),
                    });
                }
            }
        }

        return conflicts;
    }
}
