/**
 * PathComparator — Compares predicted symbolic path with observed dynamic execution.
 */

import { PathDivergence, DIVERGENCE_REASONS } from './PathDivergence.js';

export class PathComparator {
    /**
     * Compare predicted branch candidate with observed path.
     * @param {import('./SymbolicPathCandidate.js').SymbolicPathCandidate} candidate
     * @param {import('./ConcretePath.js').ConcretePath} observedPath
     * @returns {object} - { matches: boolean, divergence: PathDivergence|null }
     */
    static compare(candidate, observedPath) {
        if (!candidate || !observedPath) {
            return {
                matches: false,
                divergence: new PathDivergence({ reason: DIVERGENCE_REASONS.UNKNOWN }),
            };
        }

        // Check if the negated branch was taken in observed path
        const targetBranch = candidate.branchToNegate;
        if (targetBranch) {
            const observedDecisions = observedPath.branchDecisions;
            const matchingObs = observedDecisions.find(d => d.condition === targetBranch.condition || d.branchId === targetBranch.branchId);

            if (matchingObs) {
                // If candidate intended to take the alternative edge
                const expectedValue = !targetBranch.concreteValue;
                if (matchingObs.concreteValue !== expectedValue) {
                    return {
                        matches: false,
                        divergence: new PathDivergence({
                            candidateId: candidate.candidateId,
                            reason: DIVERGENCE_REASONS.CONTROL_FLOW_MISMATCH,
                            predictedBranch: targetBranch.alternativeEdge,
                            observedBranch: matchingObs.takenEdge,
                            sourceLocation: targetBranch.sourceLocation,
                        }),
                    };
                }
            }
        }

        return {
            matches: true,
            divergence: null,
        };
    }
}
