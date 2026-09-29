/**
 * RangeValue — Numeric interval representation for abstract range interpretation.
 */

export class RangeValue {
    /**
     * @param {number} [min=-Infinity]
     * @param {number} [max=Infinity]
     * @param {object} [options]
     * @param {boolean} [options.isInteger=true]
     * @param {boolean} [options.isEmpty=false]
     */
    constructor(min = -Infinity, max = Infinity, { isInteger = true, isEmpty = false } = {}) {
        this.min = isEmpty ? Infinity : (typeof min === 'number' ? min : -Infinity);
        this.max = isEmpty ? -Infinity : (typeof max === 'number' ? max : Infinity);
        this.isInteger = Boolean(isInteger);
        this.isEmpty = Boolean(isEmpty || this.min > this.max);
        if (this.isEmpty) {
            this.min = Infinity;
            this.max = -Infinity;
        }
        Object.freeze(this);
    }

    static unknown() {
        return new RangeValue(-Infinity, Infinity, { isInteger: false });
    }

    static exact(val, isInteger = Number.isInteger(val)) {
        return new RangeValue(val, val, { isInteger });
    }

    static empty() {
        return new RangeValue(Infinity, -Infinity, { isEmpty: true });
    }

    static fromInterval(min, max, isInteger = true) {
        return new RangeValue(min, max, { isInteger });
    }

    isExact() {
        return !this.isEmpty && this.min === this.max && Number.isFinite(this.min);
    }

    isUnknown() {
        return this.min === -Infinity && this.max === Infinity;
    }

    contains(val) {
        if (this.isEmpty) return false;
        return val >= this.min && val <= this.max;
    }

    containsZero() {
        return this.contains(0);
    }

    containsNegative() {
        if (this.isEmpty) return false;
        return this.min < 0;
    }

    isStrictlyPositive() {
        if (this.isEmpty) return false;
        return this.min > 0;
    }

    isStrictlyNegative() {
        if (this.isEmpty) return false;
        return this.max < 0;
    }

    add(other) {
        if (this.isEmpty || other.isEmpty) return RangeValue.empty();
        const nMin = this.min === -Infinity || other.min === -Infinity ? -Infinity : this.min + other.min;
        const nMax = this.max === Infinity || other.max === Infinity ? Infinity : this.max + other.max;
        return new RangeValue(nMin, nMax, { isInteger: this.isInteger && other.isInteger });
    }

    sub(other) {
        if (this.isEmpty || other.isEmpty) return RangeValue.empty();
        const nMin = this.min === -Infinity || other.max === Infinity ? -Infinity : this.min - other.max;
        const nMax = this.max === Infinity || other.min === -Infinity ? Infinity : this.max - other.min;
        return new RangeValue(nMin, nMax, { isInteger: this.isInteger && other.isInteger });
    }

    mul(other) {
        if (this.isEmpty || other.isEmpty) return RangeValue.empty();
        if (this.isExact() && this.min === 0) return RangeValue.exact(0, true);
        if (other.isExact() && other.min === 0) return RangeValue.exact(0, true);

        const products = [];
        if (Number.isFinite(this.min) && Number.isFinite(other.min)) products.push(this.min * other.min);
        if (Number.isFinite(this.min) && Number.isFinite(other.max)) products.push(this.min * other.max);
        if (Number.isFinite(this.max) && Number.isFinite(other.min)) products.push(this.max * other.min);
        if (Number.isFinite(this.max) && Number.isFinite(other.max)) products.push(this.max * other.max);

        if (products.length === 0) {
            return RangeValue.unknown();
        }

        let nMin = Math.min(...products);
        let nMax = Math.max(...products);

        if (this.min === -Infinity || other.min === -Infinity || this.max === Infinity || other.max === Infinity) {
            if (this.containsNegative() && other.containsNegative()) nMax = Infinity;
            if (this.containsNegative() || other.containsNegative()) nMin = -Infinity;
            if (this.min >= 0 && other.min >= 0) {
                nMin = Math.min(this.min * other.min, nMin);
                nMax = Infinity;
            }
        }

        return new RangeValue(nMin, nMax, { isInteger: this.isInteger && other.isInteger });
    }

    div(other) {
        if (this.isEmpty || other.isEmpty) return RangeValue.empty();
        if (other.isExact() && other.min === 0) return RangeValue.empty(); // division by zero is undefined
        if (other.containsZero()) {
            return RangeValue.unknown(); // could be unbounded
        }
        if (this.isExact() && other.isExact()) {
            const val = this.min / other.min;
            return RangeValue.exact(val, false);
        }
        return new RangeValue(-Infinity, Infinity, { isInteger: false });
    }

    mod(other) {
        if (this.isEmpty || other.isEmpty) return RangeValue.empty();
        if (other.isExact() && other.min > 0) {
            return new RangeValue(0, other.min - 1, { isInteger: this.isInteger && other.isInteger });
        }
        return RangeValue.unknown();
    }

    abs() {
        if (this.isEmpty) return RangeValue.empty();
        if (this.min >= 0) return this;
        if (this.max <= 0) return new RangeValue(-this.max, -this.min, { isInteger: this.isInteger });
        return new RangeValue(0, Math.max(Math.abs(this.min), Math.abs(this.max)), { isInteger: this.isInteger });
    }

    union(other) {
        if (this.isEmpty) return other;
        if (other.isEmpty) return this;
        return new RangeValue(
            Math.min(this.min, other.min),
            Math.max(this.max, other.max),
            { isInteger: this.isInteger && other.isInteger }
        );
    }

    intersect(other) {
        if (this.isEmpty || other.isEmpty) return RangeValue.empty();
        const nMin = Math.max(this.min, other.min);
        const nMax = Math.min(this.max, other.max);
        if (nMin > nMax) return RangeValue.empty();
        return new RangeValue(nMin, nMax, { isInteger: this.isInteger || other.isInteger });
    }

    widen(other) {
        if (this.isEmpty) return other;
        if (other.isEmpty) return this;
        const nMin = other.min < this.min ? -Infinity : this.min;
        const nMax = other.max > this.max ? Infinity : this.max;
        return new RangeValue(nMin, nMax, { isInteger: this.isInteger && other.isInteger });
    }

    equals(other) {
        if (!other || !(other instanceof RangeValue)) return false;
        if (this.isEmpty && other.isEmpty) return true;
        return this.min === other.min && this.max === other.max && this.isInteger === other.isInteger;
    }

    toString() {
        if (this.isEmpty) return '∅';
        const l = this.min === -Infinity ? '-∞' : String(this.min);
        const u = this.max === Infinity ? '+∞' : String(this.max);
        return `[${l}, ${u}]`;
    }

    toJSON() {
        return {
            min: this.min,
            max: this.max,
            isInteger: this.isInteger,
            isEmpty: this.isEmpty,
        };
    }

    static fromJSON(json) {
        if (!json) return RangeValue.unknown();
        return new RangeValue(json.min, json.max, {
            isInteger: json.isInteger,
            isEmpty: json.isEmpty,
        });
    }
}
