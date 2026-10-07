/**
 * Probability — Encapsulates a validated probability value between 0.0 and 1.0.
 */

export class Probability {
    /**
     * @param {number} value
     */
    constructor(value = 0.5) {
        const num = Number(value);
        if (Number.isNaN(num) || num < 0 || num > 1) {
            this.value = Math.max(0, Math.min(1, Number.isNaN(num) ? 0.5 : num));
        } else {
            this.value = num;
        }
        Object.freeze(this);
    }

    get complement() {
        return new Probability(1.0 - this.value);
    }

    multiply(other) {
        const otherVal = other instanceof Probability ? other.value : Number(other);
        return new Probability(this.value * otherVal);
    }

    toString() {
        return this.value.toFixed(4);
    }

    toJSON() {
        return {
            value: this.value,
        };
    }

    static fromJSON(json) {
        if (!json) return new Probability();
        return new Probability(json.value !== undefined ? json.value : json);
    }
}
