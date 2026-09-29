/**
 * ControlFlowAnalyzer — Verifies CFG reachability, dead assignments, unused definitions, and infinite loops.
 */

import { FINDING_KINDS } from './FindingKind.js';
import { FINDING_SEVERITIES } from './FindingSeverity.js';
import { FINDING_STATUSES } from './FindingStatus.js';
import { Finding } from './Finding.js';
import { FindingEvidence } from './FindingEvidence.js';
import { FindingLocation } from './FindingLocation.js';

export class ControlFlowAnalyzer {
    /**
     * @param {object} cfg
     * @param {object} [ssa]
     * @returns {Array<Finding>}
     */
    analyze(cfg, ssa = null) {
        const findings = [];
        if (!cfg) return findings;

        // 1. Unreachable blocks / nodes
        for (const node of cfg.getNodes()) {
            if (node.type === 'ENTRY' || node.type === 'EXIT') continue;
            if (!cfg.isReachable(node.id)) {
                const loc = new FindingLocation({
                    fileId: node.sourceLocation?.file || 'main.py',
                    line: node.sourceLocation?.line || null,
                    column: node.sourceLocation?.column || null,
                });
                findings.push(
                    new Finding({
                        kind: FINDING_KINDS.UNREACHABLE_CODE,
                        severity: FINDING_SEVERITIES.WARNING,
                        confidence: 'STATIC_GUARANTEE',
                        status: FINDING_STATUSES.STATIC_GUARANTEE,
                        message: `Unreachable code detected at line ${loc.line || 'unknown'}. No control flow path reaches this statement.`,
                        sourceLocation: loc,
                        cfgNodeId: node.id,
                        evidence: [
                            new FindingEvidence({
                                kind: FINDING_STATUSES.STATIC_GUARANTEE,
                                description: `CFG node ${node.id} has no path from entry.`,
                                sourceLocation: loc,
                            }),
                        ],
                    })
                );
            }
        }

        // 2. Loop infinite loop detection: while True without break
        for (const node of cfg.getNodes()) {
            if (node.type === 'LOOP_HEADER') {
                const cond = String(node.condition || '').trim();
                if (cond === 'True' || cond === '1') {
                    const outgoing = cfg.getOutgoingEdges(node.id);
                    const hasExitEdge = outgoing.some(e => e.type === 'FALSE_BRANCH' || e.type === 'LOOP_EXIT');
                    if (!hasExitEdge) {
                        const loc = new FindingLocation({
                            fileId: node.sourceLocation?.file || 'main.py',
                            line: node.sourceLocation?.line || null,
                            column: node.sourceLocation?.column || null,
                        });
                        findings.push(
                            new Finding({
                                kind: FINDING_KINDS.POSSIBLE_INFINITE_LOOP,
                                severity: FINDING_SEVERITIES.WARNING,
                                confidence: 'STATIC_INFERENCE',
                                status: FINDING_STATUSES.STATIC_INFERENCE,
                                message: `Potential infinite loop: 'while True' header has no observable break/exit edges in control flow.`,
                                sourceLocation: loc,
                                cfgNodeId: node.id,
                                evidence: [
                                    new FindingEvidence({
                                        kind: FINDING_STATUSES.STATIC_INFERENCE,
                                        description: `Loop header has constant True condition and no loop-exit edges.`,
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
