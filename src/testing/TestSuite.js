/**
 * TestSuite — Immutable collection of generated TestCases with aggregate coverage.
 */

import { TestCase } from './TestCase.js';
import { Coverage } from './Coverage.js';

export class TestSuite {
    /**
     * @param {object} params
     * @param {string} [params.id]
     * @param {Array<TestCase|object>} [params.tests=[]]
     * @param {Coverage|object} [params.coverage=new Coverage()]
     * @param {Array<string>} [params.targets=[]]
     * @param {number} [params.workspaceVersion=1]
     * @param {string} [params.status='GENERATED']
     * @param {object} [params.generationMetadata={}]
     */
    constructor({
        id = null,
        tests = [],
        coverage = new Coverage(),
        targets = [],
        workspaceVersion = 1,
        status = 'GENERATED',
        generationMetadata = {},
    } = {}) {
        this.tests = Object.freeze(tests.map(t => t instanceof TestCase ? t : TestCase.fromJSON(t)));
        this.coverage = coverage instanceof Coverage ? coverage : Coverage.fromJSON(coverage);
        this.targets = Object.freeze([...targets]);
        this.workspaceVersion = Number(workspaceVersion) || 1;
        this.status = status;
        this.generationMetadata = Object.freeze({ ...generationMetadata });

        const hash = TestSuite.computeHash(JSON.stringify(this.tests.map(t => t.id)));
        this.id = id || `suite_${hash}`;
        Object.freeze(this);
    }

    static computeHash(str) {
        let hash = 5381;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) + hash) + str.charCodeAt(i);
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16);
    }

    get length() {
        return this.tests.length;
    }

    toJSON() {
        return {
            id: this.id,
            tests: this.tests.map(t => t.toJSON()),
            coverage: this.coverage.toJSON(),
            targets: this.targets,
            workspaceVersion: this.workspaceVersion,
            status: this.status,
            generationMetadata: this.generationMetadata,
        };
    }

    static fromJSON(json) {
        if (!json) return new TestSuite();
        return new TestSuite({
            id: json.id,
            tests: (json.tests || []).map(t => TestCase.fromJSON(t)),
            coverage: Coverage.fromJSON(json.coverage),
            targets: json.targets,
            workspaceVersion: json.workspaceVersion,
            status: json.status,
            generationMetadata: json.generationMetadata,
        });
    }
}
