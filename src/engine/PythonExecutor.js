/**
 * PythonExecutor — Language runtime adapter for Python execution via Pyodide.
 *
 * Responsibilities:
 *  - Initialize Pyodide WASM runtime
 *  - Execute Python code through sys.settrace tracer
 *  - Preserve Python object identity (id(v) -> stable ProViz objectId)
 *  - Support structured primitives, lists, dicts, sets, tuples, and class instances
 *  - Detect and safely handle cyclic references without infinite recursion
 *  - Normalize raw events into canonical Universal Execution Trace (UET) with Heap Graph
 *  - Remain completely independent of visualizers, DOM, and problem registries.
 */

import { createExecutionRequest, ExecutionRequest } from '../trace/ExecutionRequest.js';
import { createExecutionTrace, createTraceEvent, TRACE_SCHEMA_VERSION } from '../trace/TraceSchema.js';

const MAX_EVENTS = 50000;
const MAX_DEPTH = 8;
const MAX_ITEMS = 64;
const MAX_STR_LEN = 120;
const MAX_WALL_SECONDS = 8;
const INIT_TIMEOUT_MS = 90000;

export class PythonExecutor {
    constructor() {
        this.pyodide = null;
        this.isReady = false;
        this._initPromise = null;
        this._statusListeners = [];
        this.status = 'idle'; // 'idle' | 'loading' | 'ready' | 'error'
    }

    /**
     * Subscribe to runtime lifecycle changes: fn({ status, message }).
     * @param {Function} fn
     */
    onStatus(fn) {
        this._statusListeners.push(fn);
    }

    _setStatus(status, message = '') {
        this.status = status;
        for (const fn of this._statusListeners) {
            try { fn({ status, message }); } catch (e) { console.error('[PythonExecutor] status listener', e); }
        }
    }

    /**
     * Initialize Pyodide runtime and install the Python tracer.
     * Idempotent — safe to call multiple times.
     */
    async init() {
        if (this.isReady) return;
        if (this._initPromise) return this._initPromise;

        this._initPromise = this._doInit().catch(err => {
            // Allow a later retry after a failed download / timeout.
            this._initPromise = null;
            this._setStatus('error', err.message);
            throw err;
        });
        return this._initPromise;
    }

    async _doInit() {
        this._setStatus('loading', 'Downloading Python runtime (Pyodide WebAssembly)…');
        if (typeof window === 'undefined' || typeof window.loadPyodide !== 'function') {
            throw new Error('Pyodide loader script is unavailable. Check your network connection and reload.');
        }
        let timer;
        const timeout = new Promise((_, reject) => {
            timer = setTimeout(() => reject(new Error(`Python runtime did not load within ${INIT_TIMEOUT_MS / 1000}s.`)), INIT_TIMEOUT_MS);
        });
        try {
            this.pyodide = await Promise.race([
                window.loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/' }),
                timeout,
            ]);
        } finally {
            clearTimeout(timer);
        }

        this._setStatus('loading', 'Installing ProViz tracer…');
        await this.pyodide.runPythonAsync(this._tracerPythonSource());

        this.isReady = true;
        this._setStatus('ready', 'Python runtime ready');
    }

    _tracerPythonSource() {
        return `
import sys
import json
import time as _time_mod
import traceback as _traceback_mod

MAX_DEPTH = ${MAX_DEPTH}
MAX_ITEMS = ${MAX_ITEMS}
MAX_STR_LEN = ${MAX_STR_LEN}

# Sentinel for "no previous value"
_MISSING = object()

class ExecutionLimitExceeded(BaseException):
    """Raised by the tracer to stop runaway programs. Derives from BaseException so a
    user-level "except Exception" cannot swallow it and resume an infinite loop."""
    pass

# ---- Tracer class with Object Identity & Heap Reconstruction ----
class _ProVizTracer:
    EXCLUDED_NAMES = frozenset([
        'js', 'sys', '__builtins__', '__name__', '__doc__',
        '_ProVizTracer', '_tracer_instance', '_user_code',
        'json', '_traceback_mod', '_time_mod', '_MISSING', 'MAX_DEPTH', 'MAX_ITEMS', 'MAX_STR_LEN',
        'ExecutionLimitExceeded',
    ])

    def __init__(self):
        self.events = []
        self._event_id = 0
        self._id_to_proviz = {}    # id(v) -> "obj_N"
        self._obj_counter = 1
        self._heap = {}            # "obj_N" -> serialized HeapObject dict
        self._prev_locals = {}     # fn_name -> { var_name: structured_value }
        self._prev_heap_states = {} # "obj_N" -> serialized representation for diffing
        self._started = _time_mod.monotonic()

    def _get_obj_id(self, obj):
        py_id = id(obj)
        if py_id not in self._id_to_proviz:
            self._id_to_proviz[py_id] = f"obj_{self._obj_counter}"
            self._obj_counter += 1
        return self._id_to_proviz[py_id]

    def _serialize_value(self, v, visited=None, depth=0):
        if visited is None:
            visited = set()

        if v is None:
            return {'kind': 'primitive', 'type': 'NoneType', 'value': None}
        if isinstance(v, bool):
            return {'kind': 'primitive', 'type': 'bool', 'value': v}
        if isinstance(v, int):
            return {'kind': 'primitive', 'type': 'int', 'value': v}
        if isinstance(v, float):
            return {'kind': 'primitive', 'type': 'float', 'value': v}
        if isinstance(v, str):
            val = v if len(v) <= MAX_STR_LEN else v[:MAX_STR_LEN - 3] + '...'
            return {'kind': 'primitive', 'type': 'str', 'value': val}

        # Check for heap-allocated object
        obj_id = self._get_obj_id(v)
        type_name = type(v).__name__
        ref_val = {'kind': 'reference', 'type': type_name, 'objectId': obj_id}

        # Cycle detection & depth protection
        if id(v) in visited or depth > MAX_DEPTH:
            return ref_val

        visited.add(id(v))

        try:
            if isinstance(v, (list, tuple)):
                t_name = 'tuple' if isinstance(v, tuple) else 'list'
                elements = []
                for item in v[:MAX_ITEMS]:
                    elements.append(self._serialize_value(item, visited, depth + 1))
                self._heap[obj_id] = {
                    'id': obj_id,
                    'type': t_name,
                    'className': t_name,
                    'elements': elements,
                }
            elif isinstance(v, set):
                elements = []
                for item in list(v)[:MAX_ITEMS]:
                    elements.append(self._serialize_value(item, visited, depth + 1))
                self._heap[obj_id] = {
                    'id': obj_id,
                    'type': 'set',
                    'className': 'set',
                    'elements': elements,
                }
            elif isinstance(v, dict):
                entries = []
                for k, val in list(v.items())[:MAX_ITEMS]:
                    k_ser = self._serialize_value(k, visited, depth + 1)
                    v_ser = self._serialize_value(val, visited, depth + 1)
                    entries.append({'key': k_ser, 'value': v_ser})
                self._heap[obj_id] = {
                    'id': obj_id,
                    'type': 'dict',
                    'className': 'dict',
                    'entries': entries,
                }
            elif hasattr(v, '__dict__') and not callable(v):
                # Class instance
                fields = {}
                for k, val in v.__dict__.items():
                    if not k.startswith('__'):
                        fields[k] = self._serialize_value(val, visited, depth + 1)
                self._heap[obj_id] = {
                    'id': obj_id,
                    'type': 'instance',
                    'className': type_name,
                    'fields': fields,
                }
            else:
                # Opaque fallback for non-inspectable types
                return {'kind': 'opaque', 'type': type_name, 'reason': 'opaque_type'}
        except Exception as e:
            return {'kind': 'opaque', 'type': type_name, 'reason': str(e)}
        finally:
            visited.remove(id(v))

        return ref_val

    def trace(self, frame, event, arg):
        fn_name = frame.f_code.co_name

        # Skip internal frames
        if fn_name in ('_run_user_code', '_ProVizTracer', 'trace'):
            return self.trace
        if frame.f_code.co_filename.startswith('<frozen'):
            return self.trace
        if len(self.events) >= ${MAX_EVENTS}:
            raise ExecutionLimitExceeded(
                f"Stopped after ${MAX_EVENTS} trace steps — possible infinite loop or very long computation.")
        if _time_mod.monotonic() - self._started > ${MAX_WALL_SECONDS}:
            raise ExecutionLimitExceeded(
                "Stopped after ${MAX_WALL_SECONDS}s of execution — possible infinite loop.")

        # Clean filename
        clean_file = frame.f_code.co_filename
        if clean_file.startswith('/home/pyodide/'):
            clean_file = clean_file[len('/home/pyodide/'):]
        elif clean_file.startswith('./'):
            clean_file = clean_file[2:]
        elif clean_file == '<user_code>':
            clean_file = '<entrypoint>'

        # Build stack snapshot
        stack = []
        f = frame
        while f is not None:
            f_file = f.f_code.co_filename
            is_internal = f_file.startswith('/lib/') or f_file.startswith('<exec>') or f_file.startswith('<frozen')
            if f.f_code.co_name not in ('_run_user_code', '<module>_outer') and not is_internal:
                f_name = f.f_code.co_filename
                if f_name.startswith('/home/pyodide/'): f_name = f_name[len('/home/pyodide/'):]
                elif f_name == '<user_code>': f_name = '<entrypoint>'
                stack.append({'function': f.f_code.co_name, 'line': f.f_lineno, 'file': f_name})
            f = f.f_back
        stack = list(reversed(stack))
        stack_depth = len(stack)

        # Capture structured locals
        raw_locals = {}
        for k, v in frame.f_locals.items():
            if k.startswith('_') or k in self.EXCLUDED_NAMES:
                continue
            if callable(v) and not isinstance(v, (list, dict, tuple, set)):
                continue
            if 'module' in str(type(v)):
                continue
            raw_locals[k] = self._serialize_value(v)

        # Detect mutations in heap objects
        mutations = []
        for obj_id, current_state in list(self._heap.items()):
            prev_state = self._prev_heap_states.get(obj_id)
            if prev_state is not None and prev_state != current_state:
                mutations.append({
                    'targetObjectId': obj_id,
                    'type': current_state.get('type'),
                    'operation': 'mutate',
                    'current': current_state,
                })
            # Update snapshot of heap state
            self._prev_heap_states[obj_id] = json.loads(json.dumps(current_state))

        # Detect changed variables
        prev = self._prev_locals.get(fn_name, {})
        changed = []
        for k, new_v in raw_locals.items():
            old_v = prev.get(k, _MISSING)
            if old_v is _MISSING:
                changed.append({'name': k, 'old_value': None, 'new_value': new_v, 'is_new': True})
            elif old_v != new_v or any(m.get('targetObjectId') == new_v.get('objectId') for m in mutations):
                changed.append({'name': k, 'old_value': old_v if old_v is not _MISSING else None, 'new_value': new_v, 'is_new': False})
        self._prev_locals[fn_name] = dict(raw_locals)

        ev = {
            'event_id': self._event_id,
            'type': event,
            'line': frame.f_lineno,
            'file': clean_file,
            'function': fn_name,
            'locals': raw_locals,
            'changed_variables': changed,
            'mutations': mutations,
            'stack': stack,
            'stack_depth': stack_depth,
            'heap': json.loads(json.dumps(self._heap)),
        }

        if event == 'return':
            ev['return_value'] = self._serialize_value(arg)
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
            'heap': {},
            'output': '',
        })
    except ExecutionLimitExceeded as e:
        sys.settrace(None)
        last_line = _tracer_instance.events[-1]['line'] if _tracer_instance.events else None
        return json.dumps({
            'success': False,
            'error': {
                'type': 'ExecutionLimitExceeded',
                'message': str(e),
                'line': last_line,
                'traceback': str(e),
            },
            'events': _tracer_instance.events,
            'heap': _tracer_instance._heap,
            'output': output_buf.getvalue(),
        })
    except Exception as e:
        sys.settrace(None)
        # Keep only user frames so internal tracer plumbing never leaks into diagnostics.
        user_tb = [f for f in _traceback_mod.extract_tb(e.__traceback__) if f.filename == '<user_code>']
        tb_str = ''.join(['Traceback (most recent call last):\\n']
                         + _traceback_mod.format_list(user_tb)
                         + _traceback_mod.format_exception_only(type(e), e)).replace('<user_code>', 'main.py')
        err_line = getattr(e, 'lineno', None)
        tb_obj = e.__traceback__
        while tb_obj is not None:
            if tb_obj.tb_frame.f_code.co_filename == '<user_code>':
                err_line = tb_obj.tb_lineno
            tb_obj = tb_obj.tb_next
        return json.dumps({
            'success': False,
            'error': {
                'type': type(e).__name__,
                'message': str(e),
                'line': err_line,
                'traceback': tb_str,
            },
            'events': _tracer_instance.events,
            'heap': _tracer_instance._heap,
            'output': output_buf.getvalue(),
        })
    finally:
        sys.stdout = sys.__stdout__
        sys.settrace(None)

    return json.dumps({
        'success': True,
        'events': _tracer_instance.events,
        'heap': _tracer_instance._heap,
        'output': output_buf.getvalue(),
        'error': None,
    })
`;
    }

    /**
     * Run Python code with automatic initialization.
     * @param {string|ExecutionRequest|object} input
     * @returns {Promise<object>}
     */
    async run(input) {
        if (!this.isReady) {
            await this.init();
        }
        return await this.execute(input);
    }

    /**
     * Execute Python code or ExecutionRequest and return a canonical Universal Execution Trace (UET) with Heap Graph.
     *
     * @param {string|ExecutionRequest|object} input - Python code or ExecutionRequest
     * @returns {Promise<object>} Canonical UET ExecutionTrace object
     */
    async execute(input) {
        if (!this.isReady) {
            await this.init();
        }

        const request = input instanceof ExecutionRequest ? input : createExecutionRequest(input);
        const code = request.getMainCode();
        const startMs = performance.now();

        try {
            // Write multi-file virtual FS files to Pyodide if files map is provided
            if (request.files && typeof request.files === 'object') {
                for (const [filePath, content] of Object.entries(request.files)) {
                    try {
                        const parts = filePath.split('/');
                        if (parts.length > 1) {
                            let dirPath = '';
                            for (let p = 0; p < parts.length - 1; p++) {
                                dirPath += (p > 0 ? '/' : '') + parts[p];
                                try { this.pyodide.FS.mkdir(dirPath); } catch (e) {}
                            }
                        }
                        this.pyodide.FS.writeFile(filePath, content);
                    } catch (e) {
                        console.warn('[PythonExecutor] Could not write file to Pyodide FS:', filePath, e);
                    }
                }
            }

            this.pyodide.globals.set('_user_code_to_run', code);
            const rawJson = await this.pyodide.runPythonAsync('_run_user_code(_user_code_to_run)');
            const raw = JSON.parse(rawJson);
            const durationMs = performance.now() - startMs;

            // Map raw tracer events to canonical UET events
            const uetEvents = [];
            let eventCounter = 0;

            const rawEvents = raw.events || [];
            for (let i = 0; i < rawEvents.length; i++) {
                const r = rawEvents[i];
                const eventFile = (r.file && r.file !== '<entrypoint>') ? r.file : request.entrypoint;
                let fileId = null;
                let moduleId = null;
                if (request.workspaceSnapshot) {
                    const f = request.workspaceSnapshot.getFileByPath(eventFile);
                    if (f) {
                        fileId = f.id;
                        moduleId = f.moduleId;
                    }
                }

                const uetEvent = createTraceEvent({
                    id: eventCounter++,
                    type: r.type,
                    source: {
                        file: eventFile,
                        path: eventFile,
                        fileId,
                        moduleId,
                        line: r.line,
                        column: null,
                    },
                    scope: {
                        function: r.function || '<module>',
                        depth: r.stack_depth || (r.stack ? r.stack.length : 1),
                    },
                    data: {
                        locals: r.locals || {},
                        changed_variables: r.changed_variables || [],
                        mutations: r.mutations || [],
                        stack: r.stack || [],
                        heap: r.heap || raw.heap || {},
                        return_value: r.return_value,
                        exception_type: r.exception_type,
                        exception_message: r.exception_message,
                    },
                });
                uetEvents.push(uetEvent);
            }

            // Append program_end event if execution succeeded
            if (raw.success) {
                uetEvents.push(createTraceEvent({
                    id: eventCounter++,
                    type: 'program_end',
                    source: { file: request.entrypoint, line: null, column: null },
                    scope: { function: '<module>', depth: 0 },
                    data: {
                        output: raw.output || '',
                        heap: raw.heap || {},
                    },
                }));
            }

            const trace = createExecutionTrace({
                version: TRACE_SCHEMA_VERSION,
                metadata: {
                    language: 'python',
                    runtime: 'pyodide',
                    version: '3.x',
                    timestamp: Date.now(),
                    duration_ms: durationMs,
                    event_count: uetEvents.length,
                },
                source: {
                    entrypoint: request.entrypoint,
                    files: request.files,
                },
                events: uetEvents,
                result: {
                    success: raw.success,
                    output: raw.output || '',
                    error: raw.error || null,
                },
                final_state: {
                    output: raw.output || '',
                    heap: raw.heap || {},
                },
            });

            // Attach global heap for reference resolution
            trace.heap = raw.heap || {};

            return trace;
        } catch (err) {
            return createExecutionTrace({
                version: TRACE_SCHEMA_VERSION,
                metadata: {
                    language: 'python',
                    runtime: 'pyodide',
                    duration_ms: performance.now() - startMs,
                },
                source: {
                    entrypoint: request.entrypoint,
                    files: request.files,
                },
                events: [],
                result: {
                    success: false,
                    output: '',
                    error: { type: 'InternalError', message: err.message, line: null },
                },
                final_state: {
                    output: '',
                    heap: {},
                },
            });
        }
    }
}
