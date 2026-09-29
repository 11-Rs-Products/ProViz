/**
 * ConcolicEngine — Core orchestrator executing the concolic / CEGAR exploration loop.
 */

import { ExplorationSession } from './ExplorationSession.js';
import { ExplorationGraph } from './ExplorationGraph.js';
import { ConcolicExecutor } from './ConcolicExecutor.js';
import { PathCandidateGenerator } from './PathCandidateGenerator.js';
import { PathConstraintSolver } from './PathConstraintSolver.js';
import { ConcreteAssignmentBuilder } from './ConcreteAssignmentBuilder.js';
import { ConcolicCoverage } from './ConcolicCoverage.js';
import { ConcolicSnapshot } from './ConcolicSnapshot.js';
import { TestCase } from '../testing/TestCase.js';
import { TestInput } from '../testing/TestInput.js';

export class ConcolicEngine {
    /**
     * @param {object} [config]
     * @param {number} [config.maxPaths=20]
     * @param {number} [config.maxExplorations=50]
     * @param {number} [config.timeoutMs=2000]
     * @param {string} [config.strategy='DFS']
     */
    constructor({ maxPaths = 20, maxExplorations = 50, timeoutMs = 2000, strategy = 'DFS' } = {}) {
        this.config = { maxPaths, maxExplorations, timeoutMs, strategy };
        this.executor = new ConcolicExecutor();
    }

    /**
     * Run concolic exploration over source code and CFG.
     * @param {object} params
     * @param {string} params.sourceCode
     * @param {import('../analysis/ControlFlowGraph.js').ControlFlowGraph|null} [params.cfg=null]
     * @param {Array<TestCase>} [params.initialTests=[]]
     * @returns {ConcolicSnapshot}
     */
    explore({ sourceCode = '', cfg = null, initialTests = [] } = {}) {
        const session = new ExplorationSession(this.config);
        const graph = new ExplorationGraph();
        let coverage = new ConcolicCoverage();

        const exploredPaths = [];
        const candidates = [];
        const generatedTests = [];
        const validatedTests = [];
        const divergences = [];
        const refinements = [];

        // 1. Initial Test Setup
        const testQueue = [...initialTests];
        if (testQueue.length === 0) {
            testQueue.push(new TestCase({
                targetId: 'seed_init',
                inputs: new TestInput(),
            }));
        }

        const candidateQueue = [];
        const startTime = Date.now();

        while ((testQueue.length > 0 || candidateQueue.length > 0) && exploredPaths.length < this.config.maxPaths) {
            if (Date.now() - startTime > this.config.timeoutMs) break;

            let currentTest = null;
            let currentCandidate = null;

            if (testQueue.length > 0) {
                currentTest = testQueue.shift();
            } else if (candidateQueue.length > 0) {
                currentCandidate = candidateQueue.shift();
                currentTest = new TestCase({
                    targetId: `cand_${currentCandidate.candidateId}`,
                    inputs: ConcreteAssignmentBuilder.buildInput(currentCandidate.solverResult?.model || {}),
                });
            }

            if (!currentTest) break;

            // 2. Execute concrete input
            const execRes = this.executor.execute(currentTest, sourceCode, { cfg, candidate: currentCandidate });
            exploredPaths.push(execRes.concretePath);
            generatedTests.push(currentTest);
            validatedTests.push(execRes.testResult);

            if (execRes.divergence) divergences.push(execRes.divergence);
            if (execRes.refinement) refinements.push(execRes.refinement);

            // 3. Update exploration graph & coverage
            graph.addPath(execRes.concretePath);
            if (execRes.observation.coverage) {
                coverage = coverage.recordIteration(execRes.observation.coverage, exploredPaths.length);
            }

            // 4. Generate alternative branch candidates
            const newCandidates = PathCandidateGenerator.generateCandidates(execRes.concretePath, { strategy: this.config.strategy });
            for (const cand of newCandidates) {
                const solveRes = PathConstraintSolver.solveCandidate(cand);
                const resolvedCand = cand.withStatus(solveRes.status, null, solveRes);
                candidates.push(resolvedCand);

                if (solveRes.status === 'SAT') {
                    candidateQueue.push(resolvedCand);
                } else if (solveRes.status === 'UNSAT') {
                    if (cand.branchToNegate?.branchId) {
                        graph.markExploredBranch(cand.branchToNegate.branchId);
                    }
                }
            }
        }

        return new ConcolicSnapshot({
            session,
            explorationGraph: graph,
            paths: exploredPaths,
            candidates,
            generatedTests,
            validatedTests,
            coverage,
            divergences,
            refinements,
            unexploredBranches: graph.getUnexploredBranches(),
            statistics: {
                totalPaths: exploredPaths.length,
                totalCandidates: candidates.length,
                satCandidates: candidates.filter(c => c.status === 'SAT').length,
                unsatCandidates: candidates.filter(c => c.status === 'UNSAT').length,
            },
            status: 'SUCCESS',
        });
    }
}
