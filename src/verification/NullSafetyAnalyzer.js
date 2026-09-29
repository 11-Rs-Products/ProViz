/**
 * NullSafetyAnalyzer — Verifies attribute access, indexing, and calls against None values.
 */

import { FINDING_KINDS } from './FindingKind.js';
import { FINDING_SEVERITIES } from './FindingSeverity.js';
import { FINDING_STATUSES } from './FindingStatus.js';
import { Finding } from './Finding.js';
import { FindingEvidence } from './FindingEvidence.js';
import { FindingLocation } from './FindingLocation.js';

export class NullSafetyAnalyzer {
    /**
     * @param {object} cfg - ControlFlowGraph
     * @param {object} [typeInference] - TypeInference from Stage 14
     * @returns {Array<Finding>}
     */
    analyze(cfg, typeInference = null) {
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

            // Match attribute access: x.y or obj.field
            const attrMatch = codeStr.match(/\b([a-zA-Z_]\w*)\.([a-zA-Z_]\w*)/);
            if (attrMatch) {
                const varName = attrMatch[1];
                const attrName = attrMatch[2];

                // Check node-specific type state if available
                const nodeState = typeInference?.nodeStates?.get(node.id);
                const absVal = nodeState?.inEnv?.get(varName) || typeInference?.latestBindings?.get(varName);

                if (absVal) {
                    const isDefiniteNone = absVal.nullability === 'NULL' || (absVal.typeSet.has('none') && absVal.typeSet.size === 1);
                    const isPossibleNone = absVal.nullability === 'MAYBE_NULL' || (absVal.typeSet.has('none') && absVal.typeSet.size > 1);

                    if (isDefiniteNone) {
                        findings.push(
                            new Finding({
                                kind: FINDING_KINDS.DEFINITE_NONE_ACCESS,
                                severity: FINDING_SEVERITIES.ERROR,
                                confidence: 'STATIC_GUARANTEE',
                                status: FINDING_STATUSES.STATIC_GUARANTEE,
                                message: `Definite attribute access on None: '${varName}.${attrName}'. '${varName}' is statically guaranteed to be None.`,
                                sourceLocation: loc,
                                cfgNodeId: node.id,
                                evidence: [
                                    new FindingEvidence({
                                        kind: FINDING_STATUSES.STATIC_GUARANTEE,
                                        description: `Variable '${varName}' has nullability NULL / type none.`,
                                        sourceLocation: loc,
                                        nullability: absVal.nullability,
                                        possibleTypes: absVal.typeSet.toArray().map(t => t.toString()),
                                    }),
                                ],
                            })
                        );
                    } else if (isPossibleNone) {
                        findings.push(
                            new Finding({
                                kind: FINDING_KINDS.POSSIBLE_NONE_ACCESS,
                                severity: FINDING_SEVERITIES.WARNING,
                                confidence: 'STATIC_INFERENCE',
                                status: FINDING_STATUSES.STATIC_INFERENCE,
                                message: `Possible attribute access on None: '${varName}.${attrName}'. '${varName}' may be None without a prior null-check.`,
                                sourceLocation: loc,
                                cfgNodeId: node.id,
                                evidence: [
                                    new FindingEvidence({
                                        kind: FINDING_STATUSES.STATIC_INFERENCE,
                                        description: `Variable '${varName}' has possible type 'none' in union [${absVal.typeSet.toArray().map(t => t.toString()).join(', ')}].`,
                                        sourceLocation: loc,
                                        nullability: absVal.nullability,
                                        possibleTypes: absVal.typeSet.toArray().map(t => t.toString()),
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
