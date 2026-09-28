/**
 * EditorDebuggerAdapter — Connects the universal Debugger controller to CodeMirror editor view.
 *
 * Responsibilities:
 *  - Translates DebuggerState sourceLocation changes into CodeMirror line highlights.
 *  - Handles breakpoint gutter interactions without polluting Debugger core logic.
 *  - Fully decoupled: Debugger core does NOT depend on CodeMirror or DOM.
 */

export class EditorDebuggerAdapter {
    /**
     * @param {object} params
     * @param {import('./Debugger.js').Debugger} params.debuggerInstance - Authoritative Debugger instance
     * @param {object|null} [params.editorView] - CodeMirror 6 EditorView instance or mock
     * @param {Function|null} [params.highlightFn] - Custom highlight callback
     */
    constructor({ debuggerInstance, editorView = null, highlightFn = null } = {}) {
        if (!debuggerInstance) {
            throw new Error('EditorDebuggerAdapter requires a valid Debugger instance');
        }
        this.debugger = debuggerInstance;
        this.editorView = editorView;
        this.highlightFn = highlightFn;
        this.activeLine = null;

        // Subscribe to Debugger state updates
        this.debugger.onStateChange((state) => {
            this.handleStateChange(state);
        });
    }

    /**
     * Bind or update CodeMirror editor instance.
     * @param {object} editorView
     */
    setEditorView(editorView) {
        this.editorView = editorView;
    }

    /**
     * Handle state change emitted by the Debugger.
     * @param {import('./DebuggerState.js').DebuggerState} state
     */
    handleStateChange(state) {
        const line = state.sourceLocation?.line;
        this.activeLine = line;

        if (typeof this.highlightFn === 'function') {
            this.highlightFn(line, state.sourceLocation?.file || 'main.py');
        } else if (this.editorView && typeof line === 'number' && line > 0) {
            this.highlightEditorLine(line);
        }
    }

    /**
     * Highlight line in CodeMirror view if available.
     * @param {number} lineNumber
     */
    highlightEditorLine(lineNumber) {
        if (!this.editorView) return;

        try {
            // CodeMirror 6 StateEffect / dispatch pattern if supported
            if (typeof this.editorView.dispatch === 'function' && this.editorView.state) {
                const doc = this.editorView.state.doc;
                if (lineNumber > 0 && lineNumber <= doc.lines) {
                    const lineInfo = doc.line(lineNumber);
                    this.editorView.dispatch({
                        selection: { anchor: lineInfo.from },
                        scrollIntoView: true,
                    });
                }
            }
        } catch (e) {
            console.warn('[EditorDebuggerAdapter] Could not highlight line in editor:', e);
        }
    }

    /**
     * User toggled a breakpoint at line in the editor UI.
     * @param {number} line
     * @param {string} [file='main.py']
     * @returns {boolean} New enabled state
     */
    toggleBreakpoint(line, file = 'main.py') {
        return this.debugger.toggleBreakpoint(file, line);
    }
}
