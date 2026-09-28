/**
 * ObjectShape — Structural metadata for class instances and object fields.
 */

export class ObjectShape {
    /**
     * @param {object} params
     * @param {string} [params.className='Object']
     * @param {Map<string, *>|object} [params.fields]
     * @param {boolean} [params.unknownFields=false]
     * @param {string|null} [params.moduleId=null]
     */
    constructor({
        className = 'Object',
        fields = {},
        unknownFields = false,
        moduleId = null,
    } = {}) {
        this.className = className;
        this.fields = new Map();
        if (fields instanceof Map) {
            for (const [k, v] of fields.entries()) this.fields.set(k, v);
        } else if (typeof fields === 'object' && fields !== null) {
            for (const [k, v] of Object.entries(fields)) this.fields.set(k, v);
        }
        this.unknownFields = unknownFields;
        this.moduleId = moduleId;
    }

    setField(name, abstractValue) {
        this.fields.set(name, abstractValue);
        return this;
    }

    getField(name) {
        return this.fields.get(name) || null;
    }

    hasField(name) {
        return this.fields.has(name);
    }

    getFieldNames() {
        return Array.from(this.fields.keys()).sort();
    }

    join(other) {
        if (!other || !(other instanceof ObjectShape)) return this;
        const joinedFields = new Map();
        for (const [k, v] of this.fields.entries()) {
            if (other.fields.has(k)) {
                joinedFields.set(k, v.join ? v.join(other.fields.get(k)) : v);
            } else {
                joinedFields.set(k, v);
            }
        }
        for (const [k, v] of other.fields.entries()) {
            if (!joinedFields.has(k)) {
                joinedFields.set(k, v);
            }
        }
        return new ObjectShape({
            className: this.className === other.className ? this.className : 'Object',
            fields: joinedFields,
            unknownFields: this.unknownFields || other.unknownFields,
            moduleId: this.moduleId,
        });
    }

    toJSON() {
        const fieldsObj = {};
        for (const [k, v] of this.fields.entries()) {
            fieldsObj[k] = v && v.toJSON ? v.toJSON() : v;
        }
        return {
            className: this.className,
            fields: fieldsObj,
            unknownFields: this.unknownFields,
            moduleId: this.moduleId,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new ObjectShape(json);
    }
}
