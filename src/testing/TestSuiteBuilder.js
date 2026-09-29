/**
 * TestSuiteBuilder — Builder for constructing optimized, deduplicated TestSuites.
 */

import { TestSuite } from './TestSuite.js';
import { TestDeduplicator } from './TestDeduplicator.js';
import { TestMinimizer } from './TestMinimizer.js';
import { Coverage } from './Coverage.js';

export class TestSuiteBuilder {
    /**
     * @param {object} [options]
     * @param {number} [options.workspaceVersion=1]
     * @param {boolean} [options.deduplicate=true]
     * @param {boolean} [options.minimize=false]
     */
    constructor({ workspaceVersion = 1, deduplicate = true, minimize = false } = {}) {
        this.workspaceVersion = workspaceVersion;
        this.shouldDeduplicate = deduplicate;
        this.shouldMinimize = minimize;
        this.tests = [];
        this.targets = new Set();
        this.coverage = new Coverage();
    }

    addTest(testCase) {
        if (!testCase) return this;
        let t = testCase;
        if (this.shouldMinimize) {
            t = TestMinimizer.minimize(t);
        }
        this.tests.push(t);
        if (t.targetId) this.targets.add(t.targetId);
        return this;
    }

    addTests(testCases = []) {
        for (const tc of testCases) this.addTest(tc);
        return this;
    }

    setCoverage(coverage) {
        if (coverage instanceof Coverage) this.coverage = coverage;
        return this;
    }

    build() {
        let finalTests = this.tests;
        if (this.shouldDeduplicate) {
            finalTests = TestDeduplicator.deduplicate(finalTests);
        }

        return new TestSuite({
            workspaceVersion: this.workspaceVersion,
            tests: finalTests,
            coverage: this.coverage,
            targets: Array.from(this.targets),
            status: 'READY',
            generationMetadata: {
                totalGenerated: this.tests.length,
                totalRetained: finalTests.length,
                deduplicated: this.shouldDeduplicate,
                minimized: this.shouldMinimize,
            },
        });
    }
}
