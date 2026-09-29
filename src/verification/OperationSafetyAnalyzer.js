/**
 * OperationSafetyAnalyzer — Verifies binary/unary operation type compatibility.
 */

import { FINDING_KINDS } from './FindingKind.js';
import { FINDING_SEVERITIES } from './FindingSeverity.js';
import { FINDING_STATUSES } from './FindingStatus.js';
import { Finding } from './Finding.js';
import { FindingEvidence } from './FindingEvidence.js';
import { FindingLocation } from './FindingLocation.js';

export class OperationSafetyAnalyzer {
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

            // Match string + int or int + string
            const strNumPlus = codeStr.match(/(["'].*["'])\s*\+\s*(-?\d+)|(-?\d+)\s*\+\s*(["'].*["'])/);
            if (strNumPlus) {
                findings.push(
                    new Finding({
                        kind: FINDING_KINDS.DEFINITE_TYPE_MISMATCH,
                        severity: FINDING_SEVERITIES.ERROR,
                        confidence: 'STATIC_GUARANTEE',
                        status: FINDING_STATUSES.STATIC_GUARANTEE,
                        message: `Definite type mismatch in '${codeStr}': cannot concatenate string and number directly.`,
                        sourceLocation: loc,
                        cfgNodeId: node.id,
                        evidence: [
                            new FindingEvidence({
                                kind: FINDING_STATUSES.STATIC_GUARANTEE,
                                description: `Binary operator '+' is not supported between string and integer operands.`,
                                sourceLocation: loc,
                            }),
                        ],
                    })
                );
            }
        }

        return findings;
    }
}
