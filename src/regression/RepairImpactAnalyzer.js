/**
 * RepairImpactAnalyzer — Integrates Stage 19 program repair patches with regression impact analysis.
 */

import { SemanticDiff } from './SemanticDiff.js';
import { ImpactAnalyzer } from './ImpactAnalyzer.js';
import { VerificationAnalyzer } from '../verification/VerificationAnalyzer.js';

export class RepairImpactAnalyzer {
    /**
     * Analyze regression impact of applying a Stage 19 PatchSet to a workspace.
     *
     * @param {import('../repair/PatchSet.js').PatchSet|object} patchSet
     * @param {import('../workspace/WorkspaceSnapshot.js').WorkspaceSnapshot} beforeSnapshot
     * @param {import('../workspace/WorkspaceSnapshot.js').WorkspaceSnapshot} afterSnapshot
     * @param {Array<import('../testing/TestCase.js').TestCase>} [testSuite=[]]
     * @returns {object}
     */
    static analyzeRepairImpact(patchSet, beforeSnapshot, afterSnapshot, testSuite = []) {
        const semanticDiff = SemanticDiff.diff(beforeSnapshot, afterSnapshot);
        const impactAnalyzer = new ImpactAnalyzer();
        const impactResult = impactAnalyzer.analyze(semanticDiff.changeSet, afterSnapshot, testSuite);

        // Verification properties before and after
        const mainFileBefore = beforeSnapshot.getAllFiles()[0];
        const mainFileAfter = afterSnapshot.getAllFiles()[0];

        const verAnalyzer = new VerificationAnalyzer();
        const verBefore = verAnalyzer.analyzeSource(mainFileBefore?.content || '');
        const verAfter = verAnalyzer.analyzeSource(mainFileAfter?.content || '');

        const restoredProperties = [];
        const weakenedProperties = [];

        const propsBefore = verBefore?.snapshot?.properties || verBefore?.properties || [];
        const propsAfter = verAfter?.snapshot?.properties || verAfter?.properties || [];

        const propsBeforeMap = new Map(propsBefore.map(p => [p.id || p.name, p]));
        for (const pAfter of propsAfter) {
            const pBefore = propsBeforeMap.get(pAfter.id || pAfter.name);
            if (pBefore) {
                if (pBefore.status !== 'PROVEN' && pAfter.status === 'PROVEN') {
                    restoredProperties.push(pAfter);
                } else if (pBefore.status === 'PROVEN' && pAfter.status !== 'PROVEN') {
                    weakenedProperties.push(pAfter);
                }
            }
        }

        const isCleanRepair = weakenedProperties.length === 0;

        return {
            patchSetId: patchSet?.id || patchSet?.setId || 'patchset',
            semanticDiff,
            impactResult,
            restoredProperties,
            weakenedProperties,
            isCleanRepair,
            affectedTests: impactResult.affectedTests,
            recommendation: isCleanRepair ? 'REPAIR_SAFE_TO_APPLY' : 'REPAIR_INTRODUCES_SIDE_EFFECTS',
        };
    }
}
