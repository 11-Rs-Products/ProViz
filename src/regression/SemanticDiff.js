/**
 * SemanticDiff — Top-level semantic differencing engine between immutable WorkspaceSnapshots.
 */

import { StructuralDiff } from './StructuralDiff.js';
import { AnalysisDiff } from './AnalysisDiff.js';
import { SemanticChangeSet } from './SemanticChangeSet.js';
import { CHANGE_KINDS } from './ChangeKind.js';

export class SemanticDiff {
    /**
     * Compute full universal semantic diff between two workspace snapshots.
     *
     * @param {import('../workspace/WorkspaceSnapshot.js').WorkspaceSnapshot} beforeSnapshot
     * @param {import('../workspace/WorkspaceSnapshot.js').WorkspaceSnapshot} afterSnapshot
     * @param {object} [options={}]
     * @returns {object} Full Semantic Diff Result
     */
    static diff(beforeSnapshot, afterSnapshot, options = {}) {
        const fromRevision = beforeSnapshot?.version ?? 1;
        const toRevision = afterSnapshot?.version ?? 2;

        const structuralChanges = StructuralDiff.diff(beforeSnapshot, afterSnapshot);
        const analysisChanges = options.skipAnalysis ? [] : AnalysisDiff.diff(beforeSnapshot, afterSnapshot);

        const allChanges = [...structuralChanges, ...analysisChanges];
        const changeSet = new SemanticChangeSet({ changes: allChanges, metadata: options.metadata || {} });

        const fileChanges = allChanges.filter(c => c.kind.startsWith('FILE_'));
        const moduleChanges = allChanges.filter(c => c.kind.startsWith('MODULE_') || c.kind.startsWith('IMPORT_') || c.kind.startsWith('EXPORT_'));
        const symbolChanges = allChanges.filter(c => c.kind.startsWith('SYMBOL_'));
        const functionChanges = allChanges.filter(c => c.kind.startsWith('FUNCTION_'));
        const controlFlowChanges = allChanges.filter(c => c.kind.startsWith('CONTROL_FLOW_') || c.kind === CHANGE_KINDS.BRANCH_CHANGED || c.kind === CHANGE_KINDS.LOOP_CHANGED);
        const dataflowChanges = allChanges.filter(c => c.kind.startsWith('DATA_') || c.kind === CHANGE_KINDS.DEFINITION_CHANGED || c.kind === CHANGE_KINDS.USE_CHANGED || c.kind === CHANGE_KINDS.ALIAS_CHANGED);
        const typeChanges = allChanges.filter(c => c.kind.startsWith('TYPE_') || c.kind.startsWith('NULLABILITY_') || c.kind.startsWith('COLLECTION_SHAPE_'));
        const verificationChanges = allChanges.filter(c => c.kind.startsWith('VERIFICATION_'));
        const symbolicChanges = allChanges.filter(c => c.kind.startsWith('SYMBOLIC_') || c.kind === CHANGE_KINDS.PATH_CONDITION_CHANGED);

        return {
            fromRevision,
            toRevision,
            fileChanges,
            moduleChanges,
            symbolChanges,
            functionChanges,
            structuralChanges,
            controlFlowChanges,
            dataflowChanges,
            typeChanges,
            verificationChanges,
            symbolicChanges,
            changeSet,
            metadata: {
                totalChanges: allChanges.length,
                timestamp: Date.now(),
                ...(options.metadata || {}),
            },
        };
    }
}
