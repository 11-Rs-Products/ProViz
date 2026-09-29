/**
 * ValueModel — Models observed domain, range, type, and bounds of a variable or expression.
 */

export class ValueModel {
    /**
     * @param {object} params
     * @param {string} params.name
     * @param {Set<string>|Array<string>} [params.types=[]]
     * @param {number|null} [params.min=null]
     * @param {number|null} [params.max=null]
     * @param {boolean} [params.hasNull=false]
     * @param {Array<any>} [params.sampleValues=[]]
     */
    constructor({
        name,
        types = [],
        min = null,
        max = null,
        hasNull = false,
        sampleValues = [],
    } = {}) {
        this.name = String(name || '');
        this.types = Object.freeze([...new Set(types)]);
        this.min = min !== null ? Number(min) : null;
        this.max = max !== null ? Number(max) : null;
        this.hasNull = Boolean(hasNull);
        this.sampleValues = Object.freeze([...sampleValues]);
        Object.freeze(this);
    }

    observe(val) {
        const types = new Set(this.types);
        const samples = [...this.sampleValues];
        let hasNull = this.hasNull;
        let min = this.min;
        let max = this.max;

        if (val === null || val === undefined) {
            hasNull = true;
            types.add('None');
        } else {
            const t = typeof val;
            types.add(t);
            if (t === 'number' && !isNaN(val)) {
                min = min === null ? val : Math.min(min, val);
                max = max === null ? val : Math.max(max, val);
            }
        }

        if (samples.length < 20 && !samples.includes(val)) {
            samples.push(val);
        }

        return new ValueModel({
            name: this.name,
            types: [...types],
            min,
            max,
            hasNull,
            sampleValues: samples,
        });
    }

    toJSON() {
        return {
            name: this.name,
            types: this.types,
            min: this.min,
            max: this.max,
            hasNull: this.hasNull,
            sampleValues: this.sampleValues,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new ValueModel(json);
    }
}
