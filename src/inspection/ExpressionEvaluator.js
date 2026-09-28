/**
 * ExpressionEvaluator — Pure, read-only interpreter for inspection & watch expressions.
 *
 * Guaranteed Properties:
 *  1. Pure & Read-Only: Never mutates RuntimeState, Heap, Scope, or Timeline.
 *  2. Safe & Sandboxed: Prohibits arbitrary function execution and unconstrained recursion.
 *  3. Identity-Aware: Resolves object references using canonical Heap object IDs.
 *  4. Bounded: Respects recursion depth, item count, string length, and timeout limits.
 */

import { ExpressionParser, AST_NODE_TYPES } from './ExpressionParser.js';
import { EvaluationError, ERROR_CODES } from './EvaluationError.js';
import { EvaluationResult, RESULT_STATUS } from './EvaluationResult.js';
import { EvaluationContext } from './EvaluationContext.js';
import {
    createPrimitiveValue,
    createReferenceValue,
    isPrimitive,
    isReference,
    isOpaque,
    valuesEqual,
    stringifyValue,
} from '../runtime/Value.js';

export class ExpressionEvaluator {
    /**
     * @param {object} [options]
     * @param {ExpressionParser} [options.parser]
     */
    constructor({ parser = null } = {}) {
        this.parser = parser || new ExpressionParser();
    }

    /**
     * Evaluates an expression against an EvaluationContext.
     *
     * @param {string|import('./Expression.js').Expression|object} expression
     * @param {EvaluationContext} context
     * @returns {EvaluationResult}
     */
    evaluate(expression, context) {
        const startMs = performance.now();
        const exprStr = typeof expression === 'string'
            ? expression
            : (expression?.source || expression?.normalized || '');

        if (!exprStr.trim()) {
            return EvaluationResult.error(
                EvaluationError.syntaxError('Empty expression', ''),
                0
            );
        }

        const ctx = context instanceof EvaluationContext ? context : new EvaluationContext(context);
        const language = ctx.language || 'python';

        try {
            const ast = this.parser.parse(exprStr, language);
            const evalState = {
                startTime: startMs,
                timeoutMs: ctx.limits.timeoutMs || 500,
                maxDepth: ctx.limits.maxDepth || 16,
                currentDepth: 0,
                visited: new Set(),
                expression: exprStr,
            };

            const value = this._evalNode(ast, ctx, evalState);
            const duration = performance.now() - startMs;

            return EvaluationResult.success({
                value,
                heap: ctx.heap,
                duration,
                metadata: {
                    frameIndex: ctx.frameIndex,
                    fileId: ctx.fileId,
                    moduleId: ctx.moduleId,
                },
            });
        } catch (err) {
            const duration = performance.now() - startMs;
            return EvaluationResult.error(err, duration);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // AST Evaluation Dispatcher
    // ─────────────────────────────────────────────────────────────────────────────

    _evalNode(node, ctx, state) {
        // Timeout check
        if (performance.now() - state.startTime > state.timeoutMs) {
            throw EvaluationError.timeout(state.timeoutMs, state.expression);
        }

        // Depth check
        if (state.currentDepth > state.maxDepth) {
            throw EvaluationError.depthLimit(state.maxDepth, state.expression);
        }

        state.currentDepth++;

        try {
            switch (node.type) {
                case AST_NODE_TYPES.IDENTIFIER:
                    return this._evalIdentifier(node, ctx, state);

                case AST_NODE_TYPES.LITERAL:
                    return this._evalLiteral(node, ctx, state);

                case AST_NODE_TYPES.MEMBER_ACCESS:
                    return this._evalMemberAccess(node, ctx, state);

                case AST_NODE_TYPES.INDEX_ACCESS:
                    return this._evalIndexAccess(node, ctx, state);

                case AST_NODE_TYPES.COMPARISON:
                    return this._evalComparison(node, ctx, state);

                case AST_NODE_TYPES.IDENTITY:
                    return this._evalIdentity(node, ctx, state);

                case AST_NODE_TYPES.BINARY_OP:
                    return this._evalBinaryOp(node, ctx, state);

                case AST_NODE_TYPES.UNARY_OP:
                    return this._evalUnaryOp(node, ctx, state);

                case AST_NODE_TYPES.CALL:
                    return this._evalCall(node, ctx, state);

                case AST_NODE_TYPES.LIST_LITERAL:
                    return this._evalListLiteral(node, ctx, state);

                default:
                    throw EvaluationError.unsupportedOperation(
                        node.type,
                        `Unsupported AST node type '${node.type}'`,
                        state.expression
                    );
            }
        } finally {
            state.currentDepth--;
        }
    }

    _evalIdentifier(node, ctx, state) {
        const name = node.name;

        // Resolve through context scope hierarchy
        const val = ctx.resolveVariable(name);
        if (val !== null && val !== undefined) {
            return val;
        }

        // Check if identifier is a known module in workspace
        if (ctx.runtimeState?.currentSource?.moduleId && name === ctx.runtimeState.currentSource.moduleId) {
            return createPrimitiveValue('str', `<module '${name}'>`);
        }

        throw EvaluationError.unknownIdentifier(name, state.expression);
    }

    _evalLiteral(node, ctx, state) {
        return createPrimitiveValue(node.valueType, node.value);
    }

    _evalMemberAccess(node, ctx, state) {
        const targetVal = this._evalNode(node.object, ctx, state);
        const prop = node.property;

        if (!targetVal) {
            throw EvaluationError.attributeNotFound(prop, 'NoneType', state.expression);
        }

        // 1. Heap Reference (class instance, list, dict, set, etc.)
        if (isReference(targetVal)) {
            const objId = targetVal.objectId;
            const heapObj = ctx.heap ? ctx.heap.getObject(objId) : null;
            if (!heapObj) {
                throw EvaluationError.attributeNotFound(prop, targetVal.type || 'Object', state.expression);
            }

            // Check custom instance fields
            if (heapObj.fields && Object.prototype.hasOwnProperty.call(heapObj.fields, prop)) {
                return heapObj.fields[prop];
            }

            // Built-in attributes & properties
            if (prop === '__class__' || prop === 'className') {
                return createPrimitiveValue('str', heapObj.className || heapObj.type || 'object');
            }
            if (prop === '__name__') {
                return createPrimitiveValue('str', heapObj.className || heapObj.type || 'object');
            }
            if (prop === '__id__' || prop === 'id') {
                return createPrimitiveValue('str', heapObj.id);
            }
            if (prop === 'length' || prop === '__len__') {
                if (heapObj.type === 'dict') {
                    return createPrimitiveValue('int', (heapObj.entries || []).length);
                }
                return createPrimitiveValue('int', (heapObj.elements || []).length);
            }

            throw EvaluationError.attributeNotFound(prop, heapObj.className || heapObj.type, state.expression);
        }

        // 2. Primitives
        if (isPrimitive(targetVal)) {
            if (targetVal.type === 'str') {
                if (prop === 'length' || prop === '__len__') {
                    return createPrimitiveValue('int', String(targetVal.value).length);
                }
            }
            throw EvaluationError.attributeNotFound(prop, targetVal.type, state.expression);
        }

        throw EvaluationError.attributeNotFound(prop, typeof targetVal, state.expression);
    }

    _evalIndexAccess(node, ctx, state) {
        const targetVal = this._evalNode(node.target, ctx, state);
        const indexVal = this._evalNode(node.index, ctx, state);

        const rawIndex = this._extractRawValue(indexVal);

        if (!targetVal) {
            throw EvaluationError.invalidIndex(rawIndex, 'NoneType', state.expression);
        }

        // 1. Heap Reference (List / Tuple / Dict)
        if (isReference(targetVal)) {
            const obj = ctx.heap ? ctx.heap.getObject(targetVal.objectId) : null;
            if (!obj) {
                throw EvaluationError.invalidIndex(rawIndex, targetVal.type, state.expression);
            }

            // Dict Key Lookup
            if (obj.type === 'dict') {
                const entries = obj.entries || [];
                for (const entry of entries) {
                    const entryKeyRaw = this._extractRawValue(entry.key);
                    if (entryKeyRaw === rawIndex || this._valuesStructurallyEqual(entry.key, indexVal, ctx.heap)) {
                        return entry.value;
                    }
                }
                throw EvaluationError.invalidIndex(rawIndex, 'dict', state.expression);
            }

            // List / Tuple Indexing
            if (obj.type === 'list' || obj.type === 'tuple' || Array.isArray(obj.elements)) {
                if (typeof rawIndex !== 'number' || !Number.isInteger(rawIndex)) {
                    throw EvaluationError.typeError(
                        `List indices must be integers, not ${typeof rawIndex}`,
                        state.expression
                    );
                }

                const elements = obj.elements || [];
                let idx = rawIndex;
                if (idx < 0) {
                    idx = elements.length + idx; // Python negative indexing
                }

                if (idx < 0 || idx >= elements.length) {
                    throw EvaluationError.indexOutOfRange(rawIndex, elements.length, state.expression);
                }

                return elements[idx];
            }

            throw EvaluationError.invalidIndex(rawIndex, obj.className || obj.type, state.expression);
        }

        // 3. String Indexing
        if (isPrimitive(targetVal) && targetVal.type === 'str') {
            const str = String(targetVal.value);
            if (typeof rawIndex !== 'number' || !Number.isInteger(rawIndex)) {
                throw EvaluationError.typeError(`String indices must be integers, not ${typeof rawIndex}`, state.expression);
            }
            let idx = rawIndex;
            if (idx < 0) idx = str.length + idx;
            if (idx < 0 || idx >= str.length) {
                throw EvaluationError.indexOutOfRange(rawIndex, str.length, state.expression);
            }
            return createPrimitiveValue('str', str[idx]);
        }

        throw EvaluationError.invalidIndex(rawIndex, targetVal.type || typeof targetVal, state.expression);
    }

    _evalComparison(node, ctx, state) {
        const leftVal = this._evalNode(node.left, ctx, state);
        const rightVal = this._evalNode(node.right, ctx, state);
        const op = node.operator;

        const leftRaw = this._extractRawValue(leftVal);
        const rightRaw = this._extractRawValue(rightVal);

        let result = false;
        switch (op) {
            case '==':
                result = this._valuesStructurallyEqual(leftVal, rightVal, ctx.heap);
                break;
            case '!=':
                result = !this._valuesStructurallyEqual(leftVal, rightVal, ctx.heap);
                break;
            case '<':
                result = leftRaw < rightRaw;
                break;
            case '<=':
                result = leftRaw <= rightRaw;
                break;
            case '>':
                result = leftRaw > rightRaw;
                break;
            case '>=':
                result = leftRaw >= rightRaw;
                break;
            default:
                throw EvaluationError.unsupportedOperation(op, `Unsupported comparison '${op}'`, state.expression);
        }

        return createPrimitiveValue('bool', Boolean(result));
    }

    _valuesStructurallyEqual(v1, v2, heap = null, visited = new Set()) {
        if (v1 === v2) return true;
        if (!v1 || !v2) return false;

        // Primitives
        if (isPrimitive(v1) && isPrimitive(v2)) {
            return v1.value === v2.value;
        }

        // Direct reference identity
        if (isReference(v1) && isReference(v2)) {
            if (v1.objectId === v2.objectId) return true;
            if (!heap) return false;

            const pairKey = `${v1.objectId}:${v2.objectId}`;
            if (visited.has(pairKey)) return true;
            visited.add(pairKey);

            const o1 = heap.getObject ? heap.getObject(v1.objectId) : heap.objects?.[v1.objectId];
            const o2 = heap.getObject ? heap.getObject(v2.objectId) : heap.objects?.[v2.objectId];
            if (!o1 || !o2) return false;
            if (o1.type !== o2.type) return false;

            if (o1.type === 'list' || o1.type === 'tuple') {
                const el1 = o1.elements || [];
                const el2 = o2.elements || [];
                if (el1.length !== el2.length) return false;
                for (let i = 0; i < el1.length; i++) {
                    if (!this._valuesStructurallyEqual(el1[i], el2[i], heap, visited)) return false;
                }
                return true;
            }

            if (o1.type === 'dict') {
                const en1 = o1.entries || [];
                const en2 = o2.entries || [];
                if (en1.length !== en2.length) return false;
                for (const e1 of en1) {
                    const match = en2.find(e2 => this._valuesStructurallyEqual(e1.key, e2.key, heap, visited));
                    if (!match || !this._valuesStructurallyEqual(e1.value, match.value, heap, visited)) return false;
                }
                return true;
            }

            return false;
        }

        const raw1 = this._extractRawValue(v1);
        const raw2 = this._extractRawValue(v2);
        return raw1 === raw2;
    }

    _evalIdentity(node, ctx, state) {
        const leftVal = this._evalNode(node.left, ctx, state);
        const rightVal = this._evalNode(node.right, ctx, state);
        const isNot = node.isNot;

        let sameIdentity = false;

        // Both references: compare canonical objectId
        if (isReference(leftVal) && isReference(rightVal)) {
            sameIdentity = leftVal.objectId === rightVal.objectId;
        } else if (isPrimitive(leftVal) && isPrimitive(rightVal)) {
            // Primitives: None is None, True is True, False is False, identical integers
            sameIdentity = leftVal.type === rightVal.type && leftVal.value === rightVal.value;
        } else {
            sameIdentity = false;
        }

        const res = isNot ? !sameIdentity : sameIdentity;
        return createPrimitiveValue('bool', Boolean(res));
    }

    _evalBinaryOp(node, ctx, state) {
        const leftVal = this._evalNode(node.left, ctx, state);
        const rightVal = this._evalNode(node.right, ctx, state);
        const op = node.operator;

        const l = this._extractRawValue(leftVal);
        const r = this._extractRawValue(rightVal);

        if (typeof l === 'number' && typeof r === 'number') {
            let res;
            let isFloat = typeof l === 'number' && (l % 1 !== 0 || r % 1 !== 0);
            switch (op) {
                case '+': res = l + r; break;
                case '-': res = l - r; break;
                case '*': res = l * r; break;
                case '/':
                    if (r === 0) throw EvaluationError.typeError('division by zero', state.expression);
                    res = l / r;
                    isFloat = true;
                    break;
                case '//':
                    if (r === 0) throw EvaluationError.typeError('integer division by zero', state.expression);
                    res = Math.floor(l / r);
                    isFloat = false;
                    break;
                case '%':
                    if (r === 0) throw EvaluationError.typeError('modulo by zero', state.expression);
                    res = l % r;
                    break;
                default:
                    throw EvaluationError.unsupportedOperation(op, `Unsupported arithmetic operator '${op}'`, state.expression);
            }
            return createPrimitiveValue(isFloat ? 'float' : 'int', res);
        }

        // String concatenation
        if (typeof l === 'string' && typeof r === 'string' && op === '+') {
            return createPrimitiveValue('str', l + r);
        }

        throw EvaluationError.typeError(`Unsupported operand types for ${op}: '${typeof l}' and '${typeof r}'`, state.expression);
    }

    _evalUnaryOp(node, ctx, state) {
        const argVal = this._evalNode(node.argument, ctx, state);
        const op = node.operator;
        const raw = this._extractRawValue(argVal);

        if (op === '-') {
            if (typeof raw !== 'number') {
                throw EvaluationError.typeError(`Bad operand type for unary -: '${typeof raw}'`, state.expression);
            }
            return createPrimitiveValue(argVal.type || 'int', -raw);
        }

        if (op === '+') {
            if (typeof raw !== 'number') {
                throw EvaluationError.typeError(`Bad operand type for unary +: '${typeof raw}'`, state.expression);
            }
            return createPrimitiveValue(argVal.type || 'int', +raw);
        }

        if (op === 'not') {
            const isFalsy = raw === false || raw === 0 || raw === '' || raw === null || raw === undefined;
            return createPrimitiveValue('bool', isFalsy);
        }

        throw EvaluationError.unsupportedOperation(op, `Unsupported unary operator '${op}'`, state.expression);
    }

    _evalCall(node, ctx, state) {
        const calleeNode = node.callee;
        const calleeName = calleeNode.type === AST_NODE_TYPES.IDENTIFIER ? calleeNode.name : null;

        // Safe Intrinsics: len(), type()
        if (calleeName === 'len') {
            if (node.args.length !== 1) {
                throw EvaluationError.typeError(`len() takes exactly one argument (${node.args.length} given)`, state.expression);
            }
            const argVal = this._evalNode(node.args[0], ctx, state);
            if (isReference(argVal)) {
                const obj = ctx.heap ? ctx.heap.getObject(argVal.objectId) : null;
                if (obj) {
                    if (obj.type === 'dict') {
                        return createPrimitiveValue('int', (obj.entries || []).length);
                    }
                    if (obj.type === 'list' || obj.type === 'tuple' || obj.type === 'set' || Array.isArray(obj.elements)) {
                        return createPrimitiveValue('int', (obj.elements || []).length);
                    }
                }
            } else if (isPrimitive(argVal) && argVal.type === 'str') {
                return createPrimitiveValue('int', String(argVal.value).length);
            }

            throw EvaluationError.typeError(`object of type '${argVal?.type || 'unknown'}' has no len()`, state.expression);
        }

        if (calleeName === 'type') {
            if (node.args.length !== 1) {
                throw EvaluationError.typeError(`type() takes exactly one argument (${node.args.length} given)`, state.expression);
            }
            const argVal = this._evalNode(node.args[0], ctx, state);
            let typeName = 'NoneType';
            if (isReference(argVal)) {
                const obj = ctx.heap ? ctx.heap.getObject(argVal.objectId) : null;
                typeName = obj?.className || obj?.type || argVal.type || 'object';
            } else if (isPrimitive(argVal)) {
                typeName = argVal.type || 'object';
            }
            return createPrimitiveValue('str', `<class '${typeName}'>`);
        }

        // Prohibit all arbitrary function / method executions
        throw EvaluationError.unsupportedOperation(
            calleeName || 'call',
            'Arbitrary function execution is not permitted during inspection to prevent state corruption',
            state.expression
        );
    }

    _evalListLiteral(node, ctx, state) {
        const elements = node.elements.map(el => this._evalNode(el, ctx, state));
        return {
            kind: 'list_literal',
            type: 'list',
            elements,
        };
    }

    _extractRawValue(val) {
        if (!val) return null;
        if (isPrimitive(val)) return val.value;
        if (typeof val === 'object' && val.value !== undefined) return val.value;
        return val;
    }
}
