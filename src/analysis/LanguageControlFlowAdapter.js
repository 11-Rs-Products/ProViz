/**
 * LanguageControlFlowAdapter — Abstract base class defining language-specific CFG construction hooks.
 */

export class LanguageControlFlowAdapter {
    constructor(language = 'generic') {
        this.language = language;
    }

    /**
     * Parses source code and constructs a ControlFlowGraph for the file/module.
     *
     * @param {string} sourceCode
     * @param {object} [options]
     * @returns {import('./ControlFlowGraph.js').ControlFlowGraph}
     */
    buildCFG(sourceCode, options = {}) {
        throw new Error('LanguageControlFlowAdapter.buildCFG must be implemented by subclass');
    }
}
