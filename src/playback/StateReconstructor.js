/**
 * StateReconstructor — Deterministically reconstructs RuntimeState at arbitrary frame indices.
 *
 * Uses checkpoints at configurable intervals to ensure O(checkpointInterval) worst-case
 * reconstruction time regardless of trace length.
 *
 * Guaranteed Properties:
 *  1. Pure & Deterministic: reconstruct(N) always yields the identical RuntimeState.
 *  2. Checkpoint Isolation: Mutations to returned state never corrupt checkpoints or other frames.
 *  3. Bidirectional: Stepping forward, backward, or scrubbing arbitrarily produces the exact same truth.
 */

import { RuntimeState } from '../runtime/RuntimeState.js';
import { Heap } from '../runtime/Heap.js';
import { Checkpoint } from './Checkpoint.js';
import { Timeline } from './Timeline.js';
import { LegacyFrameAdapter } from '../trace/LegacyFrameAdapter.js';

export class StateReconstructor {
    /**
     * @param {object} params
     * @param {object} params.uetTrace - Canonical Universal Execution Trace (version 1)
     * @param {number} [params.checkpointInterval=50] - Interval in frames between checkpoints
     * @param {object} [params.problemConfig={}] - Optional problem-specific config
     */
    constructor({ uetTrace, checkpointInterval = 50, problemConfig = {} } = {}) {
        this.uetTrace = uetTrace || { events: [], heap: {} };
        this.checkpointInterval = Math.max(1, checkpointInterval);
        this.problemConfig = problemConfig;

        // Generate legacy frames and initialize timeline
        const frames = LegacyFrameAdapter.toVisualizationFrames(this.uetTrace, this.problemConfig);
        this.timeline = new Timeline({
            events: this.uetTrace.events || [],
            frames,
            metadata: this.uetTrace.metadata || {},
        });

        this.checkpoints = [];
        this._buildCheckpoints();
    }

    /**
     * Builds checkpoint snapshots at fixed frame intervals.
     * @private
     */
    _buildCheckpoints() {
        this.checkpoints = [];
        const frames = this.timeline.frames;

        const initialState = new RuntimeState({
            currentSource: { file: this.uetTrace.source?.entrypoint || 'main.py', line: null },
            heap: new Heap(this.uetTrace.heap || {}),
        });

        // Push baseline checkpoint at index -1 (state before any frames are executed)
        this.checkpoints.push(new Checkpoint(-1, initialState.clone()));

        if (frames.length === 0) return;

        let currentState = initialState.clone();

        for (let i = 0; i < frames.length; i++) {
            const frame = frames[i];
            this._applyFrameTransition(currentState, frame);

            // Record checkpoint at intervals
            if (i === 0 || (i + 1) % this.checkpointInterval === 0 || i === frames.length - 1) {
                this.checkpoints.push(new Checkpoint(i, currentState.clone()));
            }
        }
    }

    /**
     * Reconstructs the exact RuntimeState for a target frame index.
     *
     * @param {number} targetIndex - Target frame index (0-indexed)
     * @returns {RuntimeState} Isolated, cloned RuntimeState at targetIndex
     */
    reconstruct(targetIndex) {
        if (this.timeline.frames.length === 0) {
            return new RuntimeState();
        }

        const clamped = Math.max(0, Math.min(targetIndex, this.timeline.frames.length - 1));

        // 1. Find nearest checkpoint with cp.index <= clamped
        let bestCheckpoint = this.checkpoints[0];
        for (let i = 0; i < this.checkpoints.length; i++) {
            const cp = this.checkpoints[i];
            if (cp.index <= clamped) {
                bestCheckpoint = cp;
            } else {
                break;
            }
        }

        // 2. Clone checkpoint state (guarantees isolation)
        const state = bestCheckpoint.getStateClone();

        // 3. Replay frame transitions from checkpoint index + 1 up to targetIndex
        for (let i = bestCheckpoint.index + 1; i <= clamped; i++) {
            const frame = this.timeline.frames[i];
            this._applyFrameTransition(state, frame);
        }

        return state;
    }

    /**
     * Applies a single frame's state transitions to the given RuntimeState instance.
     * @private
     */
    _applyFrameTransition(state, frame) {
        if (!frame) return;

        const currentFile = frame.file || frame.source?.file || frame.source?.path || state.currentSource.file || 'main.py';
        state.currentSource.file = currentFile;
        state.currentSource.path = currentFile;
        if (frame.source?.fileId) state.currentSource.fileId = frame.source.fileId;
        if (frame.source?.moduleId) state.currentSource.moduleId = frame.source.moduleId;
        state.currentSource.line = frame.current_line ?? state.currentSource.line;

        const eventType = frame.event_type;

        if (eventType === 'call') {
            // Push new call frame with initial argument locals
            state.pushCallFrame({
                frameId: `frame_${frame.stack_depth || state.callStack.length + 1}`,
                functionName: frame.current_function || '<module>',
                source: {
                    file: currentFile,
                    path: currentFile,
                    fileId: frame.source?.fileId || null,
                    moduleId: frame.source?.moduleId || null,
                    line: frame.current_line,
                },
                locals: this._extractStructuredLocals(frame.variables),
                depth: frame.stack_depth || state.callStack.length + 1,
            });
        } else if (eventType === 'return') {
            // Pop the active call frame
            if (state.callStack.length > 0) {
                state.popCallFrame();
            }
        } else if (eventType === 'line') {
            // Ensure at least one call frame exists for module level
            if (state.callStack.length === 0) {
                state.pushCallFrame({
                    frameId: 'frame_1',
                    functionName: frame.current_function || '<module>',
                    source: {
                        file: currentFile,
                        path: currentFile,
                        fileId: frame.source?.fileId || null,
                        moduleId: frame.source?.moduleId || null,
                        line: frame.current_line,
                    },
                    locals: {},
                    depth: 1,
                });
            }

            // Update variables in active frame
            const structuredLocals = this._extractStructuredLocals(frame.variables);
            for (const [k, v] of Object.entries(structuredLocals)) {
                state.setVariable(k, v);
            }
        }

        // Apply raw event heap updates if present in source UET event
        const sourceEventId = frame.source_event_ids?.[0];
        if (typeof sourceEventId === 'number') {
            const uetEvent = this.timeline.getEvent(sourceEventId);
            if (uetEvent && uetEvent.data?.heap) {
                for (const [objId, objData] of Object.entries(uetEvent.data.heap)) {
                    state.heap.setObject(objData);
                }
            }
        }
    }

    _extractStructuredLocals(variables) {
        const out = {};
        if (!variables || typeof variables !== 'object') return out;
        for (const [name, info] of Object.entries(variables)) {
            const raw = info.rawValue;
            if (raw && typeof raw === 'object') {
                out[name] = { ...raw };
            } else {
                out[name] = {
                    kind: 'primitive',
                    type: typeof info.value === 'number' ? 'int' : 'str',
                    value: info.value,
                };
            }
        }
        return out;
    }
}
