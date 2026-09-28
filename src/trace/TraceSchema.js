/**
 * Universal Execution Trace (UET) — Schema & Event Definitions
 * Schema Version: 1
 *
 * Core Principles:
 *  1. Language-neutral: Describes what happened during execution, not how to render it.
 *  2. Visualization-independent: No 3D meshes, positions, colors, or animations.
 *  3. Problem-independent: No mandatory question IDs, expected outputs, or visualizer hooks.
 */

export const TRACE_SCHEMA_VERSION = 1;

/**
 * Supported UET Event Types in Version 1:
 *  - 'program_start': Program execution begins
 *  - 'line': Execution advanced to a specific source line
 *  - 'call': Function/scope entry
 *  - 'return': Function/scope exit with optional return value
 *  - 'exception': Runtime error or exception raised
 *  - 'program_end': Normal program completion with final output
 */
export const EVENT_TYPES = Object.freeze({
    PROGRAM_START: 'program_start',
    LINE: 'line',
    CALL: 'call',
    RETURN: 'return',
    EXCEPTION: 'exception',
    PROGRAM_END: 'program_end',
});

/**
 * Creates a normalized UET Event object.
 *
 * @param {object} params
 * @param {number} params.id - Unique sequential event ID (0-indexed)
 * @param {string} params.type - One of EVENT_TYPES
 * @param {object} params.source - { file: string, line: number|null, column: number|null }
 * @param {object} params.scope - { function: string, depth: number }
 * @param {object} params.data - Event-specific payload (locals, changed_variables, stack, return_value, etc.)
 * @param {number|null} [params.timestamp] - Execution epoch timestamp in ms
 * @returns {object} Normalized UET Event envelope
 */
export function createTraceEvent({
    id,
    type,
    source = { file: 'main.py', line: null, column: null },
    scope = { function: '<module>', depth: 1 },
    data = {},
    timestamp = null,
}) {
    const rawPath = source.path || source.file || 'main.py';
    return {
        id,
        type,
        source: {
            file: source.file || rawPath,
            path: rawPath,
            fileId: source.fileId || null,
            moduleId: source.moduleId || null,
            line: typeof source.line === 'number' ? source.line : null,
            column: typeof source.column === 'number' ? source.column : null,
            endLine: typeof source.endLine === 'number' ? source.endLine : null,
            endColumn: typeof source.endColumn === 'number' ? source.endColumn : null,
        },
        scope: {
            function: scope.function || '<module>',
            depth: typeof scope.depth === 'number' ? scope.depth : 1,
        },
        timestamp: typeof timestamp === 'number' ? timestamp : Date.now(),
        data: data || {},
    };
}

/**
 * Creates a canonical Universal Execution Trace (UET) container.
 *
 * @param {object} params
 * @param {number} [params.version] - Schema version (defaults to TRACE_SCHEMA_VERSION)
 * @param {object} [params.metadata] - Language, runtime, duration, timestamp metadata
 * @param {object} [params.source] - Entrypoint file and source files map
 * @param {Array} [params.events] - Array of UET events
 * @param {object} [params.result] - { success: boolean, output: string, error: object|null }
 * @param {object} [params.final_state] - { output: string }
 * @returns {object} Canonical UET container
 */
export function createExecutionTrace({
    version = TRACE_SCHEMA_VERSION,
    metadata = {},
    source = { entrypoint: 'main.py', files: {} },
    events = [],
    result = { success: true, output: '', error: null },
    final_state = { output: '' },
}) {
    return {
        version,
        metadata: {
            language: metadata.language || 'python',
            runtime: metadata.runtime || 'pyodide',
            version: metadata.version || '3.x',
            timestamp: metadata.timestamp || Date.now(),
            duration_ms: metadata.duration_ms || 0,
            event_count: events.length,
            ...metadata,
        },
        source: {
            entrypoint: source.entrypoint || 'main.py',
            files: source.files || {},
        },
        events,
        result: {
            success: Boolean(result.success),
            output: result.output || '',
            error: result.error || null,
        },
        final_state: {
            output: final_state.output || result.output || '',
        },
    };
}

/**
 * Validates whether an object conforms to the UET specification.
 *
 * @param {object} trace - Object to validate
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateTrace(trace) {
    const errors = [];
    if (!trace || typeof trace !== 'object') {
        return { valid: false, errors: ['Trace must be a non-null object'] };
    }

    if (typeof trace.version !== 'number') {
        errors.push('Trace must have a numeric "version" field');
    }

    if (!Array.isArray(trace.events)) {
        errors.push('Trace must contain an "events" array');
    } else {
        trace.events.forEach((ev, idx) => {
            if (typeof ev.id !== 'number') errors.push(`Event at index ${idx} missing numeric "id"`);
            if (!ev.type) errors.push(`Event at index ${idx} missing "type"`);
            if (!ev.source) errors.push(`Event at index ${idx} missing "source" object`);
            if (!ev.scope) errors.push(`Event at index ${idx} missing "scope" object`);
        });
    }

    if (!trace.result || typeof trace.result !== 'object') {
        errors.push('Trace must contain a "result" object');
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}
