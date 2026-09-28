/**
 * SourceFile — Renderer-independent source file abstraction in the Universal Workspace.
 *
 * Encapsulates:
 *  - id: Stable unique file identifier (e.g. 'file_main', 'file_utils', 'file_1')
 *  - path: Relative path in workspace (e.g. 'main.py', 'src/models.py')
 *  - name: Base file name (e.g. 'main.py', 'models.py')
 *  - language: Source programming language identifier (e.g. 'python', 'javascript')
 *  - content: UTF-8 source code content
 *  - moduleId: Containing module ID if mapped (e.g. 'module_main')
 *  - metadata: Arbitrary file metadata
 *  - version: Incremental content version number
 *
 * File identity is permanent and independent of array indices or transient buffer positions.
 */

export class SourceFile {
    /**
     * @param {object} params
     * @param {string} params.id - Stable file ID
     * @param {string} params.path - Workspace-relative path
     * @param {string} [params.name] - Base file name (defaults to basename of path)
     * @param {string} [params.language='python'] - Language identifier
     * @param {string} [params.content=''] - Source code text
     * @param {string|null} [params.moduleId=null] - Containing module identifier
     * @param {object} [params.metadata={}] - Arbitrary metadata
     * @param {number} [params.version=1] - File version
     */
    constructor({
        id,
        path,
        name = null,
        language = 'python',
        content = '',
        moduleId = null,
        metadata = {},
        version = 1,
    }) {
        if (!id || typeof id !== 'string') {
            throw new Error('SourceFile requires a non-empty string "id"');
        }
        if (!path || typeof path !== 'string') {
            throw new Error('SourceFile requires a non-empty string "path"');
        }

        this.id = id;
        this.path = path;
        this.name = name || SourceFile._extractBaseName(path);
        this.language = (language || 'python').toLowerCase();
        this.content = typeof content === 'string' ? content : String(content || '');
        this.moduleId = moduleId ? String(moduleId) : null;
        this.metadata = { ...metadata };
        this.version = typeof version === 'number' ? version : 1;
    }

    /**
     * Extracts basename from a file path.
     * @private
     */
    static _extractBaseName(path) {
        if (!path) return '';
        const parts = path.split(/[\/\\]/);
        return parts[parts.length - 1] || path;
    }

    /**
     * Updates file content and increments the version number.
     * @param {string} newContent
     * @returns {SourceFile} Self (fluent)
     */
    updateContent(newContent) {
        this.content = typeof newContent === 'string' ? newContent : String(newContent || '');
        this.version += 1;
        return this;
    }

    /**
     * Returns total lines count in this file.
     * @returns {number}
     */
    get lineCount() {
        if (!this.content) return 0;
        return this.content.split('\n').length;
    }

    /**
     * Retrieves specific 1-indexed line content.
     * @param {number} lineNumber (1-indexed)
     * @returns {string|null}
     */
    getLine(lineNumber) {
        if (typeof lineNumber !== 'number' || lineNumber < 1) return null;
        const lines = this.content.split('\n');
        if (lineNumber > lines.length) return null;
        return lines[lineNumber - 1];
    }

    clone() {
        return new SourceFile({
            id: this.id,
            path: this.path,
            name: this.name,
            language: this.language,
            content: this.content,
            moduleId: this.moduleId,
            metadata: { ...this.metadata },
            version: this.version,
        });
    }

    equals(other) {
        if (!other || !(other instanceof SourceFile)) return false;
        return (
            this.id === other.id &&
            this.path === other.path &&
            this.name === other.name &&
            this.language === other.language &&
            this.content === other.content &&
            this.moduleId === other.moduleId &&
            this.version === other.version
        );
    }

    toJSON() {
        return {
            id: this.id,
            path: this.path,
            name: this.name,
            language: this.language,
            content: this.content,
            moduleId: this.moduleId,
            metadata: this.metadata,
            version: this.version,
            lineCount: this.lineCount,
        };
    }

    /**
     * Reconstitutes a SourceFile from JSON representation.
     * @param {object} json
     * @returns {SourceFile}
     */
    static fromJSON(json) {
        if (!json) throw new Error('Cannot construct SourceFile from null/undefined');
        return new SourceFile({
            id: json.id,
            path: json.path,
            name: json.name,
            language: json.language,
            content: json.content,
            moduleId: json.moduleId,
            metadata: json.metadata || {},
            version: json.version || 1,
        });
    }
}
