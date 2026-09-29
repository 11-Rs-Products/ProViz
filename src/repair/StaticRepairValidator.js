/**
 * StaticRepairValidator — Re-runs static verification analyses on the patched workspace.
 */

import { FindingResolution, RESOLUTION_STATUS } from './FindingResolution.js';
import { VerificationAnalyzer } from '../verification/VerificationAnalyzer.js';
import { WorkspaceSnapshot } from '../workspace/WorkspaceSnapshot.js';

export class StaticRepairValidator {
    /**
     * Validate a repair candidate using static analysis on the patched code.
     *
     * @param {import('./RepairCandidate.js').RepairCandidate} candidate
     * @param {WorkspaceSnapshot|string} originalWorkspace
     * @returns {{ valid: boolean, patchedWorkspace: WorkspaceSnapshot|string, resolution: FindingResolution, findings: Array<object> }}
     */
    static validate(candidate, originalWorkspace) {
        // 1. Apply patch to produce isolated patched code
        const patchedWorkspace = candidate.patch.apply(originalWorkspace);
        let patchedCode = '';

        if (typeof patchedWorkspace === 'string') {
            patchedCode = patchedWorkspace;
        } else if (patchedWorkspace instanceof WorkspaceSnapshot) {
            const file = patchedWorkspace.getAllFiles()[0];
            patchedCode = file ? file.content : '';
        }

        // 2. Re-run verification analysis on patched code
        const vAnalyzer = new VerificationAnalyzer();
        const vResult = vAnalyzer.analyzeSource(patchedCode);
        const patchedFindings = vResult?.findings || [];

        // 3. Check if target finding IDs remain in patched findings
        const targetFindingIds = candidate.findingIds;
        let isResolved = true;
        let resolutionStatus = RESOLUTION_STATUS.RESOLVED;
        let explanation = 'Finding resolved by patched guard/handling';

        for (const f of patchedFindings) {
            const fId = f.id || f.kind;
            if (targetFindingIds.includes(fId) || targetFindingIds.includes(f.kind)) {
                // If finding still exists at or near original location
                isResolved = false;
                resolutionStatus = RESOLUTION_STATUS.STILL_PRESENT;
                explanation = `Finding ${f.kind} is still present at line ${f.location?.line}`;
                break;
            }
        }

        const resolution = new FindingResolution({
            findingId: targetFindingIds[0] || 'finding_target',
            status: resolutionStatus,
            explanation,
            details: {
                remainingFindingsCount: patchedFindings.length,
            },
        });

        return {
            valid: isResolved,
            patchedWorkspace,
            patchedCode,
            resolution,
            findings: patchedFindings,
        };
    }
}
