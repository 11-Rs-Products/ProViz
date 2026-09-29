/**
 * Symbol — Canonical symbolic identifier representing an unknown or dynamic abstract value.
 */

import { SYMBOL_KINDS } from './SymbolKind.js';

export class Symbol {
    /**
     * @param {object} params
     * @param {string} [params.id]
     * @param {string} params.name - Logical name (e.g. 'x', 'arg0')
     * @param {string} [params.kind] - SYMBOL_KINDS member
     * @param {object} [params.sourceLocation]
     * @param {string|null} [params.ssaValueId]
     * @param {object|null} [params.typeInformation]
     * @param {string|null} [params.origin]
     * @param {object} [params.metadata]
     */
    constructor({
        id = null,
        name,
        kind = SYMBOL_KINDS.UNKNOWN,
        sourceLocation = null,
        ssaValueId = null,
        typeInformation = null,
        origin = null,
        metadata = {},
    }) {
        this.name = String(name || 'sym');
        this.kind = kind || SYMBOL_KINDS.UNKNOWN;
        this.sourceLocation = sourceLocation ? Object.freeze({ ...sourceLocation }) : null;
        this.ssaValueId = ssaValueId;
        this.typeInformation = typeInformation ? Object.freeze({ ...typeInformation }) : null;
        this.origin = origin;
        this.metadata = Object.freeze({ ...metadata });

        const cleanName = this.name.replace(/[^a-zA-Z0-9_]/g, '_');
        const hashSeed = `${this.kind}:${this.name}:${this.ssaValueId || ''}:${this.origin || ''}`;
        this.id = id || `sym_${this.kind.toLowerCase()}_${cleanName}_${Symbol.computeHash(hashSeed)}`;

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

    equals(other) {
        if (!other || !(other instanceof Symbol)) return false;
        return this.id === other.id;
    }

    toString() {
        return this.name;
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            kind: this.kind,
            sourceLocation: this.sourceLocation,
            ssaValueId: this.ssaValueId,
            typeInformation: this.typeInformation,
            origin: this.origin,
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new Symbol(json);
    }
}
