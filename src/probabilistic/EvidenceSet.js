/**
 * EvidenceSet — Immutable indexed collection of Evidence objects.
 */

import { Evidence } from './Evidence.js';
import { EVIDENCE_POLARITIES } from './EvidencePolarity.js';

export class EvidenceSet {
    constructor(param = {}) {
        let items = [];
        if (Array.isArray(param)) {
            items = param;
        } else if (param && Array.isArray(param.items)) {
            items = param.items;
        }

        this._items = Object.freeze(items.map(i => i instanceof Evidence ? i : new Evidence(i)));
        this._byId = new Map();
        this._bySubject = new Map();
        this._byKind = new Map();
        this._byPolarity = new Map();

        for (const item of this._items) {
            this._byId.set(item.id, item);
            
            if (!this._bySubject.has(item.subject)) {
                this._bySubject.set(item.subject, []);
            }
            this._bySubject.get(item.subject).push(item);

            if (!this._byKind.has(item.kind)) {
                this._byKind.set(item.kind, []);
            }
            this._byKind.get(item.kind).push(item);

            if (!this._byPolarity.has(item.polarity)) {
                this._byPolarity.set(item.polarity, []);
            }
            this._byPolarity.get(item.polarity).push(item);
        }

        Object.freeze(this);
    }

    get size() {
        return this._items.length;
    }

    getAll() {
        return this._items;
    }

    get(id) {
        return this._byId.get(String(id)) || null;
    }

    getById(id) {
        return this.get(id);
    }

    getBySubject(subject) {
        return this._bySubject.get(String(subject)) || [];
    }

    getByKind(kind) {
        return this._byKind.get(String(kind)) || [];
    }

    getByPolarity(polarity) {
        return this._byPolarity.get(String(polarity)) || [];
    }

    getSupporting(subject) {
        return this.getBySubject(subject).filter(e => e.polarity === EVIDENCE_POLARITIES.SUPPORTS);
    }

    getRefuting(subject) {
        return this.getBySubject(subject).filter(e => e.polarity === EVIDENCE_POLARITIES.REFUTES);
    }

    getConflicting(subject) {
        return this.getBySubject(subject).filter(e => e.polarity === EVIDENCE_POLARITIES.CONFLICTS);
    }

    add(evidence) {
        const item = evidence instanceof Evidence ? evidence : new Evidence(evidence);
        const filtered = this._items.filter(i => i.id !== item.id);
        return new EvidenceSet({ items: [...filtered, item] });
    }

    addAll(evidenceList = []) {
        const newItems = evidenceList.map(i => i instanceof Evidence ? i : new Evidence(i));
        const newIds = new Set(newItems.map(i => i.id));
        const retained = this._items.filter(i => !newIds.has(i.id));
        return new EvidenceSet({ items: [...retained, ...newItems] });
    }

    filter(predicate) {
        return new EvidenceSet({ items: this._items.filter(predicate) });
    }

    toJSON() {
        return {
            items: this._items.map(i => i.toJSON()),
        };
    }

    static fromJSON(json) {
        if (!json || !Array.isArray(json.items)) return new EvidenceSet();
        return new EvidenceSet({
            items: json.items.map(i => Evidence.fromJSON(i)),
        });
    }
}
