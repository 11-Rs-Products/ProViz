/**
 * DataflowAnalyzer — Central engine orchestrator for dataflow & dependency graph construction.
 *
 * Guaranteed Properties:
 *  1. Pure & Read-Only: Never modifies RuntimeState, Heap, Scope, or Timeline.
 *  2. Language-Neutral Orchestration: Delegates syntax-specific parsing to language adapters.
 *  3. Deterministic: Given the same trace/timeline, produces the identical DataflowGraph.
 */

import { PythonDataflowAdapter } from './PythonDataflowAdapter.js';
import { DataflowBuilder } from './DataflowBuilder.js';
import { StateReconstructor } from '../playback/StateReconstructor.js';

export class DataflowAnalyzer {
    /**
     * @param {object} [options]
     * @param {object} [options.adapters] - Map of language -> LanguageDataflowAdapter
     */
    constructor({ adapters = {} } = {}) {
        this.adapters = {
            python: new PythonDataflowAdapter(),
            ...adapters,
        };
    }

    /**
     * Analyzes an execution trace or timeline and builds a complete DataflowGraph.
     *
     * @param {object} input - UET Trace or timeline container
     * @param {object} [workspace=null] - Optional WorkspaceSnapshot
     * @param {object} [options={}]
     * @returns {import('./DataflowGraph.js').DataflowGraph}
     */
    analyze(input, workspace = null, options = {}) {
        const events = Array.isArray(input?.events) ? input.events : (Array.isArray(input) ? input : []);
        const language = input?.metadata?.language || 'python';
        const adapter = this.adapters[language] || this.adapters.python || new PythonDataflowAdapter();

        const builder = new DataflowBuilder();
        const allDataflowEvents = [];

        let prevRuntimeState = null;

        for (let frameIdx = 0; frameIdx < events.length; frameIdx++) {
            const ev = events[frameIdx];

            // Reconstruct runtime state at this frame
            let curRuntimeState = null;
            try {
                if (ev?.runtimeState) {
                    curRuntimeState = ev.runtimeState;
                } else if (input?.timeline || events.length > 0) {
                    curRuntimeState = StateReconstructor.reconstruct(events, frameIdx);
                }
            } catch (err) {
                curRuntimeState = null;
            }

            // Fetch source code for the file if present in workspace or input
            const fileId = ev?.source?.fileId || ev?.source?.file || 'main.py';
            const sourceCode = workspace?.getFile?.(fileId)?.content || input?.source?.files?.[fileId] || '';

            const dfEvents = adapter.analyzeFrame({
                traceEvent: ev,
                frameIndex: frameIdx,
                currentRuntimeState: curRuntimeState,
                previousRuntimeState: prevRuntimeState,
                sourceCode,
            });

            if (Array.isArray(dfEvents)) {
                allDataflowEvents.push(...dfEvents);
            }

            prevRuntimeState = curRuntimeState;
        }

        return builder.buildFromEvents(allDataflowEvents);
    }
}
