/**
 * ConcolicSnapshot — Immutable frozen snapshot of concolic exploration.
 */

import { ExplorationSession } from './ExplorationSession.js';
import { ExplorationGraph } from './ExplorationGraph.js';
import { ConcretePath } from './ConcretePath.js';
import { SymbolicPathCandidate } from './SymbolicPathCandidate.js';
import { TestCase } from '../testing/TestCase.js';
import { TestResult } from '../testing/TestResult.js';
import { ConcolicCoverage } from './ConcolicCoverage.js';
import { PathDivergence } from './PathDivergence.js';
import { ModelRefinement } from './ModelRefinement.js';

export class ConcolicSnapshot {
    /**
     * @param {object} params
     * @param {ExplorationSession|object} params.session
     * @param {ExplorationGraph|object} [params.explorationGraph]
     * @param {Array<ConcretePath|object>} [params.paths=[]]
     * @param {Array<SymbolicPathCandidate|object>} [params.candidates=[]]
     * @param {Array<TestCase|object>} [params.generatedTests=[]]
     * @param {Array<TestResult|object>} [params.validatedTests=[]]
     * @param {ConcolicCoverage|object} [params.coverage]
     * @param {Array<PathDivergence|object>} [params.divergences=[]]
     * @param {Array<ModelRefinement|object>} [params.refinements=[]]
     * @param {Array<string>} [params.unexploredBranches=[]]
     * @param {object} [params.statistics={}]
     * @param {string} [params.status='SUCCESS']
     */
    constructor({
        session = new ExplorationSession(),
        explorationGraph = new ExplorationGraph(),
        paths = [],
        candidates = [],
        generatedTests = [],
        validatedTests = [],
        coverage = new ConcolicCoverage(),
        divergences = [],
        refinements = [],
        unexploredBranches = [],
        statistics = {},
        status = 'SUCCESS',
    } = {}) {
        this.session = session instanceof ExplorationSession ? session : ExplorationSession.fromJSON(session);
        this.explorationGraph = explorationGraph instanceof ExplorationGraph ? explorationGraph : ExplorationGraph.fromJSON(explorationGraph);
        this.paths = Object.freeze(paths.map(p => p instanceof ConcretePath ? p : ConcretePath.fromJSON(p)));
        this.candidates = Object.freeze(candidates.map(c => c instanceof SymbolicPathCandidate ? c : SymbolicPathCandidate.fromJSON(c)));
        this.generatedTests = Object.freeze(generatedTests.map(t => t instanceof TestCase ? t : TestCase.fromJSON(t)));
        this.validatedTests = Object.freeze(validatedTests.map(v => v instanceof TestResult ? v : TestResult.fromJSON(v)));
        this.coverage = coverage instanceof ConcolicCoverage ? coverage : ConcolicCoverage.fromJSON(coverage);
        this.divergences = Object.freeze(divergences.map(d => d instanceof PathDivergence ? d : PathDivergence.fromJSON(d)));
        this.refinements = Object.freeze(refinements.map(r => r instanceof ModelRefinement ? r : ModelRefinement.fromJSON(r)));
        this.unexploredBranches = Object.freeze([...unexploredBranches]);
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
            session: this.session.toJSON(),
            explorationGraph: this.explorationGraph.toJSON(),
            paths: this.paths.map(p => p.toJSON()),
            candidates: this.candidates.map(c => c.toJSON()),
            generatedTests: this.generatedTests.map(t => t.toJSON()),
            validatedTests: this.validatedTests.map(v => v.toJSON()),
            coverage: this.coverage.toJSON(),
            divergences: this.divergences.map(d => d.toJSON()),
            refinements: this.refinements.map(r => r.toJSON()),
            unexploredBranches: this.unexploredBranches,
            statistics: this.statistics,
            status: this.status,
        };
    }

    static fromJSON(json) {
        if (!json) return new ConcolicSnapshot();
        return new ConcolicSnapshot({
            session: ExplorationSession.fromJSON(json.session),
            explorationGraph: ExplorationGraph.fromJSON(json.explorationGraph),
            paths: (json.paths || []).map(p => ConcretePath.fromJSON(p)),
            candidates: (json.candidates || []).map(c => SymbolicPathCandidate.fromJSON(c)),
            generatedTests: (json.generatedTests || []).map(t => TestCase.fromJSON(t)),
            validatedTests: (json.validatedTests || []).map(v => TestResult.fromJSON(v)),
            coverage: ConcolicCoverage.fromJSON(json.coverage),
            divergences: (json.divergences || []).map(d => PathDivergence.fromJSON(d)),
            refinements: (json.refinements || []).map(r => ModelRefinement.fromJSON(r)),
            unexploredBranches: json.unexploredBranches,
            statistics: json.statistics,
            status: json.status,
        });
    }
}
