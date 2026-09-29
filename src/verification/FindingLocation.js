/**
 * FindingLocation — Source coordinate model for verification findings.
 */

export class FindingLocation {
    /**
     * @param {object} [params]
     * @param {string} [params.fileId]
     * @param {number|null} [params.line]
     * @param {number|null} [params.column]
     * @param {number|null} [params.endLine]
     * @param {number|null} [params.endColumn]
     */
    constructor({
        fileId = 'main.py',
        line = null,
        column = null,
        endLine = null,
        endColumn = null,
    } = {}) {
        this.fileId = String(fileId || 'main.py');
        this.line = typeof line === 'number' ? line : null;
        this.column = typeof column === 'number' ? column : null;
        this.endLine = typeof endLine === 'number' ? endLine : (this.line || null);
        this.endColumn = typeof endColumn === 'number' ? endColumn : null;
        Object.freeze(this);
    }

    toString() {
        if (this.line === null) return this.fileId;
        if (this.column === null) return `${this.fileId}:${this.line}`;
        return `${this.fileId}:${this.line}:${this.column}`;
    }

    equals(other) {
        if (!other || !(other instanceof FindingLocation)) return false;
        return (
            this.fileId === other.fileId &&
            this.line === other.line &&
            this.column === other.column &&
            this.endLine === other.endLine &&
            this.endColumn === other.endColumn
        );
    }

    toJSON() {
        return {
            fileId: this.fileId,
            line: this.line,
            column: this.column,
            endLine: this.endLine,
            endColumn: this.endColumn,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new FindingLocation(json);
    }
}
