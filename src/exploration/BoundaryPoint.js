/**
 * BoundaryPoint — Discrete semantic boundary point for exploration.
 */

export class BoundaryPoint {
    /**
     * @param {object} params
     * @param {any} params.value
     * @param {string} [params.kind='EXPLICIT']
     * @param {string} [params.parameter='']
     * @param {string} [params.reason='']
     * @param {number} [params.priority=0.8]
     */
    constructor({
        value,
        kind = 'EXPLICIT',
        parameter = '',
        reason = '',
        priority = 0.8,
    } = {}) {
        this.value = value;
        this.kind = String(kind);
        this.parameter = String(parameter);
        this.reason = String(reason);
        this.priority = Number(priority);

        const hashPayload = `${this.parameter}:${this.kind}:${String(this.value)}`;
        this.id = `bound_${BoundaryPoint.computeHash(hashPayload)}`;
        Object.freeze(this);
    }

    static computeHash(str) {
        let hash = 5381;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) + hash) + str.charCodeAt(i);
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16);
    }

    toJSON() {
        return {
            id: this.id,
            value: this.value,
            kind: this.kind,
            parameter: this.parameter,
            reason: this.reason,
            priority: this.priority,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new BoundaryPoint(json);
    }
}
