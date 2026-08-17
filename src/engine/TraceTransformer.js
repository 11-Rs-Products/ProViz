/**
 * TraceTransformer — Converts raw Python trace events into visualization frames.
 *
 * A "frame" is a higher-level, UI-ready unit. Multiple raw trace events may
 * collapse into a single frame (e.g., multiple line events in a tight loop
 * may not all need their own animation frame).
 *
 * VisualizationFrame shape:
 * {
 *   frame_id: number,
 *   source_event_ids: number[],
 *   current_line: number,
 *   current_function: string,
 *   event_type: 'line' | 'call' | 'return' | 'exception',
 *   description: string,
 *   variables: { [name]: { value, changed, is_new } },
 *   call_stack: [{ function, line }],
 *   stack_depth: number,
 *   changed_variables: [{ name, old_value, new_value, is_new }],
 *   return_value: string | null,
 *   exception: { type, message } | null,
 *   operation: { type, ...data } | null,
 *   output_so_far: string,
 * }
 */

export class TraceTransformer {
    /**
     * @param {object} executionTrace - from PythonExecutor.execute()
     * @param {object} questionConfig - question's visualization config
     * @returns {VisualizationFrame[]}
     */
    transform(executionTrace, questionConfig = {}) {
        const events = executionTrace.events || [];
        const trackedVars = new Set(questionConfig.tracked_variables || []);
        const frames = [];
        let outputAccum = '';
        let frameId = 0;

        for (let i = 0; i < events.length; i++) {
            const ev = events[i];

            // Only emit frames for line, call, return, and exception events
            if (!['line', 'call', 'return', 'exception'].includes(ev.type)) continue;

            // Build variable snapshot (all locals, with change markers)
            const variables = {};
            for (const [name, value] of Object.entries(ev.locals || {})) {
                const changeInfo = (ev.changed_variables || []).find(c => c.name === name);
                variables[name] = {
                    value,
                    changed: !!changeInfo,
                    is_new: changeInfo ? changeInfo.is_new : false,
                    old_value: changeInfo ? changeInfo.old_value : undefined,
                };
            }

            // Detect semantic operation from the event
            const operation = this._detectOperation(ev, events, i);

            // Generate human-readable description
            const description = this._generateDescription(ev, operation);

            const frame = {
                frame_id: frameId++,
                source_event_ids: [ev.event_id],
                current_line: ev.line,
                current_function: ev.function,
                event_type: ev.type,
                description,
                variables,
                call_stack: ev.stack || [],
                stack_depth: ev.stack_depth || 0,
                changed_variables: ev.changed_variables || [],
                return_value: ev.return_value || null,
                exception: ev.exception_type
                    ? { type: ev.exception_type, message: ev.exception_message }
                    : null,
                operation,
                output_so_far: outputAccum,
            };

            frames.push(frame);
        }

        // Append final output frame if there's output
        const finalOutput = executionTrace.result?.output || '';
        if (finalOutput && finalOutput.trim()) {
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

    /**
     * Detect semantic operations from trace events.
     * These are inferred automatically from the trace.
     */
    _detectOperation(ev, allEvents, idx) {
        // Function call
        if (ev.type === 'call') {
            const args = Object.entries(ev.locals || {})
                .map(([k, v]) => `${k}=${v}`)
                .join(', ');
            return {
                type: 'function_call',
                function: ev.function,
                args_str: args,
            };
        }

        // Function return
        if (ev.type === 'return') {
            return {
                type: 'function_return',
                function: ev.function,
                return_value: ev.return_value,
            };
        }

        // Exception
        if (ev.type === 'exception') {
            return {
                type: 'exception',
                exception_type: ev.exception_type,
                exception_message: ev.exception_message,
            };
        }

        // Variable assignment (changed variable on a line event)
        const changed = ev.changed_variables || [];
        if (changed.length === 1 && ev.type === 'line') {
            const c = changed[0];
            if (c.is_new) {
                return { type: 'variable_create', name: c.name, value: c.new_value };
            }
            return { type: 'variable_update', name: c.name, old_value: c.old_value, new_value: c.new_value };
        }

        if (changed.length > 1 && ev.type === 'line') {
            return {
                type: 'multi_variable_update',
                changes: changed,
            };
        }

        return null;
    }

    /**
     * Generate a human-readable description for a frame.
     */
    _generateDescription(ev, operation) {
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
                    return `⚠️ ${operation.exception_type}: ${operation.exception_message}`;
                case 'variable_create':
                    return `New variable \`${operation.name}\` = ${operation.value}`;
                case 'variable_update':
                    return `\`${operation.name}\` changed: ${operation.old_value} → ${operation.new_value}`;
                case 'multi_variable_update':
                    const names = operation.changes.map(c => `\`${c.name}\``).join(', ');
                    return `Updated ${names}`;
                default:
                    break;
            }
        }

        if (ev.type === 'line') {
            return `Executing line ${ev.line} in \`${ev.function}\``;
        }

        return `Line ${ev.line}`;
    }
}
