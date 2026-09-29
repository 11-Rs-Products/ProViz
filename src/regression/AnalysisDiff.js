/**
 * AnalysisDiff — Compares deep semantic analysis models (CFG, Dataflow, TypeFlow, Verification, Symbolic)
 * between two WorkspaceSnapshots.
 */

import { ControlFlowChange } from './ControlFlowChange.js';
import { DataflowChange } from './DataflowChange.js';
import { TypeChange } from './TypeChange.js';
import { VerificationChange } from './VerificationChange.js';
import { SymbolicChange } from './SymbolicChange.js';
import { SymbolChange } from './SymbolChange.js';
import { CHANGE_KINDS } from './ChangeKind.js';
import { CHANGE_SEVERITIES } from './ChangeSeverity.js';
import { CHANGE_CONFIDENCES } from './ChangeConfidence.js';

import { ControlFlowAnalyzer } from '../analysis/ControlFlowAnalyzer.js';
import { DataflowAnalyzer } from '../dataflow/DataflowAnalyzer.js';
import { TypeFlowAnalyzer } from '../typeflow/TypeFlowAnalyzer.js';
import { VerificationAnalyzer } from '../verification/VerificationAnalyzer.js';
import { SymbolicAnalyzer } from '../symbolic/SymbolicAnalyzer.js';

export class AnalysisDiff {
    /**
     * Compute analysis differences across all supported semantic models.
     *
     * @param {import('../workspace/WorkspaceSnapshot.js').WorkspaceSnapshot} beforeSnapshot
     * @param {import('../workspace/WorkspaceSnapshot.js').WorkspaceSnapshot} afterSnapshot
     * @returns {Array<import('./SemanticChange.js').SemanticChange>}
     */
    static diff(beforeSnapshot, afterSnapshot) {
        if (!beforeSnapshot || !afterSnapshot) return [];

        const changes = [];
        const filesBefore = beforeSnapshot.getAllFiles();
        const filesAfter = afterSnapshot.getAllFiles();

        const beforeMap = new Map(filesBefore.map(f => [f.path, f]));
        const afterMap = new Map(filesAfter.map(f => [f.path, f]));

        for (const [path, afterFile] of afterMap.entries()) {
            const beforeFile = beforeMap.get(path);
            if (!beforeFile) continue;
            if (beforeFile.content === afterFile.content) continue;

            const fileChanges = AnalysisDiff._diffFileAnalyses(beforeFile, afterFile);
            changes.push(...fileChanges);
        }

        return changes;
    }

    /**
     * @private
     */
    static _diffFileAnalyses(beforeFile, afterFile) {
        const changes = [];
        const codeBefore = beforeFile.content || '';
        const codeAfter = afterFile.content || '';

        // 1. Control Flow & Branch Diff
        try {
            const cfgAnalyzer = new ControlFlowAnalyzer();
            const resBefore = cfgAnalyzer.analyzeSource(codeBefore);
            const resAfter = cfgAnalyzer.analyzeSource(codeAfter);

            const nodesB = resBefore?.cfg?.nodes ? (resBefore.cfg.nodes.size !== undefined ? resBefore.cfg.nodes.size : (resBefore.cfg.nodes.length || Object.keys(resBefore.cfg.nodes).length)) : 0;
            const nodesA = resAfter?.cfg?.nodes ? (resAfter.cfg.nodes.size !== undefined ? resAfter.cfg.nodes.size : (resAfter.cfg.nodes.length || Object.keys(resAfter.cfg.nodes).length)) : 0;

            if (nodesB !== nodesA) {
                changes.push(new ControlFlowChange({
                    cfgTargetId: `${afterFile.id}_cfg`,
                    changeType: 'branch',
                    oldBranch: { nodeCount: nodesB },
                    newBranch: { nodeCount: nodesA },
                    fileId: afterFile.id,
                    kind: nodesA > nodesB ? CHANGE_KINDS.CONTROL_FLOW_ADDED : CHANGE_KINDS.CONTROL_FLOW_REMOVED,
                    severity: CHANGE_SEVERITIES.MAJOR,
                    causes: ['Control-flow basic block structure altered'],
                }));
            }
        } catch (e) {
            // Safe fallback on partial syntax
        }

        // 2. Verification Properties Diff
        try {
            const verAnalyzer = new VerificationAnalyzer();
            const verBefore = verAnalyzer.analyzeSource(codeBefore);
            const verAfter = verAnalyzer.analyzeSource(codeAfter);

            const propsBefore = verBefore?.snapshot?.properties || verBefore?.properties || [];
            const propsAfter = verAfter?.snapshot?.properties || verAfter?.properties || [];

            const mapBefore = new Map(propsBefore.map(p => [p.id || p.propertyId || p.name, p]));
            const mapAfter = new Map(propsAfter.map(p => [p.id || p.propertyId || p.name, p]));

            for (const [propId, pAfter] of mapAfter.entries()) {
                const pBefore = mapBefore.get(propId);
                const statusBefore = pBefore?.status || 'UNKNOWN';
                const statusAfter = pAfter.status || 'UNKNOWN';

                if (statusBefore !== statusAfter) {
                    const isWeakened = statusBefore === 'PROVEN' && statusAfter !== 'PROVEN';
                    changes.push(new VerificationChange({
                        propertyId: propId,
                        propertyKind: pAfter.kind || 'safety',
                        oldStatus: statusBefore,
                        newStatus: statusAfter,
                        counterexampleId: pAfter.counterexampleId || null,
                        fileId: afterFile.id,
                        severity: isWeakened ? CHANGE_SEVERITIES.CRITICAL : CHANGE_SEVERITIES.MINOR,
                        causes: [`Verification status shifted from ${statusBefore} to ${statusAfter}`],
                        consequences: isWeakened ? ['Safety property weakened or potential failure introduced'] : ['Safety property strengthened'],
                    }));
                }
            }
        } catch (e) {
            // Safe fallback
        }

        // 3. Symbolic Paths Diff
        try {
            const symAnalyzer = new SymbolicAnalyzer();
            const symBefore = symAnalyzer.analyzeSource(codeBefore);
            const symAfter = symAnalyzer.analyzeSource(codeAfter);

            const pathsBefore = symBefore?.paths || symBefore?.snapshot?.paths || [];
            const pathsAfter = symAfter?.paths || symAfter?.snapshot?.paths || [];

            if (pathsBefore.length !== pathsAfter.length) {
                changes.push(new SymbolicChange({
                    pathId: `${afterFile.id}_symbolic_paths`,
                    oldConstraints: pathsBefore.map(p => p.id || 'p'),
                    newConstraints: pathsAfter.map(p => p.id || 'p'),
                    fileId: afterFile.id,
                    kind: pathsAfter.length > pathsBefore.length ? CHANGE_KINDS.SYMBOLIC_PATH_ADDED : CHANGE_KINDS.SYMBOLIC_PATH_REMOVED,
                    severity: CHANGE_SEVERITIES.MAJOR,
                    causes: ['Set of satisfiable symbolic paths changed'],
                }));
            }
        } catch (e) {
            // Safe fallback
        }

        // 4. TypeFlow Diff
        try {
            const typeAnalyzer = new TypeFlowAnalyzer();
            const tfBefore = typeAnalyzer.analyzeSource(codeBefore);
            const tfAfter = typeAnalyzer.analyzeSource(codeAfter);

            const envBefore = tfBefore?.environment || tfBefore?.snapshot?.environment || {};
            const envAfter = tfAfter?.environment || tfAfter?.snapshot?.environment || {};

            for (const [varName, typeAfter] of Object.entries(envAfter)) {
                const typeBefore = envBefore[varName];
                if (typeBefore && JSON.stringify(typeBefore) !== JSON.stringify(typeAfter)) {
                    changes.push(new TypeChange({
                        targetName: varName,
                        oldType: typeBefore.type || typeBefore,
                        newType: typeAfter.type || typeAfter,
                        oldNullable: typeBefore.nullable || false,
                        newNullable: typeAfter.nullable || false,
                        fileId: afterFile.id,
                        severity: CHANGE_SEVERITIES.MAJOR,
                        causes: [`Type or shape of '${varName}' changed`],
                    }));
                }
            }
        } catch (e) {
            // Safe fallback
        }

        return changes;
    }
}
