/**
 * TestSnapshot — Immutable frozen snapshot of generated tests, suites, results, and coverage.
 */

import { TestCase } from './TestCase.js';
import { TestSuite } from './TestSuite.js';
import { TestResult } from './TestResult.js';
import { Coverage } from './Coverage.js';

export class TestSnapshot {
    /**
     * @param {object} params
     * @param {number} [params.version=1]
     * @param {number} [params.workspaceVersion=1]
     * @param {number} [params.symbolicVersion=1]
     * @param {number} [params.verificationVersion=1]
     * @param {object} [params.generationConfiguration={}]
     * @param {Array<TestCase|object>} [params.tests=[]]
     * @param {Array<TestSuite|object>} [params.suites=[]]
     * @param {Array<TestResult|object>} [params.results=[]]
     * @param {Coverage|object} [params.coverage=new Coverage()]
     * @param {object} [params.statistics={}]
     * @param {string} [params.status='SUCCESS']
     */
    constructor({
        version = 1,
        workspaceVersion = 1,
        symbolicVersion = 1,
        verificationVersion = 1,
        generationConfiguration = {},
        tests = [],
        suites = [],
        results = [],
        coverage = new Coverage(),
        statistics = {},
        status = 'SUCCESS',
    } = {}) {
        this.version = version;
        this.workspaceVersion = Number(workspaceVersion) || 1;
        this.symbolicVersion = Number(symbolicVersion) || 1;
        this.verificationVersion = Number(verificationVersion) || 1;
        this.generationConfiguration = Object.freeze({ ...generationConfiguration });
        this.tests = Object.freeze(tests.map(t => t instanceof TestCase ? t : TestCase.fromJSON(t)));
        this.suites = Object.freeze(suites.map(s => s instanceof TestSuite ? s : TestSuite.fromJSON(s)));
        this.results = Object.freeze(results.map(r => r instanceof TestResult ? r : TestResult.fromJSON(r)));
        this.coverage = coverage instanceof Coverage ? coverage : Coverage.fromJSON(coverage);
        this.statistics = Object.freeze({ ...statistics });
        this.status = status;
        Object.freeze(this);
    }

    equals(other) {
        if (!other) return false;
        return JSON.stringify(this.toJSON()) === JSON.stringify(other.toJSON());
    }

    toJSON() {
        return {
            version: this.version,
            workspaceVersion: this.workspaceVersion,
            symbolicVersion: this.symbolicVersion,
            verificationVersion: this.verificationVersion,
            generationConfiguration: this.generationConfiguration,
            tests: this.tests.map(t => t.toJSON()),
            suites: this.suites.map(s => s.toJSON()),
            results: this.results.map(r => r.toJSON()),
            coverage: this.coverage.toJSON(),
            statistics: this.statistics,
            status: this.status,
        };
    }

    static fromJSON(json) {
        if (!json) return new TestSnapshot();
        return new TestSnapshot({
            version: json.version,
            workspaceVersion: json.workspaceVersion,
            symbolicVersion: json.symbolicVersion,
            verificationVersion: json.verificationVersion,
            generationConfiguration: json.generationConfiguration,
            tests: (json.tests || []).map(t => TestCase.fromJSON(t)),
            suites: (json.suites || []).map(s => TestSuite.fromJSON(s)),
            results: (json.results || []).map(r => TestResult.fromJSON(r)),
            coverage: Coverage.fromJSON(json.coverage),
            statistics: json.statistics,
            status: json.status,
        });
    }
}
