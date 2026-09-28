/**
 * AbstractType — Universal language-neutral abstract type representation.
 */

export const TYPE_KINDS = Object.freeze({
    UNKNOWN: 'unknown',
    NONE: 'none',
    BOOL: 'bool',
    INT: 'int',
    FLOAT: 'float',
    COMPLEX: 'complex',
    STRING: 'string',
    BYTES: 'bytes',
    LIST: 'list',
    TUPLE: 'tuple',
    SET: 'set',
    DICT: 'dict',
    FUNCTION: 'function',
    CLASS: 'class',
    INSTANCE: 'instance',
    ITERATOR: 'iterator',
    GENERATOR: 'generator',
    MODULE: 'module',
    EXCEPTION: 'exception',
    OPAQUE: 'opaque',
});

export class AbstractType {
    /**
     * @param {object} params
     * @param {string} params.kind
     * @param {string} [params.name]
     * @param {Array<AbstractType>} [params.parameters=[]]
     * @param {string} [params.moduleId=null]
     * @param {object} [params.metadata={}]
     */
    constructor({
        kind = TYPE_KINDS.UNKNOWN,
        name = null,
        parameters = [],
        moduleId = null,
        metadata = {},
    } = {}) {
        this.kind = kind;
        this.name = name || kind;
        this.parameters = Array.isArray(parameters) ? parameters.map(p => p instanceof AbstractType ? p : new AbstractType(p)) : [];
        this.moduleId = moduleId;
        this.metadata = Object.freeze({ ...metadata });
    }

    // Static Factory Helpers
    static unknown() { return new AbstractType({ kind: TYPE_KINDS.UNKNOWN }); }
    static none() { return new AbstractType({ kind: TYPE_KINDS.NONE }); }
    static bool() { return new AbstractType({ kind: TYPE_KINDS.BOOL }); }
    static int() { return new AbstractType({ kind: TYPE_KINDS.INT }); }
    static float() { return new AbstractType({ kind: TYPE_KINDS.FLOAT }); }
    static string() { return new AbstractType({ kind: TYPE_KINDS.STRING }); }
    static bytes() { return new AbstractType({ kind: TYPE_KINDS.BYTES }); }
    static list(elemType = null) {
        return new AbstractType({
            kind: TYPE_KINDS.LIST,
            parameters: elemType ? [elemType] : [],
        });
    }
    static dict(keyType = null, valType = null) {
        return new AbstractType({
            kind: TYPE_KINDS.DICT,
            parameters: (keyType && valType) ? [keyType, valType] : [],
        });
    }
    static tuple(elemTypes = []) {
        return new AbstractType({
            kind: TYPE_KINDS.TUPLE,
            parameters: elemTypes,
        });
    }
    static set(elemType = null) {
        return new AbstractType({
            kind: TYPE_KINDS.SET,
            parameters: elemType ? [elemType] : [],
        });
    }
    static function(name = 'anonymous', params = [], retType = null) {
        return new AbstractType({
            kind: TYPE_KINDS.FUNCTION,
            name,
            parameters: retType ? [...params, retType] : params,
        });
    }
    static instance(className, moduleId = null) {
        return new AbstractType({
            kind: TYPE_KINDS.INSTANCE,
            name: className,
            moduleId,
        });
    }

    isNumeric() {
        return this.kind === TYPE_KINDS.INT || this.kind === TYPE_KINDS.FLOAT || this.kind === TYPE_KINDS.COMPLEX;
    }

    isContainer() {
        return this.kind === TYPE_KINDS.LIST || this.kind === TYPE_KINDS.TUPLE || this.kind === TYPE_KINDS.SET || this.kind === TYPE_KINDS.DICT;
    }

    equals(other) {
        if (!other || !(other instanceof AbstractType)) return false;
        if (this.kind !== other.kind || this.name !== other.name || this.moduleId !== other.moduleId) return false;
        if (this.parameters.length !== other.parameters.length) return false;
        for (let i = 0; i < this.parameters.length; i++) {
            if (!this.parameters[i].equals(other.parameters[i])) return false;
        }
        return true;
    }

    toString() {
        if (this.parameters.length === 0) return this.name || this.kind;
        const paramStr = this.parameters.map(p => p.toString()).join(', ');
        return `${this.name || this.kind}[${paramStr}]`;
    }

    toJSON() {
        return {
            kind: this.kind,
            name: this.name,
            parameters: this.parameters.map(p => p.toJSON()),
            moduleId: this.moduleId,
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json || typeof json !== 'object') return AbstractType.unknown();
        return new AbstractType({
            kind: json.kind,
            name: json.name,
            parameters: (json.parameters || []).map(p => AbstractType.fromJSON(p)),
            moduleId: json.moduleId,
            metadata: json.metadata,
        });
    }
}
