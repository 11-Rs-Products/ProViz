/**
 * SemanticChangeSet — Collection of detected SemanticChanges with indexing and query capabilities.
 */

import { SemanticChange } from './SemanticChange.js';

export class SemanticChangeSet {
    /**
     * @param {object} params
     * @param {string} [params.setId=null]
     * @param {Array<SemanticChange|object>} [params.changes=[]]
     * @param {object} [params.metadata={}]
     */
    constructor({
        setId = null,
        changes = [],
        metadata = {},
    } = {}) {
        const parsed = changes.map(c => c instanceof SemanticChange ? c : SemanticChange.fromJSON(c));
        this.changes = Object.freeze(parsed);
        this.metadata = Object.freeze({ ...metadata });

        this._changesById = new Map();
        this._changesByFile = new Map();
        this._changesByKind = new Map();
        this._changesBySymbol = new Map();
        this._changesByFunction = new Map();

        for (const change of this.changes) {
            this._changesById.set(change.id, change);

            if (change.fileId) {
                if (!this._changesByFile.has(change.fileId)) this._changesByFile.set(change.fileId, []);
                this._changesByFile.get(change.fileId).push(change);
            }

            if (!this._changesByKind.has(change.kind)) this._changesByKind.set(change.kind, []);
            this._changesByKind.get(change.kind).push(change);

            for (const sym of change.symbolIds) {
                if (!this._changesBySymbol.has(sym)) this._changesBySymbol.set(sym, []);
                this._changesBySymbol.get(sym).push(change);
            }

            for (const fn of change.functionIds) {
                if (!this._changesByFunction.has(fn)) this._changesByFunction.set(fn, []);
                this._changesByFunction.get(fn).push(change);
            }
        }

        const hash = SemanticChangeSet.computeHash(JSON.stringify(this.changes.map(c => c.id).sort()));
        this.setId = setId || `changeset_${hash}`;
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

    get size() {
        return this.changes.length;
    }

    get(id) {
        return this._changesById.get(String(id)) || null;
    }

    has(id) {
        return this._changesById.has(String(id));
    }

    getByFile(fileId) {
        return this._changesByFile.get(String(fileId)) || [];
    }

    getByKind(kind) {
        return this._changesByKind.get(String(kind)) || [];
    }

    getBySymbol(symbolId) {
        return this._changesBySymbol.get(String(symbolId)) || [];
    }

    getByFunction(functionId) {
        return this._changesByFunction.get(String(functionId)) || [];
    }

    filter(predicate) {
        return new SemanticChangeSet({
            changes: this.changes.filter(predicate),
            metadata: this.metadata,
        });
    }

    toJSON() {
        return {
            setId: this.setId,
            changes: this.changes.map(c => c.toJSON()),
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new SemanticChangeSet({
            setId: json.setId,
            changes: (json.changes || []).map(c => SemanticChange.fromJSON(c)),
            metadata: json.metadata,
        });
    }
}
