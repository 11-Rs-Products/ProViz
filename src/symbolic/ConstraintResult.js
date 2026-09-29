/**
 * ConstraintResult — Structured result of constraint solving and satisfiability checks.
 */

export const SOLVER_STATUS = Object.freeze({
    SAT: 'SAT',
    UNSAT: 'UNSAT',
    UNKNOWN: 'UNKNOWN',
});

export class ConstraintResult {
    /**
     * @param {object} params
     * @param {string} params.status - SOLVER_STATUS member
     * @param {Map<string, any>|object|null} [params.model] - Satisfying model / variable assignments if SAT
     * @param {Array<import('./Constraint.js').Constraint>} [params.conflicts] - Conflicting constraints if UNSAT
     * @param {string} [params.reason]
     */
    constructor({
        status = SOLVER_STATUS.SAT,
        model = null,
        conflicts = [],
        reason = '',
    } = {}) {
        this.status = status;
        this.model = model ? Object.freeze(model instanceof Map ? Object.fromEntries(model.entries()) : { ...model }) : null;
        this.conflicts = Object.freeze([...conflicts]);
        this.reason = String(reason);
        Object.freeze(this);
    }

    static sat(model = null) {
        return new ConstraintResult({ status: SOLVER_STATUS.SAT, model });
    }

    static unsat(conflicts = [], reason = 'Contradiction detected') {
        return new ConstraintResult({ status: SOLVER_STATUS.UNSAT, conflicts, reason });
    }

    static unknown(reason = 'Constraint exceeds linear solver capabilities') {
        return new ConstraintResult({ status: SOLVER_STATUS.UNKNOWN, reason });
    }

    isSat() { return this.status === SOLVER_STATUS.SAT; }
    isUnsat() { return this.status === SOLVER_STATUS.UNSAT; }
    isUnknown() { return this.status === SOLVER_STATUS.UNKNOWN; }

    toJSON() {
        return {
            status: this.status,
            model: this.model,
            conflicts: this.conflicts.map(c => c.toJSON ? c.toJSON() : c),
            reason: this.reason,
        };
    }
}
