/**
 * MutantWorkspace — Encapsulates the mutated WorkspaceSnapshot and its relation to the original.
 */

import { WorkspaceSnapshot } from '../workspace/WorkspaceSnapshot.js';
import { MutationCandidate } from './MutationCandidate.js';

export class MutantWorkspace {
    /**
     * @param {object} params
     * @param {WorkspaceSnapshot|string} params.originalWorkspace
     * @param {WorkspaceSnapshot|string} params.mutatedWorkspace
     * @param {MutationCandidate|object} params.candidate
     * @param {Array<string>} [params.affectedFiles=[]]
     * @param {Array<string>} [params.affectedModules=[]]
     */
    constructor({
        originalWorkspace,
        mutatedWorkspace,
        candidate,
        affectedFiles = [],
        affectedModules = [],
    } = {}) {
        this.originalWorkspace = originalWorkspace;
        this.mutatedWorkspace = mutatedWorkspace;
        this.candidate = candidate instanceof MutationCandidate ? candidate : new MutationCandidate(candidate);
        this.affectedFiles = Object.freeze([...affectedFiles]);
        this.affectedModules = Object.freeze([...affectedModules]);
        Object.freeze(this);
    }

    /**
     * Create a MutantWorkspace by applying a mutation candidate to a workspace.
     * @param {WorkspaceSnapshot|string} workspace
     * @param {MutationCandidate} candidate
     * @returns {MutantWorkspace}
     */
    static create(workspace, candidate) {
        const mutatedWorkspace = candidate.patch.apply(workspace);
        const affectedFiles = [candidate.fileId];

        return new MutantWorkspace({
            originalWorkspace: workspace,
            mutatedWorkspace,
            candidate,
            affectedFiles,
        });
    }

    getMutatedSource(fileId = 'main.py') {
        if (typeof this.mutatedWorkspace === 'string') {
            return this.mutatedWorkspace;
        }
        if (this.mutatedWorkspace instanceof WorkspaceSnapshot) {
            const file = this.mutatedWorkspace.getFile(fileId) || this.mutatedWorkspace.getFileByPath(fileId);
            return file ? file.content : '';
        }
        return '';
    }
}
