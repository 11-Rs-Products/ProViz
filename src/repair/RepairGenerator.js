/**
 * RepairGenerator — Orchestrates strategy generators to synthesize RepairCandidates for findings.
 */

import { RootCauseAnalyzer } from './RootCauseAnalyzer.js';
import { NullGuardRepairGenerator } from './NullGuardRepairGenerator.js';
import { DivisionRepairGenerator } from './DivisionRepairGenerator.js';
import { BoundsRepairGenerator } from './BoundsRepairGenerator.js';
import { TypeGuardRepairGenerator } from './TypeGuardRepairGenerator.js';
import { AttributeRepairGenerator } from './AttributeRepairGenerator.js';
import { CollectionRepairGenerator } from './CollectionRepairGenerator.js';
import { ExceptionRepairGenerator } from './ExceptionRepairGenerator.js';
import { RepairCandidate } from './RepairCandidate.js';
import { WorkspaceSnapshot } from '../workspace/WorkspaceSnapshot.js';

export class RepairGenerator {
    /**
     * Generate repair candidates for a verification finding.
     *
     * @param {object} finding - Verification finding
     * @param {object} [context={}]
     * @param {WorkspaceSnapshot|string} [context.workspace='']
     * @param {number} [context.sourceRevision=1]
     * @param {object} [options={}]
     * @param {Array<string>} [options.strategies=null]
     * @returns {Array<RepairCandidate>}
     */
    static generateRepairs(finding, context = {}, options = {}) {
        if (!finding) return [];

        const rootCause = RootCauseAnalyzer.analyzeFinding(finding, context);
        const fileId = rootCause.location?.fileId || 'main.py';

        let sourceCode = '';
        let workspaceSnapshotId = 'snap_default';
        let revision = context.sourceRevision || 1;

        if (context.workspace instanceof WorkspaceSnapshot) {
            workspaceSnapshotId = context.workspace.snapshotId;
            revision = context.workspace.version;
            const file = context.workspace.getFile(fileId) || context.workspace.getFileByPath(fileId);
            sourceCode = file ? file.content : '';
        } else if (typeof context.workspace === 'string') {
            sourceCode = context.workspace;
        }

        const findingKind = String(finding.kind || '');
        const generatedPairs = [];

        // Select appropriate generator based on finding category
        if (findingKind.includes('NONE')) {
            generatedPairs.push(...NullGuardRepairGenerator.generate(rootCause, sourceCode));
            generatedPairs.push(...ExceptionRepairGenerator.generate(rootCause, sourceCode));
        } else if (findingKind.includes('DIVISION')) {
            generatedPairs.push(...DivisionRepairGenerator.generate(rootCause, sourceCode));
            generatedPairs.push(...ExceptionRepairGenerator.generate(rootCause, sourceCode));
        } else if (findingKind.includes('INDEX')) {
            generatedPairs.push(...BoundsRepairGenerator.generate(rootCause, sourceCode));
            generatedPairs.push(...ExceptionRepairGenerator.generate(rootCause, sourceCode));
        } else if (findingKind.includes('ATTRIBUTE')) {
            generatedPairs.push(...AttributeRepairGenerator.generate(rootCause, sourceCode));
            generatedPairs.push(...ExceptionRepairGenerator.generate(rootCause, sourceCode));
        } else if (findingKind.includes('TYPE')) {
            generatedPairs.push(...TypeGuardRepairGenerator.generate(rootCause, sourceCode));
            generatedPairs.push(...ExceptionRepairGenerator.generate(rootCause, sourceCode));
        } else if (findingKind.includes('KEY') || findingKind.includes('COLLECTION')) {
            generatedPairs.push(...CollectionRepairGenerator.generate(rootCause, sourceCode));
            generatedPairs.push(...ExceptionRepairGenerator.generate(rootCause, sourceCode));
        } else {
            // Default fallback: Exception handling guard
            generatedPairs.push(...ExceptionRepairGenerator.generate(rootCause, sourceCode));
        }

        // Convert generated pairs to immutable RepairCandidates
        const candidates = [];
        for (const { hypothesis, transformation } of generatedPairs) {
            if (options.strategies && !options.strategies.includes(hypothesis.strategy)) {
                continue;
            }

            candidates.push(new RepairCandidate({
                workspaceSnapshotId,
                sourceRevision: revision,
                findingIds: [finding.id || findingKind],
                targetLocations: [rootCause.location],
                patch: transformation.edits,
                strategy: hypothesis.strategy,
                confidence: 'HIGH',
                analysis: {
                    rootCause: rootCause.toJSON(),
                    hypothesis: hypothesis.toJSON(),
                    transformation: transformation.toJSON(),
                },
            }));
        }

        return candidates;
    }
}
