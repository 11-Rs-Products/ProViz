/**
 * BranchNegator — Inverts branch conditions while maintaining path prefix constraints.
 */

import { SymbolicPathCandidate } from './SymbolicPathCandidate.js';
import { Constraint } from '../symbolic/Constraint.js';

export class BranchNegator {
    /**
     * Invert a selected branch decision in a ConcretePath.
     * @param {import('./ConcretePath.js').ConcretePath} concretePath
     * @param {number} branchIndex
     * @returns {SymbolicPathCandidate|null}
     */
    static negateBranch(concretePath, branchIndex) {
        if (!concretePath || branchIndex < 0 || branchIndex >= concretePath.pathConstraints.length) {
            return null;
        }

        const targetConstraint = concretePath.pathConstraints[branchIndex];
        const targetBranch = concretePath.branchDecisions[branchIndex] || null;

        // Retain path constraints before branchIndex
        const retainedConstraints = concretePath.pathConstraints.slice(0, branchIndex);

        // Invert target constraint
        let negatedPredicate = null;
        if (targetConstraint.normalizedConstraint && typeof targetConstraint.normalizedConstraint.negate === 'function') {
            negatedPredicate = targetConstraint.normalizedConstraint.negate();
        } else if (targetConstraint.normalizedConstraint instanceof Constraint) {
            negatedPredicate = targetConstraint.normalizedConstraint.negate();
        }

        return new SymbolicPathCandidate({
            parentPathId: concretePath.pathId,
            branchToNegate: targetBranch,
            retainedConstraints,
            negatedPredicate,
            status: 'PENDING',
        });
    }
}
