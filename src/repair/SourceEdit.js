/**
 * SourceEdit — Elementary text modification descriptor.
 */

export class SourceEdit {
    /**
     * @param {object} params
     * @param {string} [params.fileId='main.py']
     * @param {number} params.line
     * @param {number} [params.col=1]
     * @param {string} params.text
     * @param {string} [params.type='insert'] - 'insert', 'replace', 'delete', 'wrap'
     * @param {string} [params.originalText='']
     */
    constructor({
        fileId = 'main.py',
        line = 1,
        col = 1,
        text = '',
        type = 'insert',
        originalText = '',
    } = {}) {
        this.fileId = String(fileId);
        this.line = Math.max(1, Number(line) || 1);
        this.col = Math.max(1, Number(col) || 1);
        this.text = String(text ?? '');
        this.type = type;
        this.originalText = String(originalText ?? '');
        Object.freeze(this);
    }

    toJSON() {
        return {
            fileId: this.fileId,
            line: this.line,
            col: this.col,
            text: this.text,
            type: this.type,
            originalText: this.originalText,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new SourceEdit(json);
    }
}
