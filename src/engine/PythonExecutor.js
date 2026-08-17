/**
 * PythonExecutor — Language adapter for Python execution via Pyodide.
 *
 * Responsibilities:
 *  - Initialize Pyodide WASM runtime
 *  - Execute Python code through a full sys.settrace tracer
 *  - Capture: line, call, return, exception events
 *  - Capture: local variables, global variables, call stack, changed variables
 *  - Return a structured ExecutionTrace object
 *
 * ExecutionTrace shape:
 * {
 *   metadata: { language, version, timestamp, duration_ms },
 *   initial_state: {},
 *   events: TraceEvent[],
 *   final_state: { output, variables },
 *   result: { success, return_value, output },
 *   error: null | { type, message, line, traceback }
 * }
 *
 * TraceEvent shape:
 * {
 *   event_id: number,
 *   type: 'line' | 'call' | 'return' | 'exception',
 *   line: number,
 *   function: string,
 *   locals: {},
 *   changed_variables: [{ name, old_value, new_value }],
 *   stack: [{ function, line }],
 *   stack_depth: number,
 *   return_value: any,          // only on 'return' events
 *   exception_type: string,     // only on 'exception' events
 *   exception_message: string,  // only on 'exception' events
 * }
 */

const MAX_EVENTS = 50000;
const MAX_RUNTIME_MS = 5000;
const MAX_VAL_STR = 80;

export class PythonExecutor {
    constructor() {
        this.pyodide = null;
        this.isReady = false;
        this._initPromise = null;
    }

    /**
     * Initialize Pyodide runtime and install the Python tracer.
     * Idempotent — safe to call multiple times.
     */
    async init() {
        if (this.isReady) return;
        if (this._initPromise) return this._initPromise;

        this._initPromise = this._doInit();
        return this._initPromise;
    }

    async _doInit() {
        console.log('[PythonExecutor] Loading Pyodide...');
        this.pyodide = await window.loadPyodide({
            indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/',
        });

        // Install the tracer Python module
        await this.pyodide.runPythonAsync(this._tracerPythonSource());

        this.isReady = true;
        console.log('[PythonExecutor] Ready.');
    }

    _tracerPythonSource() {
        return `
import sys
import json
import traceback as _traceback_mod

# ---- Serializer ----
def _safe_str(v, max_len=${MAX_VAL_STR}):
    try:
        s = repr(v)
        if len(s) > max_len:
            s = s[:max_len - 3] + '...'
        return s
    except Exception:
        return '<unserializable>'

# Sentinel for "no previous value"
_MISSING = object()

# ---- Tracer class ----
class _ProVizTracer:
    EXCLUDED_NAMES = frozenset([
        'js', 'sys', '__builtins__', '__name__', '__doc__',
        '_ProVizTracer', '_tracer_instance', '_user_code',
        '_safe_str', '_MISSING', 'json', '_traceback_mod',
    ])

    def __init__(self):
        self.events = []
        self._event_id = 0
        self._prev_locals = {}   # function name -> dict of last-seen locals
        self._output_lines = []

    def trace(self, frame, event, arg):
        fn_name = frame.f_code.co_name

        # Skip internal frames
        if fn_name in ('_run_user_code', '_ProVizTracer', 'trace'):
            return self.trace
        if frame.f_code.co_filename.startswith('<frozen'):
            return self.trace
        if len(self.events) >= ${MAX_EVENTS}:
            return None   # Stop tracing

        # Build stack snapshot
        stack = []
        f = frame
        while f is not None:
            if f.f_code.co_name not in ('_run_user_code', '<module>_outer'):
                stack.append({'function': f.f_code.co_name, 'line': f.f_lineno})
            f = f.f_back
        stack = list(reversed(stack))
        stack_depth = len(stack)

        # Capture locals (filter noise)
        raw_locals = {}
        for k, v in frame.f_locals.items():
            if k.startswith('_') or k in self.EXCLUDED_NAMES:
                continue
            if callable(v) and not isinstance(v, (list, dict, tuple, set)):
                continue
            if 'module' in str(type(v)):
                continue
            raw_locals[k] = _safe_str(v)

        # Detect changed variables
        prev = self._prev_locals.get(fn_name, {})
        changed = []
        for k, new_v in raw_locals.items():
            old_v = prev.get(k, _MISSING)
            if old_v is _MISSING:
                changed.append({'name': k, 'old_value': None, 'new_value': new_v, 'is_new': True})
            elif old_v != new_v:
                changed.append({'name': k, 'old_value': old_v, 'new_value': new_v, 'is_new': False})
        self._prev_locals[fn_name] = dict(raw_locals)

        ev = {
            'event_id': self._event_id,
            'type': event,
            'line': frame.f_lineno,
            'function': fn_name,
            'locals': raw_locals,
            'changed_variables': changed,
            'stack': stack,
            'stack_depth': stack_depth,
        }

        if event == 'return':
            ev['return_value'] = _safe_str(arg)
        elif event == 'exception':
            exc_type, exc_val, _ = arg
            ev['exception_type'] = exc_type.__name__ if exc_type else 'Exception'
            ev['exception_message'] = str(exc_val)

        self.events.append(ev)
        self._event_id += 1
        return self.trace

_tracer_instance = _ProVizTracer()

# ---- Entry point called from JS ----
def _run_user_code(code_str):
    global _tracer_instance
    _tracer_instance = _ProVizTracer()
    
    import io
    output_buf = io.StringIO()
    
    user_globals = {
        '__builtins__': __builtins__,
        '__name__': '__main__',
    }
    
    try:
        sys.stdout = output_buf
        sys.settrace(_tracer_instance.trace)
        exec(compile(code_str, '<user_code>', 'exec'), user_globals)
        sys.settrace(None)
    except SyntaxError as e:
        sys.settrace(None)
        return json.dumps({
            'success': False,
            'error': {
                'type': 'SyntaxError',
                'message': str(e.msg),
                'line': e.lineno,
                'traceback': str(e),
            },
            'events': [],
            'output': '',
        })
    except Exception as e:
        sys.settrace(None)
        tb_str = _traceback_mod.format_exc()
        return json.dumps({
            'success': False,
            'error': {
                'type': type(e).__name__,
                'message': str(e),
                'line': None,
                'traceback': tb_str,
            },
            'events': _tracer_instance.events,
            'output': output_buf.getvalue(),
        })
    finally:
        sys.stdout = sys.__stdout__
        sys.settrace(None)

    return json.dumps({
        'success': True,
        'events': _tracer_instance.events,
        'output': output_buf.getvalue(),
        'error': None,
    })
`;
    }

    /**
     * Execute Python code and return a structured ExecutionTrace.
     * @param {string} pythonCode
     * @returns {Promise<ExecutionTrace>}
     */
    async execute(pythonCode) {
        if (!this.isReady) {
            throw new Error('[PythonExecutor] Not initialized. Call init() first.');
        }

        const startMs = performance.now();

        try {
            this.pyodide.globals.set('_user_code_to_run', pythonCode);
            const rawJson = await this.pyodide.runPythonAsync('_run_user_code(_user_code_to_run)');
            const raw = JSON.parse(rawJson);
            const durationMs = performance.now() - startMs;

            const trace = {
                metadata: {
                    language: 'python',
                    version: '3.x (Pyodide)',
                    timestamp: Date.now(),
                    duration_ms: durationMs,
                    event_count: raw.events.length,
                },
                initial_state: {},
                events: raw.events || [],
                final_state: {
                    output: raw.output || '',
                },
                result: {
                    success: raw.success,
                    output: raw.output || '',
                },
                error: raw.error || null,
            };

            return trace;
        } catch (err) {
            return {
                metadata: { language: 'python', duration_ms: performance.now() - startMs },
                initial_state: {},
                events: [],
                final_state: { output: '' },
                result: { success: false, output: '' },
                error: { type: 'InternalError', message: err.message, line: null },
            };
        }
    }
}
