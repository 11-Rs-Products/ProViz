/**
 * ExplanationEngine — Generates human-readable explanations from visualization frames.
 *
 * Given the current frame (and optionally the previous frame), produces:
 *  - A primary explanation string (what's happening right now)
 *  - A secondary "why" string (reasoning, when detectable)
 *  - Highlights (which variables / lines matter)
 */

export class ExplanationEngine {
    /**
     * @param {object} frame - current VisualizationFrame
     * @param {object|null} prevFrame - previous VisualizationFrame
     * @returns {{ primary: string, secondary: string, badges: string[] }}
     */
    explain(frame, prevFrame = null) {
        if (!frame) {
            return { primary: 'Ready to run.', secondary: '', badges: [] };
        }

        const badges = [];
        let primary = frame.description || '';
        let secondary = '';

        const op = frame.operation;

        if (frame.event_type === 'call') {
            badges.push('Call');
            const args = Object.entries(frame.variables || {})
                .slice(0, 4)
                .map(([k, v]) => `${k} = ${v.value}`)
                .join(', ');
            primary = `Entering function \`${frame.current_function}(${args})\``;
            secondary = `Stack depth: ${frame.stack_depth}`;
        } else if (frame.event_type === 'return') {
            badges.push('Return');
            primary = frame.return_value && frame.return_value !== 'None'
                ? `\`${frame.current_function}\` returns ${frame.return_value}`
                : `\`${frame.current_function}\` finished`;
        } else if (frame.event_type === 'exception') {
            badges.push('Error');
            primary = `${frame.exception?.type}: ${frame.exception?.message}`;
            secondary = 'An exception was raised. Check your code.';
        } else if (op) {
            switch (op.type) {
                case 'variable_create':
                    badges.push('New variable');
                    primary = `\`${op.name}\` created with value ${op.value}`;
                    break;
                case 'variable_update':
                    badges.push('Updated');
                    primary = `\`${op.name}\` updated: ${op.old_value} → ${op.new_value}`;
                    secondary = this._diffExplanation(op.name, op.old_value, op.new_value);
                    break;
                case 'multi_variable_update':
                    badges.push('Multiple updates');
                    primary = op.changes
                        .map(c => `\`${c.name}\`: ${c.old_value} → ${c.new_value}`)
                        .join(' | ');
                    break;
                case 'program_end':
                    badges.push('Done');
                    primary = 'Program completed.';
                    if (op.output) secondary = `Output: ${op.output}`;
                    break;
                default:
                    break;
            }
        }

        // Changed variables list
        const changed = frame.changed_variables || [];
        if (changed.length > 0 && !primary.includes('→')) {
            const changedStr = changed.map(c => `\`${c.name}\``).join(', ');
            secondary = secondary || `Changed: ${changedStr}`;
        }

        // Stack info
        if (frame.stack_depth > 1 && !secondary) {
            const stackStr = (frame.call_stack || [])
                .map(f => `${f.function}:${f.line}`)
                .join(' → ');
            secondary = `Stack: ${stackStr}`;
        }

        return { primary, secondary, badges };
    }

    _diffExplanation(name, oldVal, newVal) {
        // Try numeric diff
        const oldNum = parseFloat(oldVal);
        const newNum = parseFloat(newVal);
        if (!isNaN(oldNum) && !isNaN(newNum)) {
            const diff = newNum - oldNum;
            if (diff > 0) return `${name} increased by ${diff}`;
            if (diff < 0) return `${name} decreased by ${Math.abs(diff)}`;
        }
        return '';
    }
}
