/**
 * TestingEngine — Central test generation and dynamic validation engine.
 */

import { FindingTestGenerator } from './FindingTestGenerator.js';
import { PathTestGenerator } from './PathTestGenerator.js';
import { CounterexampleGenerator } from './CounterexampleGenerator.js';
import { TestSuiteBuilder } from './TestSuiteBuilder.js';
import { TestExecutor } from './TestExecutor.js';
import { TestValidator } from './TestValidator.js';
import { TestSnapshot } from './TestSnapshot.js';

export class TestingEngine {
    /**
     * @param {object} [config]
     * @param {number} [config.maxTests=50]
     * @param {boolean} [config.deduplicate=true]
     * @param {boolean} [config.minimize=false]
     */
    constructor({ maxTests = 50, deduplicate = true, minimize = false } = {}) {
        this.config = { maxTests, deduplicate, minimize };
        this.executor = new TestExecutor();
    }

    /**
     * Generate and validate test scenarios for symbolic analysis artifacts.
     * @param {object} params
     * @param {string} [params.sourceCode='']
     * @param {Array<object>} [params.findings=[]]
     * @param {Array<object>} [params.paths=[]]
     * @param {Array<object>} [params.counterexamples=[]]
     * @param {number} [params.workspaceVersion=1]
     * @returns {TestSnapshot}
     */
    generateAndValidate({
        sourceCode = '',
        findings = [],
        paths = [],
        counterexamples = [],
        workspaceVersion = 1,
    } = {}) {
        const builder = new TestSuiteBuilder({
            workspaceVersion,
            deduplicate: this.config.deduplicate,
            minimize: this.config.minimize,
        });

        // 1. Generate tests for findings
        const findingTests = FindingTestGenerator.generateForFindings(findings, { workspaceVersion });
        builder.addTests(findingTests);

        // 2. Generate tests for counterexamples
        for (const ce of counterexamples) {
            const tc = CounterexampleGenerator.generate(ce, { workspaceVersion });
            if (tc) builder.addTest(tc);
        }

        // 3. Generate tests for feasible paths
        const pathTests = PathTestGenerator.generateForPaths(paths.filter(p => p.isFeasible), { workspaceVersion });
        builder.addTests(pathTests);

        const suite = builder.build();
        const results = [];

        // 4. Execute and validate generated test cases
        for (const tc of suite.tests) {
            const obs = this.executor.execute(tc, sourceCode);
            const res = TestValidator.validate(tc, obs);
            results.push(res);
        }

        return new TestSnapshot({
            workspaceVersion,
            generationConfiguration: this.config,
            tests: suite.tests,
            suites: [suite],
            results,
            coverage: suite.coverage,
            statistics: {
                totalGenerated: suite.tests.length,
                totalPassed: results.filter(r => r.isSuccess()).length,
            },
            status: 'SUCCESS',
        });
    }
}
