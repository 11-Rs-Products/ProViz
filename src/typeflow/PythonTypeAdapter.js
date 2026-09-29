/**
 * PythonTypeAdapter — Python-specific static type inference, builtin summaries, and branch narrowing.
 */

import { LanguageTypeAdapter } from './LanguageTypeAdapter.js';
import { AbstractType, TYPE_KINDS } from './AbstractType.js';
import { AbstractValue, VALUE_CONFIDENCE } from './AbstractValue.js';
import { ConstantValue } from './ConstantValue.js';
import { CollectionShape } from './CollectionShape.js';
import { NULLABILITY } from './Nullability.js';

export class PythonTypeAdapter extends LanguageTypeAdapter {
    constructor() {
        super('python');
    }

    /**
     * Infers AbstractValue from a raw literal token.
     */
    inferLiteral(raw) {
        if (!raw || typeof raw !== 'string') return AbstractValue.unknown();
        const trimmed = raw.trim();

        // None
        if (trimmed === 'None') {
            return AbstractValue.fromConstant(ConstantValue.none(), VALUE_CONFIDENCE.STATIC_GUARANTEE);
        }

        // Boolean
        if (trimmed === 'True' || trimmed === 'False') {
            return AbstractValue.fromConstant(ConstantValue.bool(trimmed === 'True'), VALUE_CONFIDENCE.STATIC_GUARANTEE);
        }

        // Integer
        if (/^-?\d+$/.test(trimmed)) {
            const num = parseInt(trimmed, 10);
            return AbstractValue.fromConstant(ConstantValue.int(num), VALUE_CONFIDENCE.STATIC_GUARANTEE);
        }

        // Float
        if (/^-?\d+\.\d+([eE][+-]?\d+)?$/.test(trimmed)) {
            const flt = parseFloat(trimmed);
            return AbstractValue.fromConstant(ConstantValue.float(flt), VALUE_CONFIDENCE.STATIC_GUARANTEE);
        }

        // String
        if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
            const strVal = trimmed.substring(1, trimmed.length - 1);
            return AbstractValue.fromConstant(ConstantValue.string(strVal), VALUE_CONFIDENCE.STATIC_GUARANTEE);
        }

        // List literal: [] or [1, 2]
        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
            const inner = trimmed.substring(1, trimmed.length - 1).trim();
            const elements = inner ? inner.split(',').map(e => e.trim()).filter(Boolean) : [];
            const elemType = elements.length > 0 ? this.inferLiteral(elements[0]).typeSet.first() : AbstractType.unknown();
            return new AbstractValue({
                typeSet: [AbstractType.list(elemType)],
                nullability: NULLABILITY.NON_NULL,
                shape: new CollectionShape({ containerType: 'list', elementTypes: [elemType], fixedLength: elements.length }),
                confidence: VALUE_CONFIDENCE.STATIC_GUARANTEE,
            });
        }

        // Dict literal: {} or {'a': 1}
        if (trimmed.startsWith('{') && trimmed.endsWith('}') && (trimmed.includes(':') || trimmed === '{}')) {
            return new AbstractValue({
                typeSet: [AbstractType.dict(AbstractType.string(), AbstractType.unknown())],
                nullability: NULLABILITY.NON_NULL,
                shape: new CollectionShape({ containerType: 'dict', keyTypes: [AbstractType.string()], valueTypes: [AbstractType.unknown()] }),
                confidence: VALUE_CONFIDENCE.STATIC_GUARANTEE,
            });
        }

        // Tuple literal: (1, 2)
        if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
            const inner = trimmed.substring(1, trimmed.length - 1).trim();
            const elements = inner ? inner.split(',').map(e => e.trim()).filter(Boolean) : [];
            return new AbstractValue({
                typeSet: [AbstractType.tuple()],
                nullability: NULLABILITY.NON_NULL,
                shape: new CollectionShape({ containerType: 'tuple', fixedLength: elements.length }),
                confidence: VALUE_CONFIDENCE.STATIC_GUARANTEE,
            });
        }

        // Set literal: {1, 2}
        if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
            return new AbstractValue({
                typeSet: [AbstractType.set(AbstractType.unknown())],
                nullability: NULLABILITY.NON_NULL,
                shape: new CollectionShape({ containerType: 'set' }),
                confidence: VALUE_CONFIDENCE.STATIC_GUARANTEE,
            });
        }

        return AbstractValue.unknown();
    }

    /**
     * Infers result AbstractValue for binary operations.
     */
    inferBinaryOperation(op, leftVal, rightVal) {
        if (!leftVal || !rightVal) return AbstractValue.unknown();

        // 1. Constant folding if both are constants
        if (leftVal.isConstant() && rightVal.isConstant()) {
            const cL = leftVal.getConstant();
            const cR = rightVal.getConstant();

            try {
                if (cL.type === 'int' && cR.type === 'int') {
                    if (op === '+') return AbstractValue.fromConstant(ConstantValue.int(cL.value + cR.value));
                    if (op === '-') return AbstractValue.fromConstant(ConstantValue.int(cL.value - cR.value));
                    if (op === '*') return AbstractValue.fromConstant(ConstantValue.int(cL.value * cR.value));
                    if (op === '/') return AbstractValue.fromConstant(ConstantValue.float(cL.value / cR.value));
                    if (op === '//') return AbstractValue.fromConstant(ConstantValue.int(Math.floor(cL.value / cR.value)));
                    if (op === '%') return AbstractValue.fromConstant(ConstantValue.int(cL.value % cR.value));
                    if (op === '**') return AbstractValue.fromConstant(ConstantValue.int(cL.value ** cR.value));
                }
                if (cL.type === 'string' && cR.type === 'string' && op === '+') {
                    return AbstractValue.fromConstant(ConstantValue.string(cL.value + cR.value));
                }
                if (['==', '!=', '<', '<=', '>', '>=', 'is', 'is not'].includes(op)) {
                    let cmp = false;
                    if (op === '==') cmp = cL.value === cR.value;
                    if (op === '!=') cmp = cL.value !== cR.value;
                    if (op === '<') cmp = cL.value < cR.value;
                    if (op === '<=') cmp = cL.value <= cR.value;
                    if (op === '>') cmp = cL.value > cR.value;
                    if (op === '>=') cmp = cL.value >= cR.value;
                    if (op === 'is') cmp = cL.value === cR.value;
                    if (op === 'is not') cmp = cL.value !== cR.value;
                    return AbstractValue.fromConstant(ConstantValue.bool(cmp));
                }
            } catch {
                // Fallback to type inference
            }
        }

        // 2. Type-level inference
        const leftType = leftVal.typeSet.first();
        const rightType = rightVal.typeSet.first();

        // Comparison operations return bool
        if (['==', '!=', '<', '<=', '>', '>=', 'is', 'is not', 'in', 'not in'].includes(op)) {
            return AbstractValue.fromType(AbstractType.bool());
        }

        // Arithmetic
        if (op === '+' || op === '-' || op === '*' || op === '//' || op === '%' || op === '**') {
            if (leftType?.kind === TYPE_KINDS.INT && rightType?.kind === TYPE_KINDS.INT) {
                return AbstractValue.fromType(AbstractType.int());
            }
            if (leftType?.isNumeric() || rightType?.isNumeric()) {
                return AbstractValue.fromType(AbstractType.float());
            }
            if (leftType?.kind === TYPE_KINDS.STRING && rightType?.kind === TYPE_KINDS.STRING && op === '+') {
                return AbstractValue.fromType(AbstractType.string());
            }
            if (leftType?.kind === TYPE_KINDS.LIST && rightType?.kind === TYPE_KINDS.LIST && op === '+') {
                const elemType = leftType.parameters[0] || rightType.parameters[0] || AbstractType.unknown();
                return AbstractValue.fromType(AbstractType.list(elemType));
            }
        }

        if (op === '/') {
            return AbstractValue.fromType(AbstractType.float());
        }

        return AbstractValue.unknown();
    }

    /**
     * Infers result AbstractValue for unary operations.
     */
    inferUnaryOperation(op, val) {
        if (!val) return AbstractValue.unknown();

        if (op === 'not') {
            if (val.isConstant()) {
                const c = val.getConstant();
                return AbstractValue.fromConstant(ConstantValue.bool(!c.value));
            }
            return AbstractValue.fromType(AbstractType.bool());
        }

        if (op === '-' || op === '+') {
            if (val.isConstant() && val.getConstant().type === 'int') {
                const num = val.getConstant().value;
                return AbstractValue.fromConstant(ConstantValue.int(op === '-' ? -num : num));
            }
            return AbstractValue.fromType(val.typeSet.first() || AbstractType.int());
        }

        return AbstractValue.unknown();
    }

    /**
     * Infers result for Python standard built-in functions.
     */
    inferBuiltin(name, args = []) {
        switch (name) {
            case 'len':
                return AbstractValue.fromType(AbstractType.int());
            case 'abs':
                if (args[0] && args[0].typeSet.first()?.kind === TYPE_KINDS.FLOAT) {
                    return AbstractValue.fromType(AbstractType.float());
                }
                return AbstractValue.fromType(AbstractType.int());
            case 'sum':
                return AbstractValue.fromType(AbstractType.int());
            case 'min':
            case 'max':
                return args[0] ? AbstractValue.fromType(args[0].typeSet.first() || AbstractType.unknown()) : AbstractValue.unknown();
            case 'int':
                if (args[0] && args[0].isConstant() && !isNaN(Number(args[0].getConstant().value))) {
                    return AbstractValue.fromConstant(ConstantValue.int(parseInt(args[0].getConstant().value, 10)));
                }
                return AbstractValue.fromType(AbstractType.int());
            case 'float':
                return AbstractValue.fromType(AbstractType.float());
            case 'str':
                if (args[0] && args[0].isConstant()) {
                    return AbstractValue.fromConstant(ConstantValue.string(String(args[0].getConstant().value)));
                }
                return AbstractValue.fromType(AbstractType.string());
            case 'bool':
                return AbstractValue.fromType(AbstractType.bool());
            case 'range':
                return new AbstractValue({
                    typeSet: [new AbstractType({ kind: TYPE_KINDS.ITERATOR, name: 'range' })],
                    nullability: NULLABILITY.NON_NULL,
                    shape: new CollectionShape({ containerType: 'range', elementTypes: [AbstractType.int()] }),
                });
            case 'enumerate':
                return new AbstractValue({
                    typeSet: [new AbstractType({ kind: TYPE_KINDS.ITERATOR, name: 'enumerate' })],
                    nullability: NULLABILITY.NON_NULL,
                });
            case 'zip':
                return new AbstractValue({
                    typeSet: [new AbstractType({ kind: TYPE_KINDS.ITERATOR, name: 'zip' })],
                    nullability: NULLABILITY.NON_NULL,
                });
            case 'list':
                return new AbstractValue({
                    typeSet: [AbstractType.list(AbstractType.unknown())],
                    nullability: NULLABILITY.NON_NULL,
                    shape: new CollectionShape({ containerType: 'list' }),
                });
            case 'dict':
                return new AbstractValue({
                    typeSet: [AbstractType.dict(AbstractType.string(), AbstractType.unknown())],
                    nullability: NULLABILITY.NON_NULL,
                    shape: new CollectionShape({ containerType: 'dict' }),
                });
            case 'tuple':
                return new AbstractValue({
                    typeSet: [AbstractType.tuple()],
                    nullability: NULLABILITY.NON_NULL,
                    shape: new CollectionShape({ containerType: 'tuple' }),
                });
            case 'set':
                return new AbstractValue({
                    typeSet: [AbstractType.set(AbstractType.unknown())],
                    nullability: NULLABILITY.NON_NULL,
                    shape: new CollectionShape({ containerType: 'set' }),
                });
            case 'isinstance':
                return AbstractValue.fromType(AbstractType.bool());
            case 'type':
                return AbstractValue.fromType(new AbstractType({ kind: TYPE_KINDS.CLASS, name: 'type' }));
            default:
                return AbstractValue.unknown();
        }
    }

    /**
     * Narrows type environment based on branch condition predicates.
     */
    inferBranchNarrowing(condExpr, isTrueBranch, currentEnv) {
        if (!condExpr || !currentEnv) return currentEnv;
        const nextEnv = currentEnv.clone();
        const trimmed = condExpr.trim();

        // 1. x is None
        const isNoneMatch = trimmed.match(/^([a-zA-Z_]\w*)\s+is\s+None$/);
        if (isNoneMatch) {
            const varName = isNoneMatch[1];
            if (isTrueBranch) {
                nextEnv.set(varName, AbstractValue.fromConstant(ConstantValue.none()));
            } else {
                const curVal = currentEnv.get(varName);
                if (curVal) {
                    const nonNullTypes = curVal.typeSet.toArray().filter(t => t.kind !== TYPE_KINDS.NONE);
                    nextEnv.set(varName, new AbstractValue({
                        typeSet: nonNullTypes.length > 0 ? nonNullTypes : [AbstractType.unknown()],
                        nullability: NULLABILITY.NON_NULL,
                        constants: curVal.constants,
                    }));
                }
            }
            return nextEnv;
        }

        // 2. x is not None
        const isNotNoneMatch = trimmed.match(/^([a-zA-Z_]\w*)\s+is\s+not\s+None$/);
        if (isNotNoneMatch) {
            const varName = isNotNoneMatch[1];
            if (isTrueBranch) {
                const curVal = currentEnv.get(varName);
                if (curVal) {
                    const nonNullTypes = curVal.typeSet.toArray().filter(t => t.kind !== TYPE_KINDS.NONE);
                    nextEnv.set(varName, new AbstractValue({
                        typeSet: nonNullTypes.length > 0 ? nonNullTypes : [AbstractType.unknown()],
                        nullability: NULLABILITY.NON_NULL,
                        constants: curVal.constants,
                    }));
                }
            } else {
                nextEnv.set(varName, AbstractValue.fromConstant(ConstantValue.none()));
            }
            return nextEnv;
        }

        // 3. isinstance(x, int)
        const isinstanceMatch = trimmed.match(/^isinstance\(\s*([a-zA-Z_]\w*)\s*,\s*([a-zA-Z_]\w*)\s*\)$/);
        if (isinstanceMatch) {
            const varName = isinstanceMatch[1];
            const targetType = isinstanceMatch[2];
            if (isTrueBranch) {
                let narrowedType = AbstractType.unknown();
                if (targetType === 'int') narrowedType = AbstractType.int();
                else if (targetType === 'float') narrowedType = AbstractType.float();
                else if (targetType === 'str') narrowedType = AbstractType.string();
                else if (targetType === 'bool') narrowedType = AbstractType.bool();
                else if (targetType === 'list') narrowedType = AbstractType.list();
                else if (targetType === 'dict') narrowedType = AbstractType.dict();

                nextEnv.set(varName, AbstractValue.fromType(narrowedType));
            }
            return nextEnv;
        }

        return nextEnv;
    }
}
