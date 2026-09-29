/**
 * ExceptionMiner — Mines conditional exception rules and error specifications.
 */

import { ExceptionProperty } from './ExceptionProperty.js';
import { SpecificationConfidence } from './SpecificationConfidence.js';
import { SpecificationSource } from './SpecificationSource.js';
import { SpecificationStatus } from './SpecificationStatus.js';

export class ExceptionMiner {
    /**
     * @param {string} functionId
     * @param {Array<object>|ObservationSet} observations
     * @param {object} [options={}]
     * @returns {Array<ExceptionProperty>}
     */
    mine(functionId, observations, options = {}) {
        const obsList = Array.isArray(observations) ? observations : (observations.observations || []);
        const specs = [];

        const exceptionRuns = obsList.filter(o => o.exception);

        for (const obs of exceptionRuns) {
            const exType = obs.exception.type || obs.exception.name || 'Exception';
            const inputs = obs.inputs || {};

            // Identify trigger parameters
            let condition = '';
            for (const [k, v] of Object.entries(inputs)) {
                if (v === 0) {
                    condition = `${k} == 0`;
                } else if (v === null) {
                    condition = `${k} is None`;
                } else if (typeof v === 'number' && v < 0) {
                    condition = `${k} < 0`;
                }
            }

            specs.push(new ExceptionProperty({
                subject: { functionId },
                exceptionType: exType,
                condition: condition || 'error condition',
                exceptionLocation: obs.exception.location || null,
                shouldRaise: true,
                confidence: SpecificationConfidence.HIGH_CONFIDENCE,
                source: SpecificationSource.RUNTIME_OBSERVATION,
                status: SpecificationStatus.MINED,
                evidence: [`Observed exception ${exType} with inputs: ${JSON.stringify(inputs)}`],
            }));
        }

        // Also if all executions had no exceptions, produce an exception absence property
        if (obsList.length > 0 && exceptionRuns.length === 0) {
            specs.push(new ExceptionProperty({
                subject: { functionId },
                exceptionType: 'Exception',
                condition: 'valid inputs',
                shouldRaise: false,
                confidence: obsList.length >= 3 ? SpecificationConfidence.MEDIUM_CONFIDENCE : SpecificationConfidence.OBSERVED_ONLY,
                source: SpecificationSource.RUNTIME_OBSERVATION,
                status: SpecificationStatus.CANDIDATE,
                evidence: [`No exceptions observed across ${obsList.length} executions`],
            }));
        }

        return specs;
    }
}
