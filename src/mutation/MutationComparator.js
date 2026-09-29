/**
 * MutationComparator — Compares execution observations between original and mutant programs.
 */

import { MutationOracle, ORACLE_KINDS } from './MutationOracle.js';
import { BehavioralDelta } from '../repair/BehavioralDelta.js';

export class MutationComparator {
    /**
     * Compare original and mutant observations across multiple oracles.
     *
     * @param {object} origObs
     * @param {object} mutObs
     * @param {Array<MutationOracle>} [oracles=[]]
     * @returns {{ killed: boolean, oracleKind: string, reason: string, delta: BehavioralDelta }}
     */
    static compare(origObs = {}, mutObs = {}, oracles = []) {
        const activeOracles = oracles.length > 0 ? oracles : [
            new MutationOracle({ kind: ORACLE_KINDS.EXCEPTION }),
            new MutationOracle({ kind: ORACLE_KINDS.RETURN_VALUE }),
        ];

        for (const oracle of activeOracles) {
            const evalRes = oracle.evaluate(origObs, mutObs);
            if (evalRes.detected) {
                const delta = BehavioralDelta.compare(origObs, mutObs);
                return {
                    killed: true,
                    oracleKind: oracle.kind,
                    reason: evalRes.reason,
                    delta,
                };
            }
        }

        const delta = BehavioralDelta.compare(origObs, mutObs);
        return {
            killed: false,
            oracleKind: null,
            reason: 'No oracle detected behavioral differences',
            delta,
        };
    }
}
