/**
 * CoverageTarget — Identifies individual coverage elements (line, node, branch, function, module).
 */

export const COVERAGE_TARGET_TYPES = Object.freeze({
    LINE: 'LINE',
    CFG_NODE: 'CFG_NODE',
    CFG_EDGE: 'CFG_EDGE',
    BRANCH: 'BRANCH',
    FUNCTION: 'FUNCTION',
    MODULE: 'MODULE',
    EXCEPTION: 'EXCEPTION',
});

export class CoverageTarget {
    /**
     * @param {object} params
     * @param {string} params.type - One of COVERAGE_TARGET_TYPES
     * @param {string|number} params.id
     * @param {string} [params.fileId='main.py']
     * @param {number|null} [params.line=null]
     * @param {object} [params.metadata={}]
     */
    constructor({
        type = COVERAGE_TARGET_TYPES.LINE,
        id,
        fileId = 'main.py',
        line = null,
        metadata = {},
    } = {}) {
        this.type = type;
        this.id = String(id);
        this.fileId = String(fileId);
        this.line = line !== null ? Number(line) : null;
        this.metadata = Object.freeze({ ...metadata });
        Object.freeze(this);
    }

    toJSON() {
        return {
            type: this.type,
            id: this.id,
            fileId: this.fileId,
            line: this.line,
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new CoverageTarget(json);
    }
}
