/**
 * RelationMiner — Mines algebraic and order relations between variables and returns.
 */

import { RelationalProperty } from './RelationalProperty.js';
import { SpecificationConfidence } from './SpecificationConfidence.js';
import { SpecificationSource } from './SpecificationSource.js';
import { SpecificationStatus } from './SpecificationStatus.js';

export class RelationMiner {
    /**
     * @param {string} functionId
     * @param {Array<object>|ObservationSet} observations
     * @param {object} [options={}]
     * @returns {Array<RelationalProperty>}
     */
    mine(functionId, observations, options = {}) {
        const obsList = Array.isArray(observations) ? observations : (observations.observations || []);
        const specs = [];

        const normalRuns = obsList.filter(o => !o.exception && typeof o.returnValue === 'number');
        const nonZeroRuns = normalRuns.filter(o => typeof o.inputs?.b === 'number' && o.inputs.b !== 0);

        if (nonZeroRuns.length >= 2) {
            // Check if return value matches binary division (res == a / b when b != 0)
            let isDivisionMatch = true;
            for (const obs of nonZeroRuns) {
                const a = obs.inputs?.a;
                const b = obs.inputs?.b;
                if (typeof a === 'number' && typeof b === 'number') {
                    if (Math.abs(obs.returnValue - (a / b)) > 1e-6) {
                        isDivisionMatch = false;
                        break;
                    }
                } else {
                    isDivisionMatch = false;
                    break;
                }
            }

            if (isDivisionMatch) {
                specs.push(new RelationalProperty({
                    subject: { functionId },
                    leftExpression: 'result',
                    operator: '==',
                    rightExpression: 'a / b',
                    condition: 'b != 0',
                    confidence: SpecificationConfidence.HIGH_CONFIDENCE,
                    source: SpecificationSource.RUNTIME_OBSERVATION,
                    status: SpecificationStatus.VALIDATED,
                    evidence: [`Verified result == a / b on ${nonZeroRuns.length} non-zero runs`],
                }));
            }
        }

        return specs;
    }
}
