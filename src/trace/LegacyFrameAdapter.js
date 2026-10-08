/**
 * LegacyFrameAdapter — Compatibility adapter between Universal Execution Trace (UET)
 * / Runtime State and legacy VisualizationFrame structures consumed by existing visualizers & PlaybackEngine.
 *
 * Resolves structured values, object references, and heap graphs into clean human-readable
 * strings for existing 3D visualizers, ensuring 100% backward compatibility.
 */

import { stringifyValue } from '../runtime/Value.js';

export class LegacyFrameAdapter {
    /**
     * Converts a canonical UET ExecutionTrace into an array of legacy VisualizationFrames.
     *
     * @param {object} uetTrace - Canonical Universal Execution Trace (version 1)
     * @param {object} [problemConfig={}] - Optional problem-specific visualization configuration
     * @returns {Array<object>} Array of VisualizationFrame objects
     */
    static toVisualizationFrames(uetTrace, problemConfig = {}) {
        if (!uetTrace || !Array.isArray(uetTrace.events)) {
            return [];
        }

        const events = uetTrace.events;
        const globalHeap = uetTrace.heap || uetTrace.final_state?.heap || {};
        const frames = [];
        let frameId = 0;
        let outputAccum = '';

        for (let i = 0; i < events.length; i++) {
            const ev = events[i];

            // Only generate frames for actionable events
            if (!['line', 'call', 'return', 'exception', 'program_end'].includes(ev.type)) {
                continue;
            }

            const data = ev.data || {};
            const heap = data.heap || globalHeap;
            const rawLocals = data.locals || {};
            const changedVars = data.changed_variables || [];

            // Build variables snapshot dictionary with resolved string values
            const variables = {};
            for (const [name, valInfo] of Object.entries(rawLocals)) {
                const changeInfo = changedVars.find(c => c.name === name);
                const strVal = stringifyValue(valInfo, heap);

                let oldStrVal = undefined;
                if (changeInfo && changeInfo.old_value !== undefined) {
                    oldStrVal = stringifyValue(changeInfo.old_value, heap);
                }

                variables[name] = {
                    value: strVal,
                    changed: Boolean(changeInfo),
                    is_new: changeInfo ? Boolean(changeInfo.is_new) : false,
                    old_value: oldStrVal,
                    rawValue: valInfo,
                };
            }

            // Map stack frames
            const callStack = data.stack || [];
            const stackDepth = ev.scope?.depth || callStack.length || 0;

            // Detect semantic operation
            const operation = this._detectOperation(ev, events, i, heap);

            // Generate description
            const description = this._generateDescription(ev, operation);

            // Handle return/exception
            const returnValue = data.return_value !== undefined ? stringifyValue(data.return_value, heap) : null;
            const exception = ev.type === 'exception' || data.exception
                ? {
                    type: data.exception_type || data.exception?.type || 'Exception',
                    message: data.exception_message || data.exception?.message || '',
                }
                : null;

            const frame = {
                frame_id: frameId++,
                source_event_ids: [ev.id],
                file: ev.source?.file || 'main.py',
                source: ev.source ? { ...ev.source } : { file: 'main.py', line: ev.source?.line ?? null, column: null },
                current_line: ev.source?.line ?? null,
                current_function: ev.scope?.function ?? '<module>',
                event_type: ev.type === 'program_end' ? 'output' : ev.type,
                description,
                variables,
                call_stack: callStack,
                stack_depth: stackDepth,
                changed_variables: changedVars.map(c => ({
                    name: c.name,
                    old_value: stringifyValue(c.old_value, heap),
                    new_value: stringifyValue(c.new_value, heap),
                    is_new: Boolean(c.is_new),
                })),
                return_value: returnValue,
                exception,
                operation,
                output_so_far: data.output || data.output_so_far || outputAccum,
            };

            frames.push(frame);
        }

        // If trace has final output and no program_end frame was emitted, append final output frame
        const finalOutput = uetTrace.result?.output || uetTrace.final_state?.output || '';
        const hasEndFrame = frames.some(f => f.event_type === 'output');
        if (finalOutput && finalOutput.trim() && !hasEndFrame) {
            frames.push({
                frame_id: frameId++,
                source_event_ids: [],
                current_line: null,
                current_function: null,
                event_type: 'output',
                description: `Program finished. Output: ${finalOutput.trim()}`,
                variables: frames.length > 0 ? frames[frames.length - 1].variables : {},
                call_stack: [],
                stack_depth: 0,
                changed_variables: [],
                return_value: null,
                exception: null,
                operation: { type: 'program_end', output: finalOutput },
                output_so_far: finalOutput,
            });
        }

        return frames;
    }

    static _detectOperation(ev, allEvents, idx, heap = {}) {
        const data = ev.data || {};
        const fnName = ev.scope?.function || '<module>';

        if (ev.type === 'call') {
            const args = Object.entries(data.locals || {})
                .map(([k, v]) => `${k}=${stringifyValue(v, heap)}`)
                .join(', ');
            return {
                type: 'function_call',
                function: fnName,
                args_str: args,
            };
        }

        if (ev.type === 'return') {
            return {
                type: 'function_return',
                function: fnName,
                return_value: data.return_value ? stringifyValue(data.return_value, heap) : null,
            };
        }

        if (ev.type === 'exception') {
            return {
                type: 'exception',
                exception_type: data.exception_type || data.exception?.type || 'Exception',
                exception_message: data.exception_message || data.exception?.message || '',
            };
        }

        const changed = data.changed_variables || [];
        if (changed.length === 1 && ev.type === 'line') {
            const c = changed[0];
            const oldStr = stringifyValue(c.old_value, heap);
            const newStr = stringifyValue(c.new_value, heap);
            if (c.is_new) {
                return { type: 'variable_create', name: c.name, value: newStr };
            }
            return { type: 'variable_update', name: c.name, old_value: oldStr, new_value: newStr };
        }

        if (changed.length > 1 && ev.type === 'line') {
            return {
                type: 'multi_variable_update',
                changes: changed.map(c => ({
                    name: c.name,
                    old_value: stringifyValue(c.old_value, heap),
                    new_value: stringifyValue(c.new_value, heap),
                    is_new: Boolean(c.is_new),
                })),
            };
        }

        if (ev.type === 'program_end') {
            return {
                type: 'program_end',
                output: data.output || '',
            };
        }

        return null;
    }

    static _generateDescription(ev, operation) {
        const fnName = ev.scope?.function || '<module>';
        const lineNo = ev.source?.line;

        if (operation) {
            switch (operation.type) {
                case 'function_call':
                    return `Calling function \`${operation.function}(${operation.args_str})\``;
                case 'function_return':
                    if (operation.return_value && operation.return_value !== 'None') {
                        return `\`${operation.function}\` returned ${operation.return_value}`;
                    }
                    return `\`${operation.function}\` finished`;
                case 'exception':
                    return `${operation.exception_type}: ${operation.exception_message}`;
                case 'variable_create':
                    return `New variable \`${operation.name}\` = ${operation.value}`;
                case 'variable_update':
                    return `\`${operation.name}\` changed: ${operation.old_value} → ${operation.value || operation.new_value}`;
                case 'multi_variable_update':
                    const names = operation.changes.map(c => `\`${c.name}\``).join(', ');
                    return `Updated ${names}`;
                case 'program_end':
                    return `Program finished. Output: ${operation.output.trim()}`;
                default:
                    break;
            }
        }

        if (ev.type === 'line' && lineNo) {
            return `Executing line ${lineNo} in \`${fnName}\``;
        }

        return lineNo ? `Line ${lineNo}` : 'Executing';
    }
}
