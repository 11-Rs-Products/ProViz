/**
 * BehavioralFeature — Individual atomic behavioral characteristic of an execution.
 */

export class BehavioralFeature {
    /**
     * @param {object} params
     * @param {string} params.name
     * @param {string|number|boolean} params.value
     * @param {number} [params.weight=1.0]
     */
    constructor({ name, value, weight = 1.0 } = {}) {
        this.name = String(name || '');
        this.value = value;
        this.weight = Number(weight);
        Object.freeze(this);
    }

    toJSON() {
        return {
            name: this.name,
            value: this.value,
            weight: this.weight,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new BehavioralFeature(json);
    }
}
