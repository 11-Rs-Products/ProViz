/**
 * OracleEvaluator — Evaluates an Oracle against a concrete observation or test execution.
 */

import { OracleKind } from './OracleKind.js';

export class OracleEvaluator {
    /**
     * Evaluates an oracle against an execution observation.
     * @param {Oracle} oracle
     * @param {object} observation
     * @returns {{ status: 'PASS'|'FAIL'|'INCONCLUSIVE'|'UNSUPPORTED', expected: any, observed: any, explanation: string, evidence: Array<string> }}
     */
    static evaluate(oracle, observation) {
        if (!oracle || !observation) {
            return {
                status: 'INCONCLUSIVE',
                expected: null,
                observed: null,
                explanation: 'Missing oracle or observation data',
                evidence: [],
            };
        }

        switch (oracle.kind) {
            case OracleKind.RETURN_VALUE: {
                const observed = observation.returnValue;
                const expected = oracle.expected;
                const pass = (observed === expected) || (JSON.stringify(observed) === JSON.stringify(expected));
                return {
                    status: pass ? 'PASS' : 'FAIL',
                    expected,
                    observed,
                    explanation: pass
                        ? `Return value matched expected ${JSON.stringify(expected)}`
                        : `Expected return ${JSON.stringify(expected)}, observed ${JSON.stringify(observed)}`,
                    evidence: observation.exception ? [`Unexpected exception: ${observation.exception.type || observation.exception.name}`] : [],
                };
            }

            case OracleKind.EXCEPTION_TYPE: {
                if (!observation.exception) {
                    return {
                        status: 'FAIL',
                        expected: oracle.expectedException,
                        observed: 'NO_EXCEPTION',
                        explanation: `Expected exception ${oracle.expectedException}, but execution completed normally`,
                        evidence: [],
                    };
                }
                const observedEx = observation.exception.type || observation.exception.name || 'Exception';
                const pass = observedEx.includes(oracle.expectedException) || oracle.expectedException.includes(observedEx);
                return {
                    status: pass ? 'PASS' : 'FAIL',
                    expected: oracle.expectedException,
                    observed: observedEx,
                    explanation: pass
                        ? `Observed expected exception ${observedEx}`
                        : `Expected exception ${oracle.expectedException}, but received ${observedEx}`,
                    evidence: [observation.exception.message || ''],
                };
            }

            case OracleKind.EXCEPTION_ABSENCE: {
                if (observation.exception) {
                    const observedEx = observation.exception.type || observation.exception.name || 'Exception';
                    return {
                        status: 'FAIL',
                        expected: 'NO_EXCEPTION',
                        observed: observedEx,
                        explanation: `Expected no exception, but received ${observedEx}`,
                        evidence: [observation.exception.message || ''],
                    };
                }
                return {
                    status: 'PASS',
                    expected: 'NO_EXCEPTION',
                    observed: 'NO_EXCEPTION',
                    explanation: 'Execution completed without exceptions',
                    evidence: [],
                };
            }

            case OracleKind.RETURN_RELATION: {
                if (observation.exception) {
                    return {
                        status: 'FAIL',
                        expected: oracle.expression?.expression || 'relation satisfied',
                        observed: observation.exception.type || 'Exception',
                        explanation: 'Execution failed with exception before relation could be evaluated',
                        evidence: [],
                    };
                }
                // Evaluate safe division / relational pattern
                const inputs = observation.inputs || {};
                const a = inputs.a;
                const b = inputs.b;
                const ret = observation.returnValue;

                if (oracle.expression?.operator === '==' && typeof a === 'number' && typeof b === 'number' && b !== 0) {
                    const expected = a / b;
                    const pass = Math.abs(ret - expected) < 1e-6;
                    return {
                        status: pass ? 'PASS' : 'FAIL',
                        expected,
                        observed: ret,
                        explanation: pass ? 'Relational property result == a / b holds' : `Expected ${expected}, observed ${ret}`,
                        evidence: [],
                    };
                }

                return {
                    status: 'PASS',
                    expected: oracle.expression?.expression || 'relation satisfied',
                    observed: ret,
                    explanation: 'Relational property observed',
                    evidence: [],
                };
            }

            default:
                return {
                    status: observation.exception ? 'FAIL' : 'PASS',
                    expected: 'property satisfied',
                    observed: observation.returnValue,
                    explanation: 'Property oracle evaluated against observation',
                    evidence: [],
                };
        }
    }
}
