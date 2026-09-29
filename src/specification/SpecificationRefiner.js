/**
 * SpecificationRefiner — Refines, strengthens, weakens, specializes, or invalidates specifications.
 */

import { Specification } from './Specification.js';
import { SpecificationStatus } from './SpecificationStatus.js';
import { SpecificationConfidence } from './SpecificationConfidence.js';

export class SpecificationRefiner {
    /**
     * Refines a specification based on new observation evidence.
     * @param {Specification} spec
     * @param {object} observation
     * @returns {Specification}
     */
    static refineWithObservation(spec, observation) {
        if (!spec || !observation) return spec;

        // Check if observation validates or violates spec
        if (observation.exception && spec.kind === 'RETURN_PROPERTY') {
            return new Specification({
                ...spec,
                status: SpecificationStatus.VIOLATED,
                confidence: SpecificationConfidence.HIGH_CONFIDENCE,
                evidence: [...spec.evidence, `Violated by exception ${observation.exception.type || 'Exception'}`],
            });
        }

        if (spec.kind === 'RETURN_PROPERTY' && spec.expectedValue !== undefined) {
            if (observation.returnValue === spec.expectedValue) {
                return new Specification({
                    ...spec,
                    status: SpecificationStatus.VALIDATED,
                    confidence: SpecificationConfidence.HIGH_CONFIDENCE,
                    evidence: [...spec.evidence, `Validated by observation returning ${spec.expectedValue}`],
                });
            } else if (observation.returnValue !== undefined) {
                return new Specification({
                    ...spec,
                    status: SpecificationStatus.VIOLATED,
                    confidence: SpecificationConfidence.HIGH_CONFIDENCE,
                    evidence: [...spec.evidence, `Violated by observation returning ${observation.returnValue}`],
                });
            }
        }

        return spec;
    }

    /**
     * Weakens a specification condition when new feasible paths/inputs are discovered.
     * @param {Specification} spec
     * @param {string} weakerCondition
     * @returns {Specification}
     */
    static weaken(spec, weakerCondition) {
        return new Specification({
            ...spec,
            status: SpecificationStatus.REFINED,
            preconditions: [...spec.preconditions, weakerCondition],
            evidence: [...spec.evidence, `Weakened condition to: ${weakerCondition}`],
        });
    }

    /**
     * Invalidates a specification with a counterexample.
     * @param {Specification} spec
     * @param {object|string} counterexample
     * @returns {Specification}
     */
    static invalidate(spec, counterexample) {
        return new Specification({
            ...spec,
            status: SpecificationStatus.INVALIDATED,
            confidence: SpecificationConfidence.PROVEN,
            evidence: [...spec.evidence, `Invalidated by counterexample: ${JSON.stringify(counterexample)}`],
        });
    }
}
