/**
 * Patch — Structural, location-precise source edit.
 *
 * Immutable representation of a text modification bounded by lines and columns.
 */

export class Patch {
    /**
     * @param {object} params
     * @param {string} [params.fileId='main.py']
     * @param {number} params.startLine - 1-indexed starting line
     * @param {number} params.startColumn - 1-indexed starting column
     * @param {number} params.endLine - 1-indexed ending line
     * @param {number} params.endColumn - 1-indexed ending column
     * @param {string} params.replacement - New text to insert
     * @param {string} [params.originalText=''] - Original text expected at range
     * @param {string} [params.patchId=null] - Deterministic identifier
     */
    constructor({
        fileId = 'main.py',
        startLine = 1,
        startColumn = 1,
        endLine = 1,
        endColumn = 1,
        replacement = '',
        originalText = '',
        patchId = null,
    } = {}) {
        this.fileId = String(fileId);
        this.startLine = Math.max(1, Number(startLine) || 1);
        this.startColumn = Math.max(1, Number(startColumn) || 1);
        this.endLine = Math.max(this.startLine, Number(endLine) || this.startLine);
        this.endColumn = Math.max(1, Number(endColumn) || 1);
        this.replacement = String(replacement ?? '');
        this.originalText = String(originalText ?? '');

        this.patchId = patchId || Patch.computeHash(JSON.stringify({
            fileId: this.fileId,
            startLine: this.startLine,
            startColumn: this.startColumn,
            endLine: this.endLine,
            endColumn: this.endColumn,
            replacement: this.replacement,
            originalText: this.originalText,
        }));

        Object.freeze(this);
    }

    static computeHash(str) {
        let hash = 5381;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) + hash) + str.charCodeAt(i);
            hash = hash & hash;
        }
        return `patch_${Math.abs(hash).toString(16)}`;
    }

    /**
     * Apply this single patch to a source string.
     * @param {string} sourceCode
     * @returns {string}
     */
    applyToString(sourceCode) {
        const lines = String(sourceCode || '').split('\n');
        if (this.startLine > lines.length) {
            // Append at the end if beyond bounds
            return sourceCode + '\n' + this.replacement;
        }

        const beforeLines = lines.slice(0, this.startLine - 1);
        const afterLines = lines.slice(this.endLine);

        const startLineText = lines[this.startLine - 1] || '';
        const endLineText = lines[this.endLine - 1] || '';

        const prefix = startLineText.slice(0, this.startColumn - 1);
        const suffix = endLineText.slice(this.endColumn - 1);

        const modifiedBlock = prefix + this.replacement + suffix;
        const resultLines = [...beforeLines, modifiedBlock, ...afterLines];
        return resultLines.join('\n');
    }

    /**
     * Create the inverse patch that reverts this edit.
     * @returns {Patch}
     */
    reverse() {
        const replacementLines = this.replacement.split('\n');
        const endLine = this.startLine + replacementLines.length - 1;
        const endColumn = replacementLines.length === 1
            ? this.startColumn + this.replacement.length
            : replacementLines[replacementLines.length - 1].length + 1;

        return new Patch({
            fileId: this.fileId,
            startLine: this.startLine,
            startColumn: this.startColumn,
            endLine: endLine,
            endColumn: endColumn,
            replacement: this.originalText,
            originalText: this.replacement,
        });
    }

    /**
     * Check if this patch overlaps/conflicts with another patch.
     * @param {Patch} other
     * @returns {boolean}
     */
    conflictsWith(other) {
        if (this.fileId !== other.fileId) return false;
        if (this.endLine < other.startLine || other.endLine < this.startLine) {
            return false;
        }
        if (this.endLine === other.startLine && this.endColumn < other.startColumn) {
            return false;
        }
        if (other.endLine === this.startLine && other.endColumn < this.startColumn) {
            return false;
        }
        return true;
    }

    toJSON() {
        return {
            patchId: this.patchId,
            fileId: this.fileId,
            startLine: this.startLine,
            startColumn: this.startColumn,
            endLine: this.endLine,
            endColumn: this.endColumn,
            replacement: this.replacement,
            originalText: this.originalText,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new Patch(json);
    }
}
