/**
 * Breakpoint — Represents a source code breakpoint in the universal debugger.
 *
 * Operates against source file coordinates in the recorded UET timeline.
 * Ensures breakpoints are file-aware: a breakpoint on utils.py:14 will never trigger at main.py:14.
 */

export class Breakpoint {
    /**
     * @param {object} params
     * @param {string|null} [params.fileId=null] - Stable source file ID
     * @param {string|null} [params.moduleId=null] - Containing module ID
     * @param {string} [params.file='main.py'] - Source file name / path
     * @param {string} [params.path] - Alias for file
     * @param {number} params.line - Line number (1-indexed)
     * @param {boolean} [params.enabled=true] - Whether breakpoint is active
     * @param {string} [params.id] - Unique breakpoint identifier
     */
    constructor({ fileId = null, moduleId = null, file = null, path = null, line, enabled = true, id = null } = {}) {
        if (typeof line !== 'number' || line <= 0) {
            throw new Error('Breakpoint line must be a positive integer');
        }
        this.fileId = fileId ? String(fileId) : null;
        this.moduleId = moduleId ? String(moduleId) : null;
        this.file = path || file || 'main.py';
        this.path = this.file;
        this.line = line;
        this.enabled = Boolean(enabled);
        this.id = id || `${this.fileId || this.file}:${this.line}`;
    }

    /**
     * Checks if this breakpoint matches a given file and line or location object.
     * @param {string|object} fileOrLocation
     * @param {number} [line]
     * @returns {boolean}
     */
    matches(fileOrLocation, line = null) {
        if (!this.enabled) return false;

        if (fileOrLocation && typeof fileOrLocation === 'object') {
            const targetLine = typeof fileOrLocation.line === 'number' ? fileOrLocation.line : fileOrLocation.current_line;
            if (targetLine !== this.line) return false;

            if (this.fileId && fileOrLocation.fileId && this.fileId === fileOrLocation.fileId) {
                return true;
            }

            const targetPath = fileOrLocation.path || fileOrLocation.file || 'main.py';
            return this._matchesPath(targetPath);
        }

        const targetFile = fileOrLocation ? String(fileOrLocation) : 'main.py';
        if (line !== this.line) return false;

        if (this.fileId && this.fileId === targetFile) {
            return true;
        }

        return this._matchesPath(targetFile);
    }

    _matchesPath(targetPath) {
        if (this.file === targetPath) return true;
        if (this.path === targetPath) return true;
        const myBase = this.file.split(/[\/\\]/).pop();
        const targetBase = targetPath.split(/[\/\\]/).pop();
        return myBase === targetBase;
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
            fileId: this.fileId,
            moduleId: this.moduleId,
            file: this.file,
            path: this.path,
            line: this.line,
            enabled: this.enabled,
            id: this.id,
        });
    }

    toJSON() {
        return {
            id: this.id,
            fileId: this.fileId,
            moduleId: this.moduleId,
            file: this.file,
            path: this.path,
            line: this.line,
            enabled: this.enabled,
        };
    }
}
