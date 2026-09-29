/**
 * BuiltinRules — Standard catalog of built-in verification rules.
 */

import { VerificationRule } from './VerificationRule.js';
import { VerificationRuleSet } from './VerificationRuleSet.js';
import { FINDING_KINDS } from './FindingKind.js';
import { FINDING_SEVERITIES } from './FindingSeverity.js';
import { NullSafetyAnalyzer } from './NullSafetyAnalyzer.js';
import { DivisionSafetyAnalyzer } from './DivisionSafetyAnalyzer.js';
import { IndexSafetyAnalyzer } from './IndexSafetyAnalyzer.js';
import { AttributeSafetyAnalyzer } from './AttributeSafetyAnalyzer.js';
import { OperationSafetyAnalyzer } from './OperationSafetyAnalyzer.js';
import { CollectionSafetyAnalyzer } from './CollectionSafetyAnalyzer.js';
import { ControlFlowAnalyzer } from './ControlFlowAnalyzer.js';
import { BooleanAnalyzer } from './BooleanAnalyzer.js';
import { CallSafetyAnalyzer } from './CallSafetyAnalyzer.js';
import { MutationSafetyAnalyzer } from './MutationSafetyAnalyzer.js';

export function createBuiltinRuleSet() {
    const set = new VerificationRuleSet();

    const nullAnalyzer = new NullSafetyAnalyzer();
    const divAnalyzer = new DivisionSafetyAnalyzer();
    const idxAnalyzer = new IndexSafetyAnalyzer();
    const attrAnalyzer = new AttributeSafetyAnalyzer();
    const opAnalyzer = new OperationSafetyAnalyzer();
    const collAnalyzer = new CollectionSafetyAnalyzer();
    const cfAnalyzer = new ControlFlowAnalyzer();
    const boolAnalyzer = new BooleanAnalyzer();
    const callAnalyzer = new CallSafetyAnalyzer();
    const mutAnalyzer = new MutationSafetyAnalyzer();

    set.register(
        new VerificationRule({
            id: 'rule_null_safety',
            name: 'Null Safety Verification',
            description: 'Detects definite and possible attribute access, indexing, or calls on None.',
            kind: FINDING_KINDS.POSSIBLE_NONE_ACCESS,
            severity: FINDING_SEVERITIES.WARNING,
            matcher: (ctx) => nullAnalyzer.analyze(ctx.cfg, ctx.typeInference),
        })
    );

    set.register(
        new VerificationRule({
            id: 'rule_division_safety',
            name: 'Division By Zero Verification',
            description: 'Detects definite and possible division, floor division, and modulo by zero.',
            kind: FINDING_KINDS.POSSIBLE_DIVISION_BY_ZERO,
            severity: FINDING_SEVERITIES.WARNING,
            matcher: (ctx) => divAnalyzer.analyze(ctx.cfg, ctx.typeInference, ctx.ranges),
        })
    );

    set.register(
        new VerificationRule({
            id: 'rule_index_safety',
            name: 'Index Bounds & Type Verification',
            description: 'Detects out-of-bounds indexing and invalid index types on sequences.',
            kind: FINDING_KINDS.POSSIBLE_INDEX_OUT_OF_BOUNDS,
            severity: FINDING_SEVERITIES.WARNING,
            matcher: (ctx) => idxAnalyzer.analyze(ctx.cfg, ctx.typeInference, ctx.ranges),
        })
    );

    set.register(
        new VerificationRule({
            id: 'rule_attribute_safety',
            name: 'Attribute Existence Verification',
            description: 'Detects accesses to missing attributes on statically closed class shapes.',
            kind: FINDING_KINDS.POSSIBLE_ATTRIBUTE_ERROR,
            severity: FINDING_SEVERITIES.WARNING,
            matcher: (ctx) => attrAnalyzer.analyze(ctx.cfg, ctx.typeInference),
        })
    );

    set.register(
        new VerificationRule({
            id: 'rule_operation_safety',
            name: 'Operation Type Compatibility Verification',
            description: 'Detects unsupported binary/unary operations (e.g. string + integer).',
            kind: FINDING_KINDS.POSSIBLE_TYPE_MISMATCH,
            severity: FINDING_SEVERITIES.ERROR,
            matcher: (ctx) => opAnalyzer.analyze(ctx.cfg, ctx.typeInference),
        })
    );

    set.register(
        new VerificationRule({
            id: 'rule_collection_safety',
            name: 'Collection Key Verification',
            description: 'Detects potential KeyErrors on dictionary lookups with missing keys.',
            kind: FINDING_KINDS.POSSIBLE_ATTRIBUTE_ERROR,
            severity: FINDING_SEVERITIES.WARNING,
            matcher: (ctx) => collAnalyzer.analyze(ctx.cfg, ctx.typeInference),
        })
    );

    set.register(
        new VerificationRule({
            id: 'rule_control_flow',
            name: 'Control Flow Reachability & Loops',
            description: 'Detects unreachable basic blocks and infinite loops.',
            kind: FINDING_KINDS.UNREACHABLE_CODE,
            severity: FINDING_SEVERITIES.WARNING,
            matcher: (ctx) => cfAnalyzer.analyze(ctx.cfg, ctx.ssa),
        })
    );

    set.register(
        new VerificationRule({
            id: 'rule_boolean_conditions',
            name: 'Boolean & Constant Conditions',
            description: 'Detects statically constant conditions and dead branches.',
            kind: FINDING_KINDS.CONSTANT_CONDITION,
            severity: FINDING_SEVERITIES.INFO,
            matcher: (ctx) => boolAnalyzer.analyze(ctx.cfg, ctx.typeInference, ctx.ranges),
        })
    );

    set.register(
        new VerificationRule({
            id: 'rule_call_safety',
            name: 'Function Call & Argument Verification',
            description: 'Detects argument count and type mismatches in function calls.',
            kind: FINDING_KINDS.POSSIBLE_CALL_ARGUMENT_MISMATCH,
            severity: FINDING_SEVERITIES.ERROR,
            matcher: (ctx) => callAnalyzer.analyze(ctx.cfg, ctx.typeInference, ctx.functionSummaries),
        })
    );

    set.register(
        new VerificationRule({
            id: 'rule_mutation_safety',
            name: 'Mutation & Aliasing Risk Verification',
            description: 'Detects side-effects and aliasing risks across shared mutable structures.',
            kind: FINDING_KINDS.ALIASING_RISK,
            severity: FINDING_SEVERITIES.INFO,
            matcher: (ctx) => mutAnalyzer.analyze(ctx.cfg, ctx.dataflowGraph, ctx.typeInference),
        })
    );

    return set;
}
