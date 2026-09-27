/**
 * RuntimeState — Canonical representation of program execution state at a single step.
 *
 * Encapsulates:
 *  - Global scope
 *  - Call stack (active frames & local scopes)
 *  - Heap (discrete heap objects, reference graph, instances)
 *  - Source pointer (file, line)
 *  - Active event reference
 */

import { Scope } from './Scope.js';
import { Heap } from './Heap.js';
import { CallFrame } from './CallFrame.js';

export class RuntimeState {
    /**
     * @param {object} [params]
     * @param {Scope|object} [params.globals]
     * @param {Array<CallFrame>} [params.callStack]
     * @param {Heap|object} [params.heap]
     * @param {object} [params.currentSource]
     * @param {object|null} [params.currentEvent]
     */
    constructor({
        globals = null,
        callStack = [],
        heap = null,
        currentSource = { file: 'main.py', line: null },
        currentEvent = null,
    } = {}) {
        this.globals = globals instanceof Scope ? globals : new Scope('global', globals?.bindings || globals || {});
        this.callStack = Array.isArray(callStack)
            ? callStack.map(f => (f instanceof CallFrame ? f : new CallFrame(f)))
            : [];
        this.heap = heap instanceof Heap ? heap : new Heap(heap?.objects || heap || {});
        this.currentSource = {
            file: currentSource?.file || 'main.py',
            line: currentSource?.line ?? null,
        };
        this.currentEvent = currentEvent || null;
    }

    /**
     * Get the active (topmost) call frame.
     * @returns {CallFrame|null}
     */
    get activeFrame() {
        return this.callStack.length > 0 ? this.callStack[this.callStack.length - 1] : null;
    }

    /**
     * Get local bindings for the active call frame.
     * @returns {object}
     */
    get activeLocals() {
        const frame = this.activeFrame;
        return frame ? frame.scope.bindings : {};
    }

    /**
     * Push a new call frame onto the call stack.
     * @param {object} params
     * @returns {CallFrame}
     */
    pushCallFrame({ frameId, functionName, source, locals = {}, depth = null }) {
        const d = typeof depth === 'number' ? depth : this.callStack.length + 1;
        const id = frameId || `frame_${this.callStack.length}`;
        const frame = new CallFrame({
            frameId: id,
            functionName,
            source,
            scope: new Scope('local', locals),
            depth: d,
        });
        this.callStack.push(frame);
        return frame;
    }

    /**
     * Pop the topmost call frame from the call stack.
     * @returns {CallFrame|null}
     */
    popCallFrame() {
        return this.callStack.pop() || null;
    }

    /**
     * Set a variable binding in the active local scope (or global if stack is empty).
     * @param {string} name
     * @param {object} value - Structured Value
     */
    setVariable(name, value) {
        if (this.callStack.length > 0) {
            this.activeFrame.scope.setBinding(name, value);
        } else {
            this.globals.setBinding(name, value);
        }
    }

    /**
     * Retrieve variable value (searches active local scope then global scope).
     * @param {string} name
     * @returns {object|null}
     */
    getVariable(name) {
        if (this.callStack.length > 0 && this.activeFrame.scope.hasBinding(name)) {
            return this.activeFrame.scope.getBinding(name);
        }
        return this.globals.getBinding(name);
    }

    /**
     * Compare this runtime state with another for deterministic structural equality.
     * @param {RuntimeState} otherState
     * @returns {boolean}
     */
    equals(otherState) {
        if (!otherState || !(otherState instanceof RuntimeState)) return false;
        if (!this.globals.equals(otherState.globals)) return false;
        if (this.callStack.length !== otherState.callStack.length) return false;
        for (let i = 0; i < this.callStack.length; i++) {
            if (!this.callStack[i].equals(otherState.callStack[i])) return false;
        }
        if (!this.heap.equals(otherState.heap)) return false;
        if (this.currentSource.file !== otherState.currentSource.file || this.currentSource.line !== otherState.currentSource.line) {
            return false;
        }
        return true;
    }

    /**
     * Clone the runtime state.
     * @returns {RuntimeState}
     */
    clone() {
        return new RuntimeState({
            globals: this.globals.clone(),
            callStack: this.callStack.map(f => f.clone()),
            heap: this.heap.clone(),
            currentSource: { ...this.currentSource },
            currentEvent: this.currentEvent ? { ...this.currentEvent } : null,
        });
    }

    /**
     * Serialized representation for inspection or debugging.
     */
    toJSON() {
        return {
            globals: this.globals.toJSON(),
            callStack: this.callStack.map(f => f.toJSON()),
            heap: this.heap.toJSON(),
            currentSource: this.currentSource,
            activeLocals: this.activeLocals,
        };
    }
}
