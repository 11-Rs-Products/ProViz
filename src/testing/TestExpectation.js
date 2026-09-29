/**
 * TestExpectation — Immutable expected outcome of a TestCase execution.
 */

export class TestExpectation {
    /**
     * @param {object} params
     * @param {string|null} [params.expectedPathId=null]
     * @param {string|null} [params.expectedException=null]
     * @param {*} [params.expectedReturnValue=undefined]
     * @param {string|null} [params.expectedProperty=null]
     * @param {string|null} [params.expectedFinding=null]
     * @param {Array<string>} [params.expectedConstraints=[]]
     * @param {object|null} [params.expectedCoverage=null]
     * @param {object} [params.metadata={}]
     */
    constructor({
        expectedPathId = null,
        expectedException = null,
        expectedReturnValue = undefined,
        expectedProperty = null,
        expectedFinding = null,
        expectedConstraints = [],
        expectedCoverage = null,
        metadata = {},
    } = {}) {
        this.expectedPathId = expectedPathId;
        this.expectedException = expectedException;
        this.expectedReturnValue = expectedReturnValue;
        this.expectedProperty = expectedProperty;
        this.expectedFinding = expectedFinding;
        this.expectedConstraints = Object.freeze([...expectedConstraints]);
        this.expectedCoverage = expectedCoverage ? Object.freeze({ ...expectedCoverage }) : null;
        this.metadata = Object.freeze({ ...metadata });
        Object.freeze(this);
    }

    toJSON() {
        return {
            expectedPathId: this.expectedPathId,
            expectedException: this.expectedException,
            expectedReturnValue: this.expectedReturnValue,
            expectedProperty: this.expectedProperty,
            expectedFinding: this.expectedFinding,
            expectedConstraints: this.expectedConstraints,
            expectedCoverage: this.expectedCoverage,
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json) return new TestExpectation();
        return new TestExpectation(json);
    }
}
