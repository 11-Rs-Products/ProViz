/**
 * GeneratorInput — Specification of generator target parameter, type, and bounds.
 */

export class GeneratorInput {
    /**
     * @param {object} params
     * @param {string} params.name
     * @param {string} [params.type='any']
     * @param {Array<any>} [params.domain=[]]
     * @param {object} [params.bounds={}]
     */
    constructor({
        name,
        type = 'any',
        domain = [],
        bounds = {},
    } = {}) {
        this.name = String(name || '');
        this.type = String(type);
        this.domain = Object.freeze([...domain]);
        this.bounds = Object.freeze({ ...bounds });
        Object.freeze(this);
    }

    toJSON() {
        return {
            name: this.name,
            type: this.type,
            domain: this.domain,
            bounds: this.bounds,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new GeneratorInput(json);
    }
}
