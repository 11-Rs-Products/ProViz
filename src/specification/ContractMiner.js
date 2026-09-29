/**
 * ContractMiner — Mines preconditions, postconditions, and return relationships from input/output observations.
 */

import { Precondition } from './Precondition.js';
import { Postcondition } from './Postcondition.js';
import { ReturnProperty } from './ReturnProperty.js';
import { SpecificationConfidence } from './SpecificationConfidence.js';
import { SpecificationSource } from './SpecificationSource.js';
import { SpecificationStatus } from './SpecificationStatus.js';

export class ContractMiner {
    /**
     * @param {string} functionId
     * @param {Array<object>|ObservationSet} observations
     * @param {object} [options={}]
     * @returns {Array<Specification>}
     */
    mine(functionId, observations, options = {}) {
        const obsList = Array.isArray(observations) ? observations : (observations.observations || []);
        if (obsList.length === 0) return [];

        const specs = [];
        const normalRuns = obsList.filter(o => !o.exception);

        // Analyze return values vs inputs
        for (const obs of normalRuns) {
            const inputs = obs.inputs || {};
            const ret = obs.returnValue;

            // Check if specific input conditions correlate with specific returns
            for (const [paramName, paramVal] of Object.entries(inputs)) {
                if (paramVal === 0 && ret === 0) {
                    specs.push(new ReturnProperty({
                        subject: { functionId, parameter: paramName },
                        condition: `${paramName} == 0`,
                        returnExpression: '0',
                        expectedValue: 0,
                        confidence: SpecificationConfidence.HIGH_CONFIDENCE,
                        source: SpecificationSource.RUNTIME_OBSERVATION,
                        status: SpecificationStatus.MINED,
                        evidence: [`Observed return 0 when ${paramName} == 0`],
                    }));
                }
            }
        }

        // General postcondition on return type
        if (normalRuns.length > 0) {
            const types = new Set(normalRuns.map(o => typeof o.returnValue));
            if (types.size === 1) {
                const [singleType] = types;
                specs.push(new Postcondition({
                    subject: { functionId },
                    expression: `typeof(result) == '${singleType}'`,
                    expectedReturn: singleType,
                    relation: 'type_is',
                    confidence: normalRuns.length >= 2 ? SpecificationConfidence.HIGH_CONFIDENCE : SpecificationConfidence.MEDIUM_CONFIDENCE,
                    source: SpecificationSource.RUNTIME_OBSERVATION,
                    status: SpecificationStatus.VALIDATED,
                    evidence: [`All ${normalRuns.length} successful runs returned type ${singleType}`],
                }));
            }
        }

        return specs;
    }
}
