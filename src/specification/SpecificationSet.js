/**
 * SpecificationSet — Immutable indexed collection of specifications.
 */

import { Specification } from './Specification.js';

export class SpecificationSet {
    /**
     * @param {Array<Specification>} [specifications=[]]
     */
    constructor(specifications = []) {
        this.specs = Object.freeze(specifications.map(s => s instanceof Specification ? s : Specification.fromJSON(s)));
        
        const byId = new Map();
        const byKind = new Map();
        const byStatus = new Map();
        const bySubject = new Map();

        for (const spec of this.specs) {
            byId.set(spec.id, spec);

            if (!byKind.has(spec.kind)) byKind.set(spec.kind, []);
            byKind.get(spec.kind).push(spec);

            if (!byStatus.has(spec.status)) byStatus.set(spec.status, []);
            byStatus.get(spec.status).push(spec);

            const subjectKey = spec.subject.name || spec.subject.functionId || spec.subject.id || JSON.stringify(spec.subject);
            if (!bySubject.has(subjectKey)) bySubject.set(subjectKey, []);
            bySubject.get(subjectKey).push(spec);
        }

        this._byId = byId;
        this._byKind = byKind;
        this._byStatus = byStatus;
        this._bySubject = bySubject;

        Object.freeze(this);
    }

    get size() {
        return this.specs.length;
    }

    get(id) {
        return this._byId.get(id) || null;
    }

    has(id) {
        return this._byId.has(id);
    }

    getByKind(kind) {
        return Object.freeze([...(this._byKind.get(kind) || [])]);
    }

    getByStatus(status) {
        return Object.freeze([...(this._byStatus.get(status) || [])]);
    }

    getBySubject(subjectKey) {
        return Object.freeze([...(this._bySubject.get(subjectKey) || [])]);
    }

    add(spec) {
        if (this.has(spec.id)) return this;
        return new SpecificationSet([...this.specs, spec]);
    }

    addAll(specs) {
        const newSpecs = [...this.specs];
        for (const s of specs) {
            if (!this.has(s.id)) {
                newSpecs.push(s);
            }
        }
        return new SpecificationSet(newSpecs);
    }

    filter(predicate) {
        return new SpecificationSet(this.specs.filter(predicate));
    }

    map(fn) {
        return this.specs.map(fn);
    }

    [Symbol.iterator]() {
        return this.specs[Symbol.iterator]();
    }

    toJSON() {
        return {
            specifications: this.specs.map(s => s.toJSON()),
        };
    }

    static fromJSON(json) {
        if (!json || !Array.isArray(json.specifications)) {
            return new SpecificationSet([]);
        }
        return new SpecificationSet(json.specifications.map(s => Specification.fromJSON(s)));
    }
}
