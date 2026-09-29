/**
 * InvariantAnalyzer — Discovers and verifies invariants at loop headers and function boundaries.
 */

import { Invariant } from './Invariant.js';
import { PROPERTY_STATES } from './PropertyState.js';

export class InvariantAnalyzer {
    /**
     * @param {object} cfg
     * @param {Map<string, object>} [ranges]
     * @param {object} [typeInference]
     * @returns {Array<Invariant>}
     */
    analyze(cfg, ranges = new Map(), typeInference = null) {
        const invariants = [];
        if (!cfg) return invariants;

        // Loop header invariants derived from range bounds
        for (const [varName, range] of ranges.entries()) {
            if (range && !range.isEmpty) {
                if (range.min >= 0) {
                    invariants.push(
                        new Invariant({
                            expression: `${varName} >= 0`,
                            target: varName,
                            scope: '<module>',
                            status: PROPERTY_STATES.PROVEN,
                            confidence: 'STATIC_INFERENCE',
                            evidence: [{ reason: `Range lower bound is ${range.min}` }],
                        })
                    );
                }
                if (!range.containsZero()) {
                    invariants.push(
                        new Invariant({
                            expression: `${varName} != 0`,
                            target: varName,
                            scope: '<module>',
                            status: PROPERTY_STATES.PROVEN,
                            confidence: 'STATIC_INFERENCE',
                            evidence: [{ reason: `Range ${range.toString()} does not contain 0` }],
                        })
                    );
                }
            }
        }

        // Non-null invariants from type inference
        if (typeInference?.latestBindings) {
            for (const [varName, absVal] of typeInference.latestBindings.entries()) {
                if (absVal && absVal.nullability === 'NON_NULL') {
                    invariants.push(
                        new Invariant({
                            expression: `${varName} is not None`,
                            target: varName,
                            scope: '<module>',
                            status: PROPERTY_STATES.PROVEN,
                            confidence: 'STATIC_INFERENCE',
                            evidence: [{ reason: `Type inference proved NON_NULL nullability` }],
                        })
                    );
                }
            }
        }

        return invariants;
    }
}
