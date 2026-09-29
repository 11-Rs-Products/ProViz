/**
 * ChangeRegion — Precise source code region for before and after versions of a change.
 */

export class ChangeRegion {
    /**
     * @param {object} params
     * @param {string} params.fileId
     * @param {string} [params.path='']
     * @param {number} [params.startLine=1]
     * @param {number} [params.startColumn=0]
     * @param {number} [params.endLine=1]
     * @param {number} [params.endColumn=0]
     * @param {string} [params.content='']
     */
    constructor({
        fileId,
        path = '',
        startLine = 1,
        startColumn = 0,
        endLine = 1,
        endColumn = 0,
        content = '',
    } = {}) {
        this.fileId = String(fileId || 'file_unknown');
        this.path = String(path || '');
        this.startLine = Math.max(1, Number(startLine) || 1);
        this.startColumn = Math.max(0, Number(startColumn) || 0);
        this.endLine = Math.max(this.startLine, Number(endLine) || this.startLine);
        this.endColumn = Math.max(0, Number(endColumn) || 0);
        this.content = String(content || '');
        Object.freeze(this);
    }

    toJSON() {
        return {
            fileId: this.fileId,
            path: this.path,
            startLine: this.startLine,
            startColumn: this.startColumn,
            endLine: this.endLine,
            endColumn: this.endColumn,
            content: this.content,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new ChangeRegion(json);
    }
}
