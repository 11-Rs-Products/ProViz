/**
 * ContractAnalyzer — Verifies function contracts (preconditions and postconditions) against abstract states.
 */

import { FINDING_KINDS } from './FindingKind.js';
import { FINDING_SEVERITIES } from './FindingSeverity.js';
import { FINDING_STATUSES } from './FindingStatus.js';
import { Finding } from './Finding.js';
import { FindingEvidence } from './FindingEvidence.js';
import { FindingLocation } from './FindingLocation.js';

export class ContractAnalyzer {
    /**
     * @param {Array<Contract>} contracts
     * @param {object} [typeInference]
     * @param {Map<string, object>} [ranges]
     * @returns {Array<Finding>}
     */
    analyze(contracts = [], typeInference = null, ranges = new Map()) {
        const findings = [];
        for (const contract of contracts) {
            for (const pre of contract.preconditions) {
                // Check simple precondition like "x >= 0"
                const match = pre.match(/^([a-zA-Z_]\w*)\s*>=\s*0$/);
                if (match) {
                    const varName = match[1];
                    const range = ranges.get(varName);
                    if (range && range.min < 0) {
                        findings.push(
                            new Finding({
                                kind: FINDING_KINDS.POSSIBLE_TYPE_MISMATCH,
                                severity: FINDING_SEVERITIES.WARNING,
                                confidence: 'STATIC_INFERENCE',
                                status: FINDING_STATUSES.STATIC_INFERENCE,
                                message: `Contract violation in '${contract.functionId}': precondition '${pre}' may fail (range: ${range.toString()}).`,
                                functionId: contract.functionId,
                                evidence: [
                                    new FindingEvidence({
                                        kind: FINDING_STATUSES.STATIC_INFERENCE,
                                        description: `Inferred range for '${varName}' is ${range.toString()}.`,
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
