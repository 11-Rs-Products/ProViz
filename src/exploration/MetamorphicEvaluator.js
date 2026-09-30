/**
 * MetamorphicEvaluator — Executes metamorphic pairs against a program executor and checks the metamorphic relation.
 */

import { MetamorphicOracle } from './MetamorphicOracle.js';
import { MetamorphicCase } from './MetamorphicCase.js';

export class MetamorphicEvaluator {
    /**
     * @param {MetamorphicRelation} relation
     * @param {any} seedInput
     * @param {any} transformedInput
     * @param {Function} executor - (input) => ({ returnValue, exception })
     * @returns {MetamorphicCase}
     */
    static evaluate(relation, seedInput, transformedInput, executor) {
        let baseRes = null;
        let transRes = null;

        try {
            baseRes = executor(seedInput);
        } catch (err) {
            baseRes = { exception: { type: err.name, message: err.message } };
        }

        try {
            transRes = executor(transformedInput);
        } catch (err) {
            transRes = { exception: { type: err.name, message: err.message } };
        }

        const oracleResult = MetamorphicOracle.evaluate(
            relation.outputRelation,
            baseRes?.returnValue,
            transRes?.returnValue
        );

        return new MetamorphicCase({
            relation,
            seedInput,
            transformedInput,
            baselineOutput: baseRes?.returnValue,
            transformedOutput: transRes?.returnValue,
            passed: oracleResult.satisfies,
            reason: oracleResult.reason,
        });
    }
}
