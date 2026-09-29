/**
 * RepairEngine — Central orchestration engine for root-cause analysis, patch synthesis, and layered validation.
 */

import { RepairGenerator } from './RepairGenerator.js';
import { StaticRepairValidator } from './StaticRepairValidator.js';
import { SymbolicRepairValidator } from './SymbolicRepairValidator.js';
import { ConcolicRepairValidator } from './ConcolicRepairValidator.js';
import { RegressionValidator } from './RegressionValidator.js';
import { ContractValidator } from './ContractValidator.js';
import { BehavioralDelta } from './BehavioralDelta.js';
import { RepairValidation } from './RepairValidation.js';
import { RepairExplanation } from './RepairExplanation.js';
import { RepairResult, REPAIR_RESULT_STATUS } from './RepairResult.js';
import { RepairSession } from './RepairSession.js';
import { RepairSnapshot } from './RepairSnapshot.js';
import { REPAIR_CANDIDATE_STATUS } from './RepairCandidate.js';

export class RepairEngine {
    /**
     * @param {object} [config={}]
     */
    constructor(config = {}) {
        this.config = {
            maxCandidates: 10,
            timeoutMs: 5000,
            ...config,
        };
    }

    /**
     * Generate repair candidates for a finding.
     * @param {object} finding
     * @param {object} context
     * @returns {Array<import('./RepairCandidate.js').RepairCandidate>}
     */
    generateCandidates(finding, context = {}) {
        return RepairGenerator.generateRepairs(finding, context, this.config);
    }

    /**
     * Perform multi-layered validation on a repair candidate.
     *
     * @param {import('./RepairCandidate.js').RepairCandidate} candidate
     * @param {import('../workspace/WorkspaceSnapshot.js').WorkspaceSnapshot|string} workspace
     * @param {object} [context={}]
     * @returns {RepairResult}
     */
    validateCandidate(candidate, workspace, context = {}) {
        // 1. Static validation
        const staticRes = StaticRepairValidator.validate(candidate, workspace);
        const patchedCode = staticRes.patchedCode;

        // 2. Symbolic validation
        const symbolicRes = SymbolicRepairValidator.validate(candidate, patchedCode, context);

        // 3. Concolic validation
        const concolicRes = ConcolicRepairValidator.validate(candidate, patchedCode, context);

        // 4. Regression validation
        const regressionRes = RegressionValidator.validate(candidate, patchedCode, context.testSuite || []);

        // 5. Contract validation
        const contractRes = ContractValidator.validate(candidate, patchedCode, context.contracts || []);

        // 6. Behavioral delta
        const behavioralDelta = BehavioralDelta.compare(context.originalObservation, concolicRes.observation);

        // Determine overall status
        const isOverallValid = staticRes.valid && regressionRes.valid;
        const candidateStatus = isOverallValid
            ? REPAIR_CANDIDATE_STATUS.REGRESSION_VALIDATED
            : REPAIR_CANDIDATE_STATUS.REJECTED;

        const resultStatus = isOverallValid
            ? REPAIR_RESULT_STATUS.VALIDATED
            : REPAIR_RESULT_STATUS.REJECTED;

        const validation = new RepairValidation({
            syntax: true,
            staticAnalysis: staticRes,
            symbolic: symbolicRes,
            concolic: concolicRes,
            regression: regressionRes,
            contract: contractRes,
            behavioral: behavioralDelta,
            status: resultStatus,
        });

        const rootCause = candidate.analysis?.rootCause || {};
        const explanation = new RepairExplanation({
            finding: context.finding || { kind: candidate.findingIds[0] },
            rootCause,
            evidence: ['Static proof', 'Dynamic execution avoidance'],
            transformation: candidate.analysis?.transformation,
            sourceEdits: candidate.patch.edits,
            expectedEffect: `Applied ${candidate.strategy} at line ${candidate.targetLocations[0]?.line || 1}`,
            staticValidation: staticRes,
            symbolicValidation: symbolicRes,
            dynamicValidation: concolicRes,
            regressionValidation: regressionRes,
        });

        const updatedCandidate = candidate.withValidation(validation, candidateStatus);

        return new RepairResult({
            candidate: updatedCandidate,
            findingResolution: staticRes.resolution,
            validation,
            behavioralDelta,
            regressionResults: regressionRes.results,
            explanation,
            status: resultStatus,
        });
    }

    /**
     * Run the entire repair synthesis and validation pipeline.
     *
     * @param {object} finding
     * @param {import('../workspace/WorkspaceSnapshot.js').WorkspaceSnapshot|string} workspace
     * @param {object} [context={}]
     * @returns {RepairSnapshot}
     */
    runPipeline(finding, workspace, context = {}) {
        const session = new RepairSession({
            workspaceSnapshotId: workspace?.snapshotId || 'snap_default',
            sourceRevision: workspace?.version || 1,
            targetFindingId: finding?.id || finding?.kind,
        });

        const candidates = this.generateCandidates(finding, { workspace, ...context });
        const results = [];

        for (const cand of candidates) {
            const res = this.validateCandidate(cand, workspace, { finding, ...context });
            results.push(res);
        }

        return new RepairSnapshot({
            session,
            candidates,
            results,
            status: 'SUCCESS',
        });
    }
}
