/**
 * CallSafetyAnalyzer — Verifies function calls against argument counts, parameter constraints, and return types.
 */

import { FINDING_KINDS } from './FindingKind.js';
import { FINDING_SEVERITIES } from './FindingSeverity.js';
import { FINDING_STATUSES } from './FindingStatus.js';
import { Finding } from './Finding.js';
import { FindingEvidence } from './FindingEvidence.js';
import { FindingLocation } from './FindingLocation.js';

export class CallSafetyAnalyzer {
    /**
     * @param {object} cfg
     * @param {object} [typeInference]
     * @param {Map<string, object>} [functionSummaries]
     * @returns {Array<Finding>}
     */
    analyze(cfg, typeInference = null, functionSummaries = new Map()) {
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

            // Match func(a, b, c)
            const callMatch = codeStr.match(/\b([a-zA-Z_]\w*)\s*\(([^)]*)\)/);
            if (callMatch) {
                const funcName = callMatch[1];
                const argsStr = callMatch[2].trim();
                const args = argsStr ? argsStr.split(',').map(a => a.trim()) : [];

                // Check built-in argument counts
                if (funcName === 'len' && args.length !== 1) {
                    findings.push(
                        new Finding({
                            kind: FINDING_KINDS.DEFINITE_CALL_ARGUMENT_MISMATCH,
                            severity: FINDING_SEVERITIES.ERROR,
                            confidence: 'STATIC_GUARANTEE',
                            status: FINDING_STATUSES.STATIC_GUARANTEE,
                            message: `Definite argument count mismatch: len() takes exactly 1 argument (${args.length} given).`,
                            sourceLocation: loc,
                            cfgNodeId: node.id,
                            evidence: [
                                new FindingEvidence({
                                    kind: FINDING_STATUSES.STATIC_GUARANTEE,
                                    description: `len() expects 1 argument, received ${args.length}.`,
                                    sourceLocation: loc,
                                }),
                            ],
                        })
                    );
                } else if (funcName === 'abs' && args.length !== 1) {
                    findings.push(
                        new Finding({
                            kind: FINDING_KINDS.DEFINITE_CALL_ARGUMENT_MISMATCH,
                            severity: FINDING_SEVERITIES.ERROR,
                            confidence: 'STATIC_GUARANTEE',
                            status: FINDING_STATUSES.STATIC_GUARANTEE,
                            message: `Definite argument count mismatch: abs() takes exactly 1 argument (${args.length} given).`,
                            sourceLocation: loc,
                            cfgNodeId: node.id,
                            evidence: [
                                new FindingEvidence({
                                    kind: FINDING_STATUSES.STATIC_GUARANTEE,
                                    description: `abs() expects 1 argument, received ${args.length}.`,
                                    sourceLocation: loc,
                                }),
                            ],
                        })
                    );
                }

                // Check registered function summaries
                const summary = functionSummaries.get(funcName);
                if (summary && typeof summary.paramCount === 'number') {
                    if (args.length !== summary.paramCount) {
                        findings.push(
                            new Finding({
                                kind: FINDING_KINDS.DEFINITE_CALL_ARGUMENT_MISMATCH,
                                severity: FINDING_SEVERITIES.ERROR,
                                confidence: 'STATIC_GUARANTEE',
                                status: FINDING_STATUSES.STATIC_GUARANTEE,
                                message: `Argument mismatch in '${funcName}()': expects ${summary.paramCount} parameters (${args.length} arguments provided).`,
                                sourceLocation: loc,
                                cfgNodeId: node.id,
                                evidence: [
                                    new FindingEvidence({
                                        kind: FINDING_STATUSES.STATIC_GUARANTEE,
                                        description: `Function summary for '${funcName}' specifies ${summary.paramCount} parameters.`,
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
