/**
 * DivisionSafetyAnalyzer — Verifies division, floor division, and modulo operations against division by zero.
 */

import { FINDING_KINDS } from './FindingKind.js';
import { FINDING_SEVERITIES } from './FindingSeverity.js';
import { FINDING_STATUSES } from './FindingStatus.js';
import { Finding } from './Finding.js';
import { FindingEvidence } from './FindingEvidence.js';
import { FindingLocation } from './FindingLocation.js';

export class DivisionSafetyAnalyzer {
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

            // Match division / floor div / mod: expr / expr
            const divMatch = codeStr.match(/(.+?)\s*(\/\/|\/|%)\s*(.+)/);
            if (divMatch) {
                const op = divMatch[2];
                const divisorExpr = divMatch[3].trim();

                // 1. Literal constant 0
                if (divisorExpr === '0' || divisorExpr === '0.0') {
                    findings.push(
                        new Finding({
                            kind: FINDING_KINDS.DEFINITE_DIVISION_BY_ZERO,
                            severity: FINDING_SEVERITIES.ERROR,
                            confidence: 'STATIC_GUARANTEE',
                            status: FINDING_STATUSES.STATIC_GUARANTEE,
                            message: `Definite division by zero in '${codeStr}'. Divisor is literal 0.`,
                            sourceLocation: loc,
                            cfgNodeId: node.id,
                            evidence: [
                                new FindingEvidence({
                                    kind: FINDING_STATUSES.STATIC_GUARANTEE,
                                    description: `Divisor '${divisorExpr}' is literal zero.`,
                                    sourceLocation: loc,
                                }),
                            ],
                        })
                    );
                    continue;
                }

                // 2. len(xs) where xs can be empty
                const lenMatch = divisorExpr.match(/^len\(([a-zA-Z_]\w*)\)$/);
                if (lenMatch) {
                    const listVar = lenMatch[1];
                    const nodeState = typeInference?.nodeStates?.get(node.id);
                    const listVal = nodeState?.inEnv?.get(listVar) || typeInference?.latestBindings?.get(listVar);
                    const shape = listVal?.shape;

                    const couldBeEmpty = !shape || shape.fixedLength === 0 || shape.fixedLength === null || (shape.lengthRange && shape.lengthRange.min === 0);

                    if (couldBeEmpty) {
                        findings.push(
                            new Finding({
                                kind: FINDING_KINDS.POSSIBLE_DIVISION_BY_ZERO,
                                severity: FINDING_SEVERITIES.WARNING,
                                confidence: 'STATIC_INFERENCE',
                                status: FINDING_STATUSES.STATIC_INFERENCE,
                                message: `Possible division by zero in '${codeStr}'. Collection '${listVar}' may be empty (len = 0).`,
                                sourceLocation: loc,
                                cfgNodeId: node.id,
                                evidence: [
                                    new FindingEvidence({
                                        kind: FINDING_STATUSES.STATIC_INFERENCE,
                                        description: `Collection '${listVar}' has shape with potential length 0.`,
                                        sourceLocation: loc,
                                    }),
                                ],
                            })
                        );
                        continue;
                    }
                }

                // 3. Variable divisor with RangeValue or TypeInference
                const varMatch = divisorExpr.match(/^([a-zA-Z_]\w*)$/);
                if (varMatch) {
                    const varName = varMatch[1];
                    const range = ranges.get(varName);
                    const nodeState = typeInference?.nodeStates?.get(node.id);
                    const absVal = nodeState?.inEnv?.get(varName) || typeInference?.latestBindings?.get(varName);
                    const constVal = absVal?.getConstant?.();
                    if ((constVal && (constVal.value === 0 || constVal.raw === '0')) || (range && range.isExact() && range.min === 0)) {
                        findings.push(
                            new Finding({
                                kind: FINDING_KINDS.DEFINITE_DIVISION_BY_ZERO,
                                severity: FINDING_SEVERITIES.ERROR,
                                confidence: 'STATIC_GUARANTEE',
                                status: FINDING_STATUSES.STATIC_GUARANTEE,
                                message: `Definite division by zero in '${codeStr}'. Variable '${varName}' is statically constant 0.`,
                                sourceLocation: loc,
                                cfgNodeId: node.id,
                                evidence: [
                                    new FindingEvidence({
                                        kind: FINDING_STATUSES.STATIC_GUARANTEE,
                                        description: `Variable '${varName}' is inferred to hold constant value 0.`,
                                        sourceLocation: loc,
                                    }),
                                ],
                            })
                        );
                    } else if (range && range.containsZero()) {
                        findings.push(
                            new Finding({
                                kind: FINDING_KINDS.POSSIBLE_DIVISION_BY_ZERO,
                                severity: FINDING_SEVERITIES.WARNING,
                                confidence: 'STATIC_INFERENCE',
                                status: FINDING_STATUSES.STATIC_INFERENCE,
                                message: `Possible division by zero in '${codeStr}'. Variable '${varName}' has range ${range.toString()} containing 0.`,
                                sourceLocation: loc,
                                cfgNodeId: node.id,
                                evidence: [
                                    new FindingEvidence({
                                        kind: FINDING_STATUSES.STATIC_INFERENCE,
                                        description: `Inferred numeric range for '${varName}' is ${range.toString()}.`,
                                        sourceLocation: loc,
                                        range: range.toJSON(),
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
