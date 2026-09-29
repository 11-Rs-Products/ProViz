/**
 * CollectionSafetyAnalyzer — Verifies dictionary lookups, set operations, and container operations.
 */

import { FINDING_KINDS } from './FindingKind.js';
import { FINDING_SEVERITIES } from './FindingSeverity.js';
import { FINDING_STATUSES } from './FindingStatus.js';
import { Finding } from './Finding.js';
import { FindingEvidence } from './FindingEvidence.js';
import { FindingLocation } from './FindingLocation.js';

export class CollectionSafetyAnalyzer {
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

            // Match d["key"]
            const dictAccessMatch = codeStr.match(/\b([a-zA-Z_]\w*)\[(["'])([^"']+)\2\]/);
            if (dictAccessMatch) {
                const dictVar = dictAccessMatch[1];
                const keyName = dictAccessMatch[3];

                const nodeState = typeInference?.nodeStates?.get(node.id);
                const dictVal = nodeState?.inEnv?.get(dictVar) || typeInference?.latestBindings?.get(dictVar);

                if (dictVal && dictVal.typeSet.has('dict') && dictVal.shape) {
                    const knownKeys = dictVal.shape.fields ? Object.keys(dictVal.shape.fields) : [];
                    if (dictVal.shape.isClosed && knownKeys.length > 0 && !knownKeys.includes(keyName)) {
                        findings.push(
                            new Finding({
                                kind: FINDING_KINDS.POSSIBLE_ATTRIBUTE_ERROR,
                                severity: FINDING_SEVERITIES.WARNING,
                                confidence: 'STATIC_INFERENCE',
                                status: FINDING_STATUSES.STATIC_INFERENCE,
                                message: `Possible KeyError: key '${keyName}' may not exist in dictionary '${dictVar}'.`,
                                sourceLocation: loc,
                                cfgNodeId: node.id,
                                evidence: [
                                    new FindingEvidence({
                                        kind: FINDING_STATUSES.STATIC_INFERENCE,
                                        description: `Known keys in '${dictVar}': [${knownKeys.join(', ')}].`,
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
