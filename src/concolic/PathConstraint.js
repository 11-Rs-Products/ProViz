/**
 * PathConstraint — Symbolic constraint contributed by an actually executed branch.
 */

export class PathConstraint {
    /**
     * @param {object} params
     * @param {number} params.position
     * @param {string} params.branchId
     * @param {string} [params.predicate='']
     * @param {boolean} [params.takenPolarity=true]
     * @param {import('../symbolic/Constraint.js').Constraint|object} params.normalizedConstraint
     * @param {object|null} [params.sourceLocation=null]
     * @param {Array<string>} [params.ssaDependencies=[]]
     */
    constructor({
        position = 0,
        branchId,
        predicate = '',
        takenPolarity = true,
        normalizedConstraint,
        sourceLocation = null,
        ssaDependencies = [],
    } = {}) {
        this.position = Number(position) || 0;
        this.branchId = String(branchId || '');
        this.predicate = String(predicate);
        this.takenPolarity = Boolean(takenPolarity);
        this.normalizedConstraint = normalizedConstraint;
        this.sourceLocation = sourceLocation ? Object.freeze({ ...sourceLocation }) : null;
        this.ssaDependencies = Object.freeze([...ssaDependencies]);
        Object.freeze(this);
    }

    toString() {
        return this.normalizedConstraint ? this.normalizedConstraint.toString() : this.predicate;
    }

    toJSON() {
        return {
            position: this.position,
            branchId: this.branchId,
            predicate: this.predicate,
            takenPolarity: this.takenPolarity,
            normalizedConstraint: this.normalizedConstraint?.toJSON ? this.normalizedConstraint.toJSON() : this.normalizedConstraint,
            sourceLocation: this.sourceLocation,
            ssaDependencies: this.ssaDependencies,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new PathConstraint(json);
    }
}
