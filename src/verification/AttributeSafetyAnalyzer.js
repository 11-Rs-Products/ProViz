/**
 * AttributeSafetyAnalyzer — Verifies object attribute accesses against ObjectShape and class definitions.
 */

import { FINDING_KINDS } from './FindingKind.js';
import { FINDING_SEVERITIES } from './FindingSeverity.js';
import { FINDING_STATUSES } from './FindingStatus.js';
import { Finding } from './Finding.js';
import { FindingEvidence } from './FindingEvidence.js';
import { FindingLocation } from './FindingLocation.js';

export class AttributeSafetyAnalyzer {
    /**
     * @param {object} cfg
     * @param {object} [typeInference]
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

            // Check dynamic getattr(obj, name)
            if (codeStr.includes('getattr(') || codeStr.includes('setattr(')) {
                findings.push(
                    new Finding({
                        kind: FINDING_KINDS.UNSUPPORTED_DYNAMIC_BEHAVIOR,
                        severity: FINDING_SEVERITIES.INFO,
                        confidence: 'UNKNOWN',
                        status: FINDING_STATUSES.UNKNOWN,
                        message: `Dynamic reflection used in '${codeStr}'. Attribute access cannot be statically resolved.`,
                        sourceLocation: loc,
                        cfgNodeId: node.id,
                        evidence: [
                            new FindingEvidence({
                                kind: FINDING_STATUSES.UNKNOWN,
                                description: `Use of reflection API (getattr/setattr) breaks static closed-world assumptions.`,
                                sourceLocation: loc,
                            }),
                        ],
                    })
                );
                continue;
            }

            // Check static obj.field access
            const attrMatch = codeStr.match(/\b([a-zA-Z_]\w*)\.([a-zA-Z_]\w*)/);
            if (attrMatch) {
                const varName = attrMatch[1];
                const fieldName = attrMatch[2];

                const nodeState = typeInference?.nodeStates?.get(node.id);
                const absVal = nodeState?.inEnv?.get(varName) || typeInference?.latestBindings?.get(varName);

                if (absVal && absVal.shape && absVal.shape.isObjectShape) {
                    const objShape = absVal.shape;
                    if (objShape.isClosed && !objShape.hasField(fieldName)) {
                        findings.push(
                            new Finding({
                                kind: FINDING_KINDS.DEFINITE_ATTRIBUTE_ERROR,
                                severity: FINDING_SEVERITIES.ERROR,
                                confidence: 'STATIC_GUARANTEE',
                                status: FINDING_STATUSES.STATIC_GUARANTEE,
                                message: `Definite attribute error: class '${objShape.className}' has no attribute '${fieldName}'.`,
                                sourceLocation: loc,
                                cfgNodeId: node.id,
                                evidence: [
                                    new FindingEvidence({
                                        kind: FINDING_STATUSES.STATIC_GUARANTEE,
                                        description: `Known fields for '${objShape.className}': [${objShape.getFieldNames().join(', ')}].`,
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
