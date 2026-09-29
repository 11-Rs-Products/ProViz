/**
 * MutationAnalyzer — Top-level entrypoint orchestrating mutation generation, execution, classification, and scoring.
 */

import { MutationGenerator } from './MutationGenerator.js';
import { MutationExecutor } from './MutationExecutor.js';
import { MutationClassifier } from './MutationClassifier.js';
import { MutationMatrix } from './MutationMatrix.js';
import { MutationScore } from './MutationScore.js';
import { MutationResult } from './MutationResult.js';
import { MutationCampaign } from './MutationCampaign.js';
import { MutationSession } from './MutationSession.js';
import { MutationSnapshot } from './MutationSnapshot.js';
import { MutationQueries } from './MutationQueries.js';
import { WorkspaceSnapshot } from '../workspace/WorkspaceSnapshot.js';

export class MutationAnalyzer {
    /**
     * Run a full mutation analysis campaign on source code or workspace.
     *
     * @param {WorkspaceSnapshot|string} workspace
     * @param {object} [options={}]
     * @param {Array<import('../testing/TestCase.js').TestCase>} [options.testSuite=[]]
     * @returns {MutationQueries}
     */
    static analyze(workspace, options = {}) {
        let sourceCode = '';
        if (typeof workspace === 'string') {
            sourceCode = workspace;
        } else if (workspace instanceof WorkspaceSnapshot) {
            const file = workspace.getAllFiles()[0];
            sourceCode = file ? file.content : '';
        }

        // 1. Generate mutation candidates
        const candidates = MutationGenerator.generateMutations(workspace, options);

        // 2. Execute candidates against test suite
        const executor = new MutationExecutor(options);
        const matrix = new MutationMatrix();
        const results = [];

        for (const cand of candidates) {
            const execRes = executor.executeMutant(cand, sourceCode, options.testSuite || [], options);
            const classification = MutationClassifier.classify(cand, execRes, sourceCode);

            // Record into matrix
            for (const detail of execRes.details) {
                matrix.addEntry({
                    testCaseId: detail.testId,
                    mutantId: cand.mutantId,
                    result: detail.status,
                    observation: detail,
                });
            }

            const updatedCand = cand.withStatus(classification.status);
            const mutResult = new MutationResult({
                mutant: updatedCand,
                status: classification.status,
                classification: classification.classification,
                testsRun: options.testSuite?.map(t => t.testId) || ['test_0'],
                killingTests: execRes.killingTests,
                survivingTests: execRes.survivingTests,
                explanation: classification.explanation,
            });

            results.push(mutResult);
        }

        // 3. Compute score and construct campaign
        const score = MutationScore.compute(results);
        const campaign = new MutationCampaign({
            workspaceSnapshot: workspace,
            mutants: candidates,
            results,
            matrix,
            score,
        });

        const session = new MutationSession({
            workspaceSnapshotId: workspace?.snapshotId || 'snap_default',
            sourceRevision: workspace?.version || 1,
        });

        const snapshot = new MutationSnapshot({
            session,
            campaign,
            candidates,
            results,
            matrix,
            score,
            status: 'SUCCESS',
        });

        return new MutationQueries(snapshot);
    }
}
