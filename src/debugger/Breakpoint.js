/**
 * Breakpoint — Represents a source code breakpoint in the universal debugger.
 *
 * Operates against source line numbers in the recorded UET timeline.
 */

export class Breakpoint {
    /**
     * @param {object} params
     * @param {string} [params.file='main.py'] - Source file name
     * @param {number} params.line - Line number (1-indexed)
     * @param {boolean} [params.enabled=true] - Whether breakpoint is active
     * @param {string} [params.id] - Unique breakpoint identifier
     */
    constructor({ file = 'main.py', line, enabled = true, id = null } = {}) {
        if (typeof line !== 'number' || line <= 0) {
            throw new Error('Breakpoint line must be a positive integer');
        }
        this.file = file || 'main.py';
        this.line = line;
        this.enabled = Boolean(enabled);
        this.id = id || `${this.file}:${this.line}`;
    }

    /**
     * Checks if this breakpoint matches a given file and line.
     * @param {string} file
     * @param {number} line
     * @returns {boolean}
     */
    matches(file, line) {
        if (!this.enabled) return false;
        const targetFile = file || 'main.py';
        return this.file === targetFile && this.line === line;
    }

    /**
     * Toggles the enabled state of the breakpoint.
     * @returns {boolean} New enabled state
     */
    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }

    clone() {
        return new Breakpoint({
            file: this.file,
            line: this.line,
            enabled: this.enabled,
            id: this.id,
        });
    }

    toJSON() {
        return {
            id: this.id,
            file: this.file,
            line: this.line,
            enabled: this.enabled,
        };
    }
}
