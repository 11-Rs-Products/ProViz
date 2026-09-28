/**
 * SourceLocation — Universal language-neutral representation of a source code coordinate.
 *
 * Represents an exact position or range in a source file, including:
 *  - fileId: Stable unique identifier for the source file
 *  - moduleId: Stable unique identifier for the containing module (optional)
 *  - path: File path relative to workspace root (e.g. 'utils.py', 'src/loader.py')
 *  - line: 1-indexed line number
 *  - column: 0 or 1-indexed column number (optional)
 *  - endLine: End line number for ranges (optional)
 *  - endColumn: End column number for ranges (optional)
 *
 * Line numbers without a file context are never assumed to be globally unique.
 */

export class SourceLocation {
    /**
     * @param {object} [params]
     * @param {string|null} [params.fileId=null] - Stable file ID
     * @param {string|null} [params.moduleId=null] - Module ID
     * @param {string|null} [params.path=null] - File path or name
     * @param {string|null} [params.file=null] - Alias for path
     * @param {number|null} [params.line=null] - 1-indexed line number
     * @param {number|null} [params.column=null] - Column number
     * @param {number|null} [params.endLine=null] - End line for ranges
     * @param {number|null} [params.endColumn=null] - End column for ranges
     */
    constructor({
        fileId = null,
        moduleId = null,
        path = null,
        file = null,
        line = null,
        column = null,
        endLine = null,
        endColumn = null,
    } = {}) {
        this.fileId = fileId ? String(fileId) : null;
        this.moduleId = moduleId ? String(moduleId) : null;
        this.path = path || file || null;
        this.line = typeof line === 'number' && !isNaN(line) ? line : null;
        this.column = typeof column === 'number' && !isNaN(column) ? column : null;
        this.endLine = typeof endLine === 'number' && !isNaN(endLine) ? endLine : null;
        this.endColumn = typeof endColumn === 'number' && !isNaN(endColumn) ? endColumn : null;
    }

    /**
     * Alias for `path` to maintain backward compatibility with legacy `{ file, line, column }` shapes.
     * @returns {string}
     */
    get file() {
        return this.path || 'main.py';
    }

    /**
     * Checks if this SourceLocation matches a given target file and line.
     * @param {string|object} targetFileOrId - File ID, path, or location object
     * @param {number} [targetLine] - Line number
     * @returns {boolean}
     */
    matches(targetFileOrId, targetLine = null) {
        if (!targetFileOrId) return false;

        if (typeof targetFileOrId === 'object') {
            const other = SourceLocation.from(targetFileOrId);
            if (other.line !== this.line) return false;
            if (this.fileId && other.fileId && this.fileId === other.fileId) return true;
            if (this.path && other.path && this.path === other.path) return true;
            return false;
        }

        const targetStr = String(targetFileOrId);
        const lineMatches = targetLine === null || targetLine === this.line;
        if (!lineMatches) return false;

        if (this.fileId && this.fileId === targetStr) return true;
        if (this.path && this.path === targetStr) return true;
        // Fallback for simple names vs paths (e.g. 'main.py' vs 'src/main.py')
        if (this.path && (this.path.endsWith('/' + targetStr) || targetStr.endsWith('/' + this.path))) {
            return true;
        }

        return false;
    }

    /**
     * Checks equality against another SourceLocation.
     * @param {SourceLocation|object} other
     * @returns {boolean}
     */
    equals(other) {
        if (!other) return false;
        const o = SourceLocation.from(other);
        return (
            this.fileId === o.fileId &&
            this.moduleId === o.moduleId &&
            this.path === o.path &&
            this.line === o.line &&
            this.column === o.column &&
            this.endLine === o.endLine &&
            this.endColumn === o.endColumn
        );
    }

    clone() {
        return new SourceLocation({
            fileId: this.fileId,
            moduleId: this.moduleId,
            path: this.path,
            line: this.line,
            column: this.column,
            endLine: this.endLine,
            endColumn: this.endColumn,
        });
    }

    toString() {
        const fileRef = this.path || this.fileId || '<unknown>';
        const lineRef = this.line !== null ? `:${this.line}` : '';
        const colRef = this.column !== null ? `:${this.column}` : '';
        return `${fileRef}${lineRef}${colRef}`;
    }

    toJSON() {
        return {
            fileId: this.fileId,
            moduleId: this.moduleId,
            path: this.path,
            file: this.file,
            line: this.line,
            column: this.column,
            endLine: this.endLine,
            endColumn: this.endColumn,
        };
    }

    /**
     * Creates a SourceLocation from any compatible object or string.
     * @param {object|string|SourceLocation} input
     * @returns {SourceLocation}
     */
    static from(input) {
        if (input instanceof SourceLocation) {
            return input;
        }
        if (typeof input === 'string') {
            return new SourceLocation({ path: input });
        }
        if (input && typeof input === 'object') {
            return new SourceLocation({
                fileId: input.fileId || null,
                moduleId: input.moduleId || null,
                path: input.path || input.file || null,
                file: input.file || input.path || null,
                line: typeof input.line === 'number' ? input.line : (typeof input.current_line === 'number' ? input.current_line : null),
                column: typeof input.column === 'number' ? input.column : null,
                endLine: typeof input.endLine === 'number' ? input.endLine : null,
                endColumn: typeof input.endColumn === 'number' ? input.endColumn : null,
            });
        }
        return new SourceLocation();
    }
}
