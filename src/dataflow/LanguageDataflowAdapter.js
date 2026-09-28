/**
 * LanguageDataflowAdapter — Abstract base class defining language-specific dataflow extraction hooks.
 */

export class LanguageDataflowAdapter {
    constructor(language = 'generic') {
        this.language = language;
    }

    /**
     * Extracts definitions, uses, dependencies, aliases, and mutations from an execution step/event.
     *
     * @param {object} params
     * @param {object} params.traceEvent - UET Trace Event
     * @param {number} params.frameIndex - Timeline frame index
     * @param {import('../runtime/RuntimeState.js').RuntimeState} params.currentRuntimeState - Current frame RuntimeState
     * @param {import('../runtime/RuntimeState.js').RuntimeState|null} params.previousRuntimeState - Previous frame RuntimeState
     * @param {string|null} params.sourceCode - Full source file text if available
     * @returns {import('./DataflowEvent.js').DataflowEvent[]}
     */
    analyzeFrame({ traceEvent, frameIndex, currentRuntimeState, previousRuntimeState, sourceCode }) {
        throw new Error('LanguageDataflowAdapter.analyzeFrame must be implemented by subclass');
    }

    /**
     * Extracts variable uses/dependencies from a right-hand-side expression.
     * @param {string} exprStr
     * @returns {string[]} Variable names read in expression
     */
    extractExpressionVariables(exprStr) {
        return [];
    }
}
