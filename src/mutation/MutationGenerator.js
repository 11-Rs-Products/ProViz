/**
 * MutationGenerator — Generates filtered, deterministic mutation candidates across files and modules.
 */

import { PythonMutationAdapter } from './PythonMutationAdapter.js';
import { MutationFilter } from './MutationFilter.js';
import { WorkspaceSnapshot } from '../workspace/WorkspaceSnapshot.js';

export class MutationGenerator {
    /**
     * Generate mutation candidates for a workspace or source code.
     *
     * @param {WorkspaceSnapshot|string} workspace
     * @param {object} [options={}]
     * @param {LanguageMutationAdapter} [options.adapter]
     * @returns {Array<import('./MutationCandidate.js').MutationCandidate>}
     */
    static generateMutations(workspace, options = {}) {
        const adapter = options.adapter || new PythonMutationAdapter();
        const rawCandidates = [];

        let wsSnapshotId = 'snap_default';
        if (workspace instanceof WorkspaceSnapshot) {
            wsSnapshotId = workspace.snapshotId;
            for (const file of workspace.getAllFiles()) {
                const sites = adapter.enumerateMutationSites(file.content, { fileId: file.id });
                for (const site of sites) {
                    const cands = adapter.buildMutations(site, file.content, { workspaceSnapshotId: wsSnapshotId });
                    rawCandidates.push(...cands);
                }
            }
        } else if (typeof workspace === 'string') {
            const sites = adapter.enumerateMutationSites(workspace, { fileId: 'main.py' });
            for (const site of sites) {
                const cands = adapter.buildMutations(site, workspace, { workspaceSnapshotId: wsSnapshotId });
                rawCandidates.push(...cands);
            }
        }

        // Apply filters & deduplication
        return MutationFilter.filter(rawCandidates, workspace, options);
    }
}
