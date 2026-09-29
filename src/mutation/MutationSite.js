/**
 * MutationSite — Represents a candidate source code site amenable to semantic mutation.
 */

export class MutationSite {
    /**
     * @param {object} params
     * @param {string} [params.siteId=null]
     * @param {string} [params.fileId='main.py']
     * @param {object} params.sourceLocation
     * @param {object|null} [params.astNode=null]
     * @param {Array<string>} [params.operatorKinds=[]]
     * @param {string} params.originalValue
     * @param {Array<object>} [params.dependencies=[]]
     * @param {object|null} [params.coverage=null]
     */
    constructor({
        siteId = null,
        fileId = 'main.py',
        sourceLocation = { line: 1, col: 1 },
        astNode = null,
        operatorKinds = [],
        originalValue = '',
        dependencies = [],
        coverage = null,
    } = {}) {
        this.fileId = String(fileId);
        this.sourceLocation = Object.freeze({ ...sourceLocation });
        this.astNode = astNode ? Object.freeze({ ...astNode }) : null;
        this.operatorKinds = Object.freeze([...operatorKinds]);
        this.originalValue = String(originalValue ?? '');
        this.dependencies = Object.freeze([...dependencies]);
        this.coverage = coverage ? Object.freeze({ ...coverage }) : null;

        const hash = MutationSite.computeHash(JSON.stringify({
            file: this.fileId,
            loc: this.sourceLocation,
            val: this.originalValue,
            ops: this.operatorKinds,
        }));
        this.siteId = siteId || `site_${hash}`;
        Object.freeze(this);
    }

    static computeHash(str) {
        let hash = 5381;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) + hash) + str.charCodeAt(i);
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16);
    }

    toJSON() {
        return {
            siteId: this.siteId,
            fileId: this.fileId,
            sourceLocation: this.sourceLocation,
            astNode: this.astNode,
            operatorKinds: this.operatorKinds,
            originalValue: this.originalValue,
            dependencies: this.dependencies,
            coverage: this.coverage,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new MutationSite(json);
    }
}
