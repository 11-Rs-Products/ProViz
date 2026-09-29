/**
 * TestingQueries — Unified, deterministic, read-only query interface for generated tests, results, and coverage.
 */

import { TestExplanation } from './TestExplanation.js';

export class TestingQueries {
    /**
     * @param {import('./TestSnapshot.js').TestSnapshot} snapshot
     */
    constructor(snapshot) {
        this.snapshot = snapshot;
        this._testMap = new Map();
        this._resultMap = new Map();
        this._suiteMap = new Map();

        if (this.snapshot) {
            for (const t of this.snapshot.tests) this._testMap.set(t.id, t);
            for (const r of this.snapshot.results) this._resultMap.set(r.testId, r);
            for (const s of this.snapshot.suites) this._suiteMap.set(s.id, s);
        }
    }

    getTests() {
        return this.snapshot?.tests || [];
    }

    getTestCase(testId) {
        return this._testMap.get(testId) || null;
    }

    getTestResults() {
        return this.snapshot?.results || [];
    }

    getTestResult(testId) {
        return this._resultMap.get(testId) || null;
    }

    getTestSuites() {
        return this.snapshot?.suites || [];
    }

    getTestSuite(suiteId) {
        return this._suiteMap.get(suiteId) || null;
    }

    getCoverage() {
        return this.snapshot?.coverage || null;
    }

    getCoverageTargets() {
        const cov = this.snapshot?.coverage;
        if (!cov) return [];
        return [
            ...cov.lines.map(l => ({ type: 'LINE', id: l })),
            ...cov.branches.map(b => ({ type: 'BRANCH', id: b })),
        ];
    }

    getUncoveredTargets() {
        return [];
    }

    getTestExplanation(testId) {
        const tc = this.getTestCase(testId);
        if (!tc) return null;
        const res = this.getTestResult(testId);
        return TestExplanation.fromTestCase(tc, res);
    }

    getTestingSnapshot() {
        return this.snapshot;
    }
}
