/**
 * RegressionCoverage — Aggregate metrics on regression testing coverage across impacted areas.
 */

import { ChangeCoverage } from './ChangeCoverage.js';

export class RegressionCoverage {
    /**
     * @param {object} params
     * @param {ChangeCoverage|object} [params.changeCoverage=null]
     * @param {number} [params.selectedTestsCount=0]
     * @param {number} [params.totalTestsCount=0]
     * @param {number} [params.executedTestsCount=0]
     * @param {object} [params.metadata={}]
     */
    constructor({
        changeCoverage = null,
        selectedTestsCount = 0,
        totalTestsCount = 0,
        executedTestsCount = 0,
        metadata = {},
    } = {}) {
        this.changeCoverage = changeCoverage instanceof ChangeCoverage ? changeCoverage : (changeCoverage ? ChangeCoverage.fromJSON(changeCoverage) : new ChangeCoverage());
        this.selectedTestsCount = selectedTestsCount;
        this.totalTestsCount = totalTestsCount;
        this.executedTestsCount = executedTestsCount;
        this.metadata = Object.freeze({ ...metadata });
        Object.freeze(this);
    }

    get testSelectionRatio() {
        return this.totalTestsCount > 0 ? this.selectedTestsCount / this.totalTestsCount : 1.0;
    }

    toJSON() {
        return {
            changeCoverage: this.changeCoverage.toJSON(),
            selectedTestsCount: this.selectedTestsCount,
            totalTestsCount: this.totalTestsCount,
            executedTestsCount: this.executedTestsCount,
            testSelectionRatio: this.testSelectionRatio,
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new RegressionCoverage({
            changeCoverage: ChangeCoverage.fromJSON(json.changeCoverage),
            selectedTestsCount: json.selectedTestsCount,
            totalTestsCount: json.totalTestsCount,
            executedTestsCount: json.executedTestsCount,
            metadata: json.metadata,
        });
    }
}
