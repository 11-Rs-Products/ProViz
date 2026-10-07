/**
 * ProbabilityInterval — Represents lower bound, upper bound, point estimate, and confidence level.
 */

export class ProbabilityInterval {
    constructor(param = {}, upper = 1.0, point = 0.5, confidenceLevel = 0.95) {
        let l = 0.0;
        let u = 1.0;
        let p = 0.5;
        let cl = 0.95;

        if (typeof param === 'number') {
            l = param;
            u = typeof upper === 'number' ? upper : 1.0;
            p = typeof point === 'number' ? point : ((l + u) / 2);
            cl = typeof confidenceLevel === 'number' ? confidenceLevel : 0.95;
        } else if (param && typeof param === 'object') {
            l = param.lower ?? 0.0;
            u = param.upper ?? 1.0;
            p = param.point ?? ((l + u) / 2);
            cl = param.confidenceLevel ?? 0.95;
        }

        this.lower = Math.max(0, Math.min(1, Number(l) || 0));
        this.upper = Math.max(this.lower, Math.min(1, Number(u) || 1));
        this.point = Math.max(this.lower, Math.min(this.upper, Number(p) || ((this.lower + this.upper) / 2)));
        this.confidenceLevel = Number(cl) || 0.95;
        this.width = this.upper - this.lower;
        Object.freeze(this);
    }

    contains(value) {
        const val = Number(value);
        return val >= this.lower && val <= this.upper;
    }

    toJSON() {
        return {
            lower: this.lower,
            upper: this.upper,
            point: this.point,
            confidenceLevel: this.confidenceLevel,
            width: this.width,
        };
    }

    static fromJSON(json) {
        if (!json) return new ProbabilityInterval();
        return new ProbabilityInterval(json);
    }
}
