/**
 * OracleCoverage — Measures coverage and evaluation status of test oracles.
 */

export class OracleCoverage {
    /**
     * @param {object} params
     * @param {number} [params.total=0]
     * @param {number} [params.passed=0]
     * @param {number} [params.failed=0]
     * @param {number} [params.inconclusive=0]
     * @param {object} [params.details={}]
     */
    constructor({
        total = 0,
        passed = 0,
        failed = 0,
        inconclusive = 0,
        details = {},
    } = {}) {
        this.total = Number(total);
        this.passed = Number(passed);
        this.failed = Number(failed);
        this.inconclusive = Number(inconclusive);
        this.details = Object.freeze({ ...details });
        this.passRatio = this.total > 0 ? (this.passed / this.total) : 1.0;
        Object.freeze(this);
    }

    toJSON() {
        return {
            total: this.total,
            passed: this.passed,
            failed: this.failed,
            inconclusive: this.inconclusive,
            passRatio: this.passRatio,
            details: this.details,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new OracleCoverage(json);
    }
}
