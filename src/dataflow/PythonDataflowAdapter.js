/**
 * PythonDataflowAdapter — Extracts Python dataflow events, definitions, uses, dependencies, aliases, and mutations.
 */

import { LanguageDataflowAdapter } from './LanguageDataflowAdapter.js';
import { DataflowEvent, DATAFLOW_EVENT_TYPES } from './DataflowEvent.js';
import { isReference, isPrimitive } from '../runtime/Value.js';

export class PythonDataflowAdapter extends LanguageDataflowAdapter {
    constructor() {
        super('python');
    }

    /**
     * Analyzes a single frame/event and generates normalized DataflowEvents.
     */
    analyzeFrame({ traceEvent, frameIndex = 0, currentRuntimeState = null, previousRuntimeState = null, sourceCode = '' }) {
        const events = [];
        const sourceLoc = traceEvent?.source || currentRuntimeState?.currentSource || null;
        const lineNum = sourceLoc?.line ?? null;
        const fileId = sourceLoc?.fileId || sourceLoc?.file || 'main.py';
        const moduleId = sourceLoc?.moduleId || 'main';

        // Extract line text if sourceCode available
        let lineText = '';
        if (sourceCode && typeof lineNum === 'number' && lineNum > 0) {
            const lines = sourceCode.split(/\r?\n/);
            lineText = (lines[lineNum - 1] || '').trim();
        } else if (traceEvent?.data?.code_line) {
            lineText = String(traceEvent.data.code_line).trim();
        }

        const callStack = currentRuntimeState?.callStack || [];
        const activeFrame = callStack.length > 0 ? callStack[callStack.length - 1] : null;
        const callFrameId = activeFrame?.frameId || 'frame_0';
        const functionName = activeFrame?.functionName || '<module>';
        const currentLocals = activeFrame?.scope?.bindings || {};
        const prevLocals = previousRuntimeState?.callStack?.length > 0
            ? previousRuntimeState.callStack[previousRuntimeState.callStack.length - 1]?.scope?.bindings || {}
            : {};

        const currentGlobals = currentRuntimeState?.globals?.bindings || {};
        const prevGlobals = previousRuntimeState?.globals?.bindings || {};

        // ─────────────────────────────────────────────────────────────────────────
        // 1. Identify Variable Bindings & Changes (LHS Definitions & RHS Uses)
        // ─────────────────────────────────────────────────────────────────────────

        // Check for assignments in lineText
        const parsedStmt = this._parseStatement(lineText);

        if (parsedStmt) {
            if (parsedStmt.type === 'assignment') {
                const target = parsedStmt.target;
                const rhsVars = parsedStmt.dependencies;
                const val = currentLocals[target] || currentGlobals[target] || null;

                // RHS Uses
                for (const rhsVar of rhsVars) {
                    const rhsVal = currentLocals[rhsVar] || currentGlobals[rhsVar] || prevLocals[rhsVar] || prevGlobals[rhsVar] || null;
                    events.push(new DataflowEvent({
                        type: DATAFLOW_EVENT_TYPES.USE,
                        frameIndex,
                        sourceLocation: sourceLoc,
                        subject: { variable: rhsVar, fileId, callFrameId },
                        value: rhsVal,
                    }));
                }

                // LHS Definition
                events.push(new DataflowEvent({
                    type: DATAFLOW_EVENT_TYPES.DEFINITION,
                    frameIndex,
                    sourceLocation: sourceLoc,
                    subject: { variable: target, fileId, callFrameId },
                    dependencies: rhsVars,
                    value: val,
                    metadata: { statement: lineText },
                }));
            } else if (parsedStmt.type === 'member_write') {
                const { objectVar, fieldName, dependencies } = parsedStmt;
                const objVal = currentLocals[objectVar] || currentGlobals[objectVar] || null;
                const objectId = objVal && isReference(objVal) ? objVal.objectId : null;

                for (const dep of dependencies) {
                    const depVal = currentLocals[dep] || currentGlobals[dep] || null;
                    events.push(new DataflowEvent({
                        type: DATAFLOW_EVENT_TYPES.USE,
                        frameIndex,
                        sourceLocation: sourceLoc,
                        subject: { variable: dep, fileId, callFrameId },
                        value: depVal,
                    }));
                }

                events.push(new DataflowEvent({
                    type: DATAFLOW_EVENT_TYPES.FIELD_WRITE,
                    frameIndex,
                    sourceLocation: sourceLoc,
                    subject: { objectVar, objectId, fieldName, fileId },
                    dependencies,
                    metadata: { statement: lineText },
                }));
            } else if (parsedStmt.type === 'subscript_write') {
                const { targetVar, indexExpr, dependencies } = parsedStmt;
                const objVal = currentLocals[targetVar] || currentGlobals[targetVar] || null;
                const objectId = objVal && isReference(objVal) ? objVal.objectId : null;

                events.push(new DataflowEvent({
                    type: DATAFLOW_EVENT_TYPES.ELEMENT_WRITE,
                    frameIndex,
                    sourceLocation: sourceLoc,
                    subject: { targetVar, objectId, index: indexExpr, fileId },
                    dependencies,
                    metadata: { statement: lineText },
                }));
            } else if (parsedStmt.type === 'method_call_mutation') {
                const { objectVar, method, args } = parsedStmt;
                const objVal = currentLocals[objectVar] || currentGlobals[objectVar] || null;
                const objectId = objVal && isReference(objVal) ? objVal.objectId : null;

                events.push(new DataflowEvent({
                    type: DATAFLOW_EVENT_TYPES.OBJECT_MUTATION,
                    frameIndex,
                    sourceLocation: sourceLoc,
                    subject: { objectVar, objectId, method, fileId },
                    dependencies: args,
                    metadata: { operation: method, statement: lineText },
                }));
            } else if (parsedStmt.type === 'return') {
                events.push(new DataflowEvent({
                    type: DATAFLOW_EVENT_TYPES.RETURN,
                    frameIndex,
                    sourceLocation: sourceLoc,
                    subject: { functionName, fileId, callFrameId },
                    dependencies: parsedStmt.dependencies,
                    metadata: { statement: lineText },
                }));
            }
        } else {
            // Fallback: Detect binding changes from RuntimeState diff
            for (const [varName, curVal] of Object.entries(currentLocals)) {
                const prevVal = prevLocals[varName];
                if (!prevVal || JSON.stringify(prevVal) !== JSON.stringify(curVal)) {
                    events.push(new DataflowEvent({
                        type: DATAFLOW_EVENT_TYPES.DEFINITION,
                        frameIndex,
                        sourceLocation: sourceLoc,
                        subject: { variable: varName, fileId, callFrameId },
                        value: curVal,
                    }));
                }
            }
        }

        // ─────────────────────────────────────────────────────────────────────────
        // 2. Discover Aliases from Runtime State
        // ─────────────────────────────────────────────────────────────────────────
        if (currentRuntimeState?.heap) {
            const allBindings = { ...currentGlobals, ...currentLocals };
            for (const [name, val] of Object.entries(allBindings)) {
                if (val && isReference(val) && val.objectId) {
                    events.push(new DataflowEvent({
                        type: DATAFLOW_EVENT_TYPES.ALIAS_CREATE,
                        frameIndex,
                        sourceLocation: sourceLoc,
                        subject: {
                            objectId: val.objectId,
                            variable: name,
                            scopeId: currentLocals[name] ? 'local' : 'global',
                            fileId,
                        },
                    }));
                }
            }
        }

        // ─────────────────────────────────────────────────────────────────────────
        // 3. Discover Heap Object Mutations
        // ─────────────────────────────────────────────────────────────────────────
        if (currentRuntimeState?.heap && previousRuntimeState?.heap) {
            const curObjects = currentRuntimeState.heap.objects || {};
            const prevObjects = previousRuntimeState.heap.objects || {};

            for (const [objId, curObj] of Object.entries(curObjects)) {
                const prevObj = prevObjects[objId];
                if (prevObj) {
                    // Check element changes in list/tuple
                    if (Array.isArray(curObj.elements) && Array.isArray(prevObj.elements)) {
                        if (curObj.elements.length > prevObj.elements.length) {
                            events.push(new DataflowEvent({
                                type: DATAFLOW_EVENT_TYPES.OBJECT_MUTATION,
                                frameIndex,
                                sourceLocation: sourceLoc,
                                subject: { objectId: objId },
                                metadata: {
                                    operation: 'append',
                                    previousValue: prevObj.elements,
                                    nextValue: curObj.elements,
                                    target: curObj.elements.length - 1,
                                },
                            }));
                        } else if (JSON.stringify(curObj.elements) !== JSON.stringify(prevObj.elements)) {
                            events.push(new DataflowEvent({
                                type: DATAFLOW_EVENT_TYPES.OBJECT_MUTATION,
                                frameIndex,
                                sourceLocation: sourceLoc,
                                subject: { objectId: objId },
                                metadata: {
                                    operation: 'replace',
                                    previousValue: prevObj.elements,
                                    nextValue: curObj.elements,
                                },
                            }));
                        }
                    }

                    // Check field changes in custom instances
                    if (curObj.fields && prevObj.fields) {
                        for (const [fName, fVal] of Object.entries(curObj.fields)) {
                            if (JSON.stringify(fVal) !== JSON.stringify(prevObj.fields[fName])) {
                                events.push(new DataflowEvent({
                                    type: DATAFLOW_EVENT_TYPES.FIELD_WRITE,
                                    frameIndex,
                                    sourceLocation: sourceLoc,
                                    subject: { objectId: objId, fieldName: fName },
                                    metadata: {
                                        operation: 'field_write',
                                        fieldName: fName,
                                        previousValue: prevObj.fields[fName],
                                        nextValue: fVal,
                                    },
                                }));
                            }
                        }
                    }
                }
            }
        }

        return events;
    }

    /**
     * Lightweight Python statement pattern matcher for dataflow extraction.
     */
    _parseStatement(stmt) {
        if (!stmt) return null;
        const line = stmt.replace(/#.*$/, '').trim(); // Strip comments
        if (!line) return null;

        // 1. Return statement
        const retMatch = line.match(/^return\s+(.+)$/);
        if (retMatch) {
            return {
                type: 'return',
                dependencies: this.extractExpressionVariables(retMatch[1]),
            };
        }

        // 2. Member write: obj.field = expr
        const memberWriteMatch = line.match(/^([a-zA-Z_]\w*)\.([a-zA-Z_]\w*)\s*=\s*(.+)$/);
        if (memberWriteMatch) {
            return {
                type: 'member_write',
                objectVar: memberWriteMatch[1],
                fieldName: memberWriteMatch[2],
                dependencies: this.extractExpressionVariables(memberWriteMatch[3]),
            };
        }

        // 3. Subscript write: items[0] = expr or d["key"] = expr
        const subWriteMatch = line.match(/^([a-zA-Z_]\w*)\[([^\]]+)\]\s*=\s*(.+)$/);
        if (subWriteMatch) {
            return {
                type: 'subscript_write',
                targetVar: subWriteMatch[1],
                indexExpr: subWriteMatch[2].trim(),
                dependencies: [
                    ...this.extractExpressionVariables(subWriteMatch[2]),
                    ...this.extractExpressionVariables(subWriteMatch[3]),
                ],
            };
        }

        // 4. Method mutation call: items.append(val), d.update(...)
        const mutCallMatch = line.match(/^([a-zA-Z_]\w*)\.(append|extend|insert|remove|pop|clear|add|update)\((.*)\)$/);
        if (mutCallMatch) {
            return {
                type: 'method_call_mutation',
                objectVar: mutCallMatch[1],
                method: mutCallMatch[2],
                args: this.extractExpressionVariables(mutCallMatch[3]),
            };
        }

        // 5. Augmented assignment: x += 1
        const augMatch = line.match(/^([a-zA-Z_]\w*)\s*(\+=|-=|\*=|(?:\/)=|%=)\s*(.+)$/);
        if (augMatch) {
            const target = augMatch[1];
            const rhsVars = this.extractExpressionVariables(augMatch[3]);
            return {
                type: 'assignment',
                target,
                dependencies: Array.from(new Set([target, ...rhsVars])),
            };
        }

        // 6. Simple Assignment: target = rhs
        const assignMatch = line.match(/^([a-zA-Z_]\w*)\s*=\s*(.+)$/);
        if (assignMatch) {
            const target = assignMatch[1];
            const rhs = assignMatch[2];
            return {
                type: 'assignment',
                target,
                dependencies: this.extractExpressionVariables(rhs),
            };
        }

        return null;
    }

    /**
     * Extracts variable identifiers from an expression string using regex tokenization.
     */
    extractExpressionVariables(exprStr) {
        if (!exprStr) return [];
        const str = String(exprStr).trim();

        const pythonKeywords = new Set([
            'True', 'False', 'None', 'and', 'or', 'not', 'is', 'in', 'lambda',
            'if', 'else', 'elif', 'for', 'while', 'def', 'class', 'return',
            'int', 'float', 'str', 'bool', 'list', 'dict', 'set', 'tuple', 'len', 'type', 'range'
        ]);

        // Remove string literals
        const noStrings = str.replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g, '');

        // Extract identifier tokens
        const tokens = noStrings.match(/[a-zA-Z_]\w*/g) || [];
        const vars = new Set();

        for (const token of tokens) {
            if (!pythonKeywords.has(token) && isNaN(Number(token))) {
                vars.add(token);
            }
        }

        return Array.from(vars);
    }
}
