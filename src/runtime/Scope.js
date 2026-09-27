/**
 * Scope — Represents a variable environment scope (global or local).
 */

export class Scope {
    /**
     * @param {string} [type='local'] - 'global' | 'local'
     * @param {object} [bindings={}] - Variable bindings map { [name]: Value }
     */
    constructor(type = 'local', bindings = {}) {
        this.type = type;
        this.bindings = { ...bindings };
    }

    setBinding(name, value) {
        this.bindings[name] = value;
    }

    getBinding(name) {
        return this.bindings[name] ?? null;
    }

    hasBinding(name) {
        return Object.prototype.hasOwnProperty.call(this.bindings, name);
    }

    removeBinding(name) {
        delete this.bindings[name];
    }

    getEntries() {
        return Object.entries(this.bindings);
    }

    equals(otherScope) {
        if (!otherScope || !(otherScope instanceof Scope)) return false;
        if (this.type !== otherScope.type) return false;
        const keysA = Object.keys(this.bindings);
        const keysB = Object.keys(otherScope.bindings);
        if (keysA.length !== keysB.length) return false;
        for (const k of keysA) {
            if (!Object.prototype.hasOwnProperty.call(otherScope.bindings, k)) return false;
            const vA = this.bindings[k];
            const vB = otherScope.bindings[k];
            if (JSON.stringify(vA) !== JSON.stringify(vB)) return false;
        }
        return true;
    }

    clone() {
        const cloned = new Scope(this.type);
        for (const [k, v] of Object.entries(this.bindings)) {
            cloned.bindings[k] = v && typeof v === 'object' ? { ...v } : v;
        }
        return cloned;
    }

    toJSON() {
        return {
            type: this.type,
            bindings: this.bindings,
        };
    }
}
