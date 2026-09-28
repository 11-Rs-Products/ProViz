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
     * @param {Function|null} [params.highlightFn] - Custom highlight callback (line, file, fileId) => void
     * @param {Function|null} [params.onFileSwitch] - Custom file switch callback (file, fileId) => void
     */
    constructor({ debuggerInstance, editorView = null, highlightFn = null, onFileSwitch = null } = {}) {
        if (!debuggerInstance) {
            throw new Error('EditorDebuggerAdapter requires a valid Debugger instance');
        }
        this.debugger = debuggerInstance;
        this.editorView = editorView;
        this.highlightFn = highlightFn;
        this.onFileSwitch = onFileSwitch;
        this.activeLine = null;
        this.activeFile = null;
        this.activeFileId = null;

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
        const file = state.sourceLocation?.path || state.sourceLocation?.file || 'main.py';
        const fileId = state.sourceLocation?.fileId || null;

        const fileChanged = this.activeFile !== file || this.activeFileId !== fileId;
        this.activeLine = line;
        this.activeFile = file;
        this.activeFileId = fileId;

        if (fileChanged && typeof this.onFileSwitch === 'function') {
            this.onFileSwitch(file, fileId);
        }

        if (typeof this.highlightFn === 'function') {
            this.highlightFn(line, file, fileId);
        } else if (this.editorView && typeof line === 'number' && line > 0) {
            this.highlightEditorLine(line);
        }
    }

    /**
     * Explicitly switch current file in the editor.
     * @param {string} fileOrPath
     * @param {string|null} [fileId=null]
     */
    switchFile(fileOrPath, fileId = null) {
        this.activeFile = fileOrPath;
        this.activeFileId = fileId;
        if (typeof this.onFileSwitch === 'function') {
            this.onFileSwitch(fileOrPath, fileId);
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
     * @param {string|null} [fileId=null]
     * @returns {boolean} New enabled state
     */
    toggleBreakpoint(line, file = null, fileId = null) {
        const targetFile = file || this.activeFile || 'main.py';
        const targetFileId = fileId || this.activeFileId || null;
        return this.debugger.toggleBreakpoint(targetFile, line, targetFileId);
    }
}
