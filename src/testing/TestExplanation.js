/**
 * TestExplanation — Human- and machine-readable explanation of a generated test and its validation.
 */

export class TestExplanation {
    /**
     * @param {object} params
     * @param {string} params.testId
     * @param {string} params.targetKind
     * @param {string} params.targetId
     * @param {object} params.inputs
     * @param {string} [params.expectedBehavior='']
     * @param {string} [params.observedBehavior='']
     * @param {string} [params.status='VALIDATED']
     * @param {Array<string>} [params.steps=[]]
     */
    constructor({
        testId,
        targetKind,
        targetId,
        inputs = {},
        expectedBehavior = '',
        observedBehavior = '',
        status = 'VALIDATED',
        steps = [],
    } = {}) {
        this.testId = String(testId || '');
        this.targetKind = targetKind;
        this.targetId = String(targetId || '');
        this.inputs = Object.freeze({ ...inputs });
        this.expectedBehavior = expectedBehavior;
        this.observedBehavior = observedBehavior;
        this.status = status;
        this.steps = Object.freeze([...steps]);
        Object.freeze(this);
    }

    /**
     * Build explanation from TestCase and optional TestResult.
     * @param {import('./TestCase.js').TestCase} testCase
     * @param {import('./TestResult.js').TestResult|null} [testResult=null]
     * @returns {TestExplanation}
     */
    static fromTestCase(testCase, testResult = null) {
        if (!testCase) return new TestExplanation({ testId: 'unknown' });

        const steps = [];
        steps.push(`Target: ${testCase.targetKind} '${testCase.targetId}'`);

        const bindings = testCase.inputs?.toJSON()?.bindings || {};
        const inputDesc = Object.entries(bindings).map(([k, v]) => `${k} = ${v?.value ?? v}`).join(', ');
        steps.push(`Generated input: ${inputDesc || 'none'}`);

        const expDesc = testCase.expected?.expectedException ? `Expected exception '${testCase.expected.expectedException}'` : 'Expected normal execution';
        steps.push(expDesc);

        let obsDesc = 'Not executed yet';
        let status = 'GENERATED';

        if (testResult) {
            status = testResult.status;
            obsDesc = testResult.observation?.exception ? `Observed exception '${testResult.observation.exception.type}'` : 'Observed normal execution';
            steps.push(obsDesc);
            steps.push(`Result: ${testResult.status}`);
        }

        return new TestExplanation({
            testId: testCase.id,
            targetKind: testCase.targetKind,
            targetId: testCase.targetId,
            inputs: bindings,
            expectedBehavior: expDesc,
            observedBehavior: obsDesc,
            status,
            steps,
        });
    }

    toString() {
        return `[TestExplanation: ${this.testId}]\n` + this.steps.map(s => `  • ${s}`).join('\n');
    }

    toJSON() {
        return {
            testId: this.testId,
            targetKind: this.targetKind,
            targetId: this.targetId,
            inputs: this.inputs,
            expectedBehavior: this.expectedBehavior,
            observedBehavior: this.observedBehavior,
            status: this.status,
            steps: this.steps,
        };
    }
}
