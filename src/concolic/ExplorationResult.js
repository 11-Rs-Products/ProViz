/**
 * ExplorationResult — Comprehensive output of a concolic exploration session.
 */

import { ExplorationSession } from './ExplorationSession.js';
import { ExplorationGraph } from './ExplorationGraph.js';
import { ConcolicCoverage } from './ConcolicCoverage.js';
import { EXPLORATION_STATUSES } from './ExplorationStatus.js';

export class ExplorationResult {
    /**
     * @param {object} params
     * @param {ExplorationSession|object} params.session
     * @param {string} [params.status=EXPLORATION_STATUSES.COMPLETED]
     * @param {Array<import('./ConcretePath.js').ConcretePath>} [params.paths=[]]
     * @param {ExplorationGraph|object} [params.explorationGraph]
     * @param {Array<import('../testing/TestCase.js').TestCase>} [params.generatedTests=[]]
     * @param {Array<import('../testing/TestResult.js').TestResult>} [params.validatedTests=[]]
     * @param {ConcolicCoverage|object} [params.coverage]
     * @param {Array<object>} [params.divergences=[]]
     * @param {Array<object>} [params.refinements=[]]
     * @param {Array<string>} [params.unexploredBranches=[]]
     * @param {object} [params.statistics={}]
     */
    constructor({
        session,
        status = EXPLORATION_STATUSES.COMPLETED,
        paths = [],
        explorationGraph = new ExplorationGraph(),
        generatedTests = [],
        validatedTests = [],
        coverage = new ConcolicCoverage(),
        divergences = [],
        refinements = [],
        unexploredBranches = [],
        statistics = {},
    } = {}) {
        this.session = session instanceof ExplorationSession ? session : ExplorationSession.fromJSON(session);
        this.status = status;
        this.paths = Object.freeze([...paths]);
        this.explorationGraph = explorationGraph instanceof ExplorationGraph ? explorationGraph : ExplorationGraph.fromJSON(explorationGraph);
        this.generatedTests = Object.freeze([...generatedTests]);
        this.validatedTests = Object.freeze([...validatedTests]);
        this.coverage = coverage instanceof ConcolicCoverage ? coverage : ConcolicCoverage.fromJSON(coverage);
        this.divergences = Object.freeze([...divergences]);
        this.refinements = Object.freeze([...refinements]);
        this.unexploredBranches = Object.freeze([...unexploredBranches]);
        this.statistics = Object.freeze({ ...statistics });
        Object.freeze(this);
    }

    toJSON() {
        return {
            session: this.session.toJSON(),
            status: this.status,
            paths: this.paths.map(p => p.toJSON ? p.toJSON() : p),
            explorationGraph: this.explorationGraph.toJSON(),
            generatedTests: this.generatedTests.map(t => t.toJSON ? t.toJSON() : t),
            validatedTests: this.validatedTests.map(v => v.toJSON ? v.toJSON() : v),
            coverage: this.coverage.toJSON(),
            divergences: this.divergences.map(d => d.toJSON ? d.toJSON() : d),
            refinements: this.refinements.map(r => r.toJSON ? r.toJSON() : r),
            unexploredBranches: this.unexploredBranches,
            statistics: this.statistics,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new ExplorationResult({
            session: ExplorationSession.fromJSON(json.session),
            status: json.status,
            paths: json.paths,
            explorationGraph: ExplorationGraph.fromJSON(json.explorationGraph),
            generatedTests: json.generatedTests,
            validatedTests: json.validatedTests,
            coverage: ConcolicCoverage.fromJSON(json.coverage),
            divergences: json.divergences,
            refinements: json.refinements,
            unexploredBranches: json.unexploredBranches,
            statistics: json.statistics,
        });
    }
}
