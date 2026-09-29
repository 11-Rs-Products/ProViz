/**
 * OracleBuilder — Builds the weakest justified Oracle from a Specification.
 */

import { Oracle } from './Oracle.js';
import { OracleKind } from './OracleKind.js';
import { OracleConfidence } from './OracleConfidence.js';
import { OracleExpression } from './OracleExpression.js';
import { SpecificationKind } from './SpecificationKind.js';

export class OracleBuilder {
    /**
     * @param {Specification} spec
     * @returns {Oracle}
     */
    static fromSpecification(spec) {
        if (!spec) return null;

        switch (spec.kind) {
            case SpecificationKind.RETURN_PROPERTY:
                return new Oracle({
                    kind: OracleKind.RETURN_VALUE,
                    confidence: OracleConfidence.EXACT,
                    specificationId: spec.id,
                    expected: spec.expectedValue,
                    expression: new OracleExpression({
                        expression: spec.returnExpression || '$return',
                        expectedValue: spec.expectedValue,
                    }),
                    evidence: spec.evidence,
                    metadata: { condition: spec.condition },
                });

            case SpecificationKind.EXCEPTION_PROPERTY:
                return new Oracle({
                    kind: spec.shouldRaise ? OracleKind.EXCEPTION_TYPE : OracleKind.EXCEPTION_ABSENCE,
                    confidence: OracleConfidence.EXACT,
                    specificationId: spec.id,
                    expectedException: spec.exceptionType,
                    evidence: spec.evidence,
                    metadata: { condition: spec.condition, shouldRaise: spec.shouldRaise },
                });

            case SpecificationKind.RELATIONAL_PROPERTY:
                return new Oracle({
                    kind: OracleKind.RETURN_RELATION,
                    confidence: OracleConfidence.RELATIONAL,
                    specificationId: spec.id,
                    expression: new OracleExpression({
                        expression: `${spec.leftExpression} ${spec.operator} ${spec.rightExpression}`,
                        operator: spec.operator,
                    }),
                    evidence: spec.evidence,
                    metadata: { condition: spec.condition },
                });

            case SpecificationKind.INVARIANT:
            case SpecificationKind.RANGE_PROPERTY:
                return new Oracle({
                    kind: OracleKind.PROPERTY,
                    confidence: OracleConfidence.PROPERTY,
                    specificationId: spec.id,
                    expression: new OracleExpression({
                        expression: spec.expression,
                    }),
                    evidence: spec.evidence,
                    metadata: { scope: spec.scope },
                });

            case SpecificationKind.POSTCONDITION:
                return new Oracle({
                    kind: OracleKind.PROPERTY,
                    confidence: OracleConfidence.PROPERTY,
                    specificationId: spec.id,
                    expected: spec.expectedReturn,
                    expression: new OracleExpression({
                        expression: spec.expression,
                        expectedValue: spec.expectedReturn,
                    }),
                    evidence: spec.evidence,
                });

            default:
                return new Oracle({
                    kind: OracleKind.CUSTOM_DECLARED,
                    confidence: OracleConfidence.OBSERVATIONAL,
                    specificationId: spec.id,
                    evidence: spec.evidence,
                });
        }
    }
}
