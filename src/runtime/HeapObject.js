/**
 * HeapObject — Represents a discrete node on the runtime heap with a stable identity.
 *
 * Supported object types:
 *  - 'list': Ordered elements
 *  - 'dict': Key-value entries
 *  - 'set': Unique elements
 *  - 'tuple': Immutable sequence of elements
 *  - 'instance': Class instance with named fields/attributes
 */

export class HeapObject {
    /**
     * @param {object} params
     * @param {string} params.id - Stable object ID (e.g. 'obj_1')
     * @param {string} params.type - 'list' | 'dict' | 'set' | 'tuple' | 'instance' | class name
     * @param {string} [params.className] - Class name for user-defined instances
     * @param {Array} [params.elements] - Elements for lists, sets, tuples
     * @param {Array} [params.entries] - Key-value pairs for dicts [{ key, value }]
     * @param {object} [params.fields] - Attribute map for instances { [name]: value }
     */
    constructor({
        id,
        type = 'object',
        className = null,
        elements = [],
        entries = [],
        fields = {},
    }) {
        this.id = id;
        this.type = type;
        this.className = className || (type === 'instance' ? 'Object' : type);
        this.elements = Array.isArray(elements) ? [...elements] : [];
        this.entries = Array.isArray(entries) ? [...entries] : [];
        this.fields = { ...fields };
    }

    /**
     * Extracts all outbound reference object IDs held by this heap object.
     * @returns {string[]} Array of referenced objectIds
     */
    getOutboundReferences() {
        const refs = new Set();

        const checkVal = val => {
            if (val && typeof val === 'object' && val.kind === 'reference' && val.objectId) {
                refs.add(val.objectId);
            }
        };

        if (this.type === 'list' || this.type === 'tuple' || this.type === 'set') {
            this.elements.forEach(checkVal);
        } else if (this.type === 'dict') {
            this.entries.forEach(entry => {
                checkVal(entry.key);
                checkVal(entry.value);
            });
        } else {
            Object.values(this.fields).forEach(checkVal);
        }

        return Array.from(refs);
    }

    equals(other) {
        if (!other || !(other instanceof HeapObject)) return false;
        if (this.id !== other.id || this.type !== other.type || this.className !== other.className) {
            return false;
        }
        if (JSON.stringify(this.elements) !== JSON.stringify(other.elements)) return false;
        if (JSON.stringify(this.entries) !== JSON.stringify(other.entries)) return false;
        if (JSON.stringify(this.fields) !== JSON.stringify(other.fields)) return false;
        return true;
    }

    clone() {
        return new HeapObject({
            id: this.id,
            type: this.type,
            className: this.className,
            elements: this.elements.map(e => (e && typeof e === 'object' ? { ...e } : e)),
            entries: this.entries.map(e => ({ key: { ...e.key }, value: { ...e.value } })),
            fields: { ...this.fields },
        });
    }

    toJSON() {
        const out = {
            id: this.id,
            type: this.type,
            className: this.className,
        };

        if (this.type === 'list' || this.type === 'tuple' || this.type === 'set') {
            out.elements = this.elements;
        } else if (this.type === 'dict') {
            out.entries = this.entries;
        } else {
            out.fields = this.fields;
        }

        return out;
    }
}
