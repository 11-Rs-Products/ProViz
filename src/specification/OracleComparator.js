/**
 * OracleComparator — Compares oracles and their evaluation results.
 */

import { OracleEvaluator } from './OracleEvaluator.js';

export class OracleComparator {
    /**
     * Compares an oracle evaluated on a baseline vs mutated/changed observation.
     * @param {Oracle} oracle
     * @param {object} baselineObs
     * @param {object} changedObs
     * @returns {{ isDistinguished: boolean, baselineResult: any, changedResult: any, explanation: string }}
     */
    static compareDifferential(oracle, baselineObs, changedObs) {
        const baselineResult = OracleEvaluator.evaluate(oracle, baselineObs);
        const changedResult = OracleEvaluator.evaluate(oracle, changedObs);

        const isDistinguished = baselineResult.status !== changedResult.status ||
            (baselineResult.observed !== changedResult.observed);

        return {
            isDistinguished,
            baselineResult,
            changedResult,
            explanation: isDistinguished
                ? `Oracle distinguished executions: baseline was ${baselineResult.status} (${JSON.stringify(baselineResult.observed)}), changed was ${changedResult.status} (${JSON.stringify(changedResult.observed)})`
                : `Oracle evaluated identically on both executions: ${baselineResult.status}`,
        };
    }
}
