/**
 * TraceSource — Encapsulates source coordinate metadata for a UET event.
 *
 * Provides language-neutral identification of:
 *  - fileId: Stable source file identifier
 *  - moduleId: Containing module identifier
 *  - path / file: File path or name
 *  - line: 1-indexed source line
 *  - column: Optional column
 *  - endLine / endColumn: Optional range
 */

import { SourceLocation } from '../workspace/SourceLocation.js';

export class TraceSource {
    /**
     * @param {object} [params]
     * @param {string|null} [params.fileId=null]
     * @param {string|null} [params.moduleId=null]
     * @param {string|null} [params.path='main.py']
     * @param {string|null} [params.file=null]
     * @param {number|null} [params.line=null]
     * @param {number|null} [params.column=null]
     * @param {number|null} [params.endLine=null]
     * @param {number|null} [params.endColumn=null]
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
        this.path = path || file || 'main.py';
        this.file = this.path;
        this.line = typeof line === 'number' && !isNaN(line) ? line : null;
        this.column = typeof column === 'number' && !isNaN(column) ? column : null;
        this.endLine = typeof endLine === 'number' && !isNaN(endLine) ? endLine : null;
        this.endColumn = typeof endColumn === 'number' && !isNaN(endColumn) ? endColumn : null;
    }

    /**
     * Converts to canonical SourceLocation instance.
     * @returns {SourceLocation}
     */
    toSourceLocation() {
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

    clone() {
        return new TraceSource({
            fileId: this.fileId,
            moduleId: this.moduleId,
            path: this.path,
            line: this.line,
            column: this.column,
            endLine: this.endLine,
            endColumn: this.endColumn,
        });
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

    static from(input) {
        if (input instanceof TraceSource) return input;
        if (!input) return new TraceSource();
        return new TraceSource(input);
    }
}
