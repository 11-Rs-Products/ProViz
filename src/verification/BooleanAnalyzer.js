/**
 * BooleanAnalyzer — Analyzes boolean expressions, truthiness, and detects constant conditions.
 */

import { FINDING_KINDS } from './FindingKind.js';
import { FINDING_SEVERITIES } from './FindingSeverity.js';
import { FINDING_STATUSES } from './FindingStatus.js';
import { Finding } from './Finding.js';
import { FindingEvidence } from './FindingEvidence.js';
import { FindingLocation } from './FindingLocation.js';

export class BooleanAnalyzer {
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
            if (node.type !== 'CONDITION' && node.type !== 'LOOP_HEADER') continue;

            const expr = String(node.metadata?.condition || node.condition || (node.label?.startsWith('if ') ? node.label.substring(3) : node.label) || '').trim();
            if (!expr) continue;

            const loc = new FindingLocation({
                fileId: node.sourceLocations?.[0]?.fileId || node.sourceLocation?.file || node.fileId || 'main.py',
                line: node.sourceLocations?.[0]?.line || node.sourceLocation?.line || null,
                column: node.sourceLocations?.[0]?.column || node.sourceLocation?.column || null,
            });

            // Direct literal conditions
            if (expr === 'True' || expr === '1') {
                findings.push(
                    new Finding({
                        kind: FINDING_KINDS.CONSTANT_CONDITION,
                        severity: FINDING_SEVERITIES.INFO,
                        confidence: 'STATIC_GUARANTEE',
                        status: FINDING_STATUSES.STATIC_GUARANTEE,
                        message: `Condition '${expr}' is statically constant (always True).`,
                        sourceLocation: loc,
                        cfgNodeId: node.id,
                        evidence: [
                            new FindingEvidence({
                                kind: FINDING_STATUSES.STATIC_GUARANTEE,
                                description: `Literal '${expr}' evaluates to True on all executions.`,
                                sourceLocation: loc,
                            }),
                        ],
                    })
                );
            } else if (expr === 'False' || expr === '0') {
                findings.push(
                    new Finding({
                        kind: FINDING_KINDS.CONSTANT_CONDITION,
                        severity: FINDING_SEVERITIES.WARNING,
                        confidence: 'STATIC_GUARANTEE',
                        status: FINDING_STATUSES.STATIC_GUARANTEE,
                        message: `Condition '${expr}' is statically constant (always False), creating an unreachable branch.`,
                        sourceLocation: loc,
                        cfgNodeId: node.id,
                        evidence: [
                            new FindingEvidence({
                                kind: FINDING_STATUSES.STATIC_GUARANTEE,
                                description: `Literal '${expr}' evaluates to False, causing branch to never execute.`,
                                sourceLocation: loc,
                            }),
                        ],
                    })
                );
            } else {
                // Check if variable comparison is provably constant via range analysis
                const cmpMatch = expr.match(/^([a-zA-Z_]\w*)\s*(==|!=|<=|>=|<|>)\s*(-?\d+(?:\.\d+)?)$/);
                if (cmpMatch) {
                    const varName = cmpMatch[1];
                    const op = cmpMatch[2];
                    const val = Number(cmpMatch[3]);
                    const varRange = ranges.get(varName);

                    if (varRange && varRange.isExact()) {
                        let isAlwaysTrue = false;
                        let isAlwaysFalse = false;
                        const v = varRange.min;

                        if (op === '==') { if (v === val) isAlwaysTrue = true; else isAlwaysFalse = true; }
                        else if (op === '!=') { if (v !== val) isAlwaysTrue = true; else isAlwaysFalse = true; }
                        else if (op === '<') { if (v < val) isAlwaysTrue = true; else isAlwaysFalse = true; }
                        else if (op === '<=') { if (v <= val) isAlwaysTrue = true; else isAlwaysFalse = true; }
                        else if (op === '>') { if (v > val) isAlwaysTrue = true; else isAlwaysFalse = true; }
                        else if (op === '>=') { if (v >= val) isAlwaysTrue = true; else isAlwaysFalse = true; }

                        if (isAlwaysTrue || isAlwaysFalse) {
                            findings.push(
                                new Finding({
                                    kind: FINDING_KINDS.CONSTANT_CONDITION,
                                    severity: isAlwaysFalse ? FINDING_SEVERITIES.WARNING : FINDING_SEVERITIES.INFO,
                                    confidence: 'STATIC_INFERENCE',
                                    status: FINDING_STATUSES.STATIC_INFERENCE,
                                    message: `Condition '${expr}' is statically provable to be always ${isAlwaysTrue ? 'True' : 'False'} (variable '${varName}' = ${v}).`,
                                    sourceLocation: loc,
                                    cfgNodeId: node.id,
                                    evidence: [
                                        new FindingEvidence({
                                            kind: FINDING_STATUSES.STATIC_INFERENCE,
                                            description: `Variable '${varName}' has inferred constant value ${v}.`,
                                            sourceLocation: loc,
                                        }),
                                    ],
                                })
                            );
                        }
                    }
                }
            }
        }

        return findings;
    }
}
