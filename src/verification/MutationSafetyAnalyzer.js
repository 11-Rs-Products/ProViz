/**
 * MutationSafetyAnalyzer — Verifies mutation operations and aliasing side-effects.
 */

import { FINDING_KINDS } from './FindingKind.js';
import { FINDING_SEVERITIES } from './FindingSeverity.js';
import { FINDING_STATUSES } from './FindingStatus.js';
import { Finding } from './Finding.js';
import { FindingEvidence } from './FindingEvidence.js';
import { FindingLocation } from './FindingLocation.js';

export class MutationSafetyAnalyzer {
    /**
     * @param {object} cfg
     * @param {object} [dataflowGraph] - Stage 12 DataflowGraph
     * @param {object} [typeInference]
     * @returns {Array<Finding>}
     */
    analyze(cfg, dataflowGraph = null, typeInference = null) {
        const findings = [];
        if (!cfg) return findings;

        for (const node of cfg.getNodes()) {
            const stmt = node.statement;
            if (!stmt) continue;

            const codeStr = String(stmt.expression || stmt.raw || stmt.value || '').trim();
            const loc = new FindingLocation({
                fileId: node.sourceLocation?.file || 'main.py',
                line: node.sourceLocation?.line || null,
                column: node.sourceLocation?.column || null,
            });

            // Match mutation method: list.append, list.extend, dict.update
            const mutMatch = codeStr.match(/\b([a-zA-Z_]\w*)\.(append|extend|pop|remove|insert|update|clear)\(/);
            if (mutMatch) {
                const varName = mutMatch[1];
                const method = mutMatch[2];

                // If dataflowGraph has aliasing info for this variable
                if (dataflowGraph?.aliases) {
                    const aliases = dataflowGraph.aliases.get(varName) || [];
                    if (aliases.length > 0) {
                        findings.push(
                            new Finding({
                                kind: FINDING_KINDS.ALIASING_RISK,
                                severity: FINDING_SEVERITIES.INFO,
                                confidence: 'STATIC_INFERENCE',
                                status: FINDING_STATUSES.STATIC_INFERENCE,
                                message: `Mutation '${varName}.${method}()' affects aliased variable(s): [${aliases.join(', ')}].`,
                                sourceLocation: loc,
                                cfgNodeId: node.id,
                                evidence: [
                                    new FindingEvidence({
                                        kind: FINDING_STATUSES.STATIC_INFERENCE,
                                        description: `Object modified through '${varName}' is also referenced by [${aliases.join(', ')}].`,
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
