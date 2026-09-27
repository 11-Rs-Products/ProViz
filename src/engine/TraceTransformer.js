/**
 * TraceTransformer — Converts Universal Execution Trace (UET) into visualization frames.
 *
 * In Stage 1, this class acts as the bridge connecting the canonical UET contract
 * to the UI/visualizer layer by utilizing the LegacyFrameAdapter.
 */

import { LegacyFrameAdapter } from '../trace/LegacyFrameAdapter.js';

export class TraceTransformer {
    /**
     * Transform a Universal Execution Trace into an array of visualization frames.
     *
     * @param {object} executionTrace - Universal Execution Trace (version 1)
     * @param {object} [questionConfig={}] - Optional problem-specific visualization configuration
     * @returns {Array<object>} Array of VisualizationFrame objects
     */
    transform(executionTrace, questionConfig = {}) {
        return LegacyFrameAdapter.toVisualizationFrames(executionTrace, questionConfig);
    }
}
