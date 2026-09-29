/**
 * IndexSafetyAnalyzer — Verifies collection indexing operations for bounds and index types.
 */

import { FINDING_KINDS } from './FindingKind.js';
import { FINDING_SEVERITIES } from './FindingSeverity.js';
import { FINDING_STATUSES } from './FindingStatus.js';
import { Finding } from './Finding.js';
import { FindingEvidence } from './FindingEvidence.js';
import { FindingLocation } from './FindingLocation.js';

export class IndexSafetyAnalyzer {
    /**
     * @param {object} cfg
     * @param {object} [typeInference]
     * @param {Map<string, object>} [ranges]
     * @returns {Array<Finding>}
     */
    analyze(cfg, typeInference = null, ranges = new Map()) {
        const findings = [];
        if (!cfg) return findings;

        for (const node of cfg.getNodes()) {
            if (node.type === 'ENTRY' || node.type === 'EXIT') continue;

            const codeStr = String(node.statement?.expression || node.statement?.raw || node.statement?.value || node.label || '').trim();
            const loc = new FindingLocation({
                fileId: node.sourceLocations?.[0]?.fileId || node.sourceLocation?.file || node.fileId || 'main.py',
                line: node.sourceLocations?.[0]?.line || node.sourceLocation?.line || null,
                column: node.sourceLocations?.[0]?.column || node.sourceLocation?.column || null,
            });

            // Match xs[index]
            const indexMatch = codeStr.match(/\b([a-zA-Z_]\w*)\[([^\]]+)\]/);
            if (indexMatch) {
                const targetVar = indexMatch[1];
                const indexExpr = indexMatch[2].trim();

                const nodeState = typeInference?.nodeStates?.get(node.id);
                const targetVal = nodeState?.inEnv?.get(targetVar) || typeInference?.latestBindings?.get(targetVar);
                const shape = targetVal?.shape;

                // 1. Literal integer index
                if (/^-?\d+$/.test(indexExpr)) {
                    const idxNum = Number(indexExpr);

                    if (shape && typeof shape.fixedLength === 'number') {
                        const len = shape.fixedLength;
                        if (idxNum >= len || idxNum < -len) {
                            findings.push(
                                new Finding({
                                    kind: FINDING_KINDS.DEFINITE_INDEX_OUT_OF_BOUNDS,
                                    severity: FINDING_SEVERITIES.ERROR,
                                    confidence: 'STATIC_GUARANTEE',
                                    status: FINDING_STATUSES.STATIC_GUARANTEE,
                                    message: `Definite index out of bounds: '${targetVar}[${idxNum}]'. Collection length is ${len}.`,
                                    sourceLocation: loc,
                                    cfgNodeId: node.id,
                                    evidence: [
                                        new FindingEvidence({
                                            kind: FINDING_STATUSES.STATIC_GUARANTEE,
                                            description: `Known fixed collection length is ${len}, but index requested is ${idxNum}.`,
                                            sourceLocation: loc,
                                        }),
                                    ],
                                })
                            );
                            continue;
                        }
                    }
                }

                // 2. String index on list/tuple
                if (/^["'].*["']$/.test(indexExpr)) {
                    const isSequence = targetVal && (targetVal.typeSet.has('list') || targetVal.typeSet.has('tuple'));
                    if (isSequence && !targetVal.typeSet.has('dict')) {
                        findings.push(
                            new Finding({
                                kind: FINDING_KINDS.DEFINITE_INVALID_INDEX_TYPE,
                                severity: FINDING_SEVERITIES.ERROR,
                                confidence: 'STATIC_GUARANTEE',
                                status: FINDING_STATUSES.STATIC_GUARANTEE,
                                message: `Invalid index type: string index ${indexExpr} applied to sequence '${targetVar}'.`,
                                sourceLocation: loc,
                                cfgNodeId: node.id,
                                evidence: [
                                    new FindingEvidence({
                                        kind: FINDING_STATUSES.STATIC_GUARANTEE,
                                        description: `Sequence type '${targetVal.typeSet.toString()}' requires integer indices.`,
                                        sourceLocation: loc,
                                    }),
                                ],
                            })
                        );
                    }
                }
            }
        }

        return findings;
    }
}
