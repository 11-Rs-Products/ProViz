/**
 * CallFrame — Represents an active execution frame on the call stack.
 */

import { Scope } from './Scope.js';

export class CallFrame {
    /**
     * @param {object} params
     * @param {string} params.frameId - Unique frame ID (e.g. 'frame_1')
     * @param {string} params.functionName - Function name or '<module>'
     * @param {object} [params.source] - { file: string, line: number|null }
     * @param {Scope|object} [params.scope] - Local scope for this frame
     * @param {number} [params.depth=1] - Call stack depth
     */
    constructor({
        frameId,
        functionName = '<module>',
        source = { file: 'main.py', line: 1 },
        scope = null,
        depth = 1,
    }) {
        this.frameId = frameId;
        this.functionName = functionName;
        this.source = {
            file: source?.file || 'main.py',
            line: typeof source?.line === 'number' ? source.line : null,
        };
        this.scope = scope instanceof Scope ? scope : new Scope('local', scope?.bindings || scope || {});
        this.depth = depth;
    }

    equals(otherFrame) {
        if (!otherFrame || !(otherFrame instanceof CallFrame)) return false;
        return (
            this.frameId === otherFrame.frameId &&
            this.functionName === otherFrame.functionName &&
            this.depth === otherFrame.depth &&
            this.source.file === otherFrame.source.file &&
            this.source.line === otherFrame.source.line &&
            this.scope.equals(otherFrame.scope)
        );
    }

    clone() {
        return new CallFrame({
            frameId: this.frameId,
            functionName: this.functionName,
            source: { ...this.source },
            scope: this.scope.clone(),
            depth: this.depth,
        });
    }

    toJSON() {
        return {
            frameId: this.frameId,
            functionName: this.functionName,
            source: this.source,
            locals: this.scope.bindings,
            depth: this.depth,
        };
    }
}
