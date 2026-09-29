/**
 * RepairValidation — Multi-layered verification state for a candidate repair.
 */

export class RepairValidation {
    /**
     * @param {object} params
     * @param {boolean} [params.syntax=true]
     * @param {object|null} [params.staticAnalysis=null]
     * @param {object|null} [params.symbolic=null]
     * @param {object|null} [params.concolic=null]
     * @param {object|null} [params.regression=null]
     * @param {object|null} [params.contract=null]
     * @param {object|null} [params.behavioral=null]
     * @param {string} [params.status='VALIDATED']
     */
    constructor({
        syntax = true,
        staticAnalysis = null,
        symbolic = null,
        concolic = null,
        regression = null,
        contract = null,
        behavioral = null,
        status = 'VALIDATED',
    } = {}) {
        this.syntax = Boolean(syntax);
        this.staticAnalysis = staticAnalysis ? Object.freeze({ ...staticAnalysis }) : null;
        this.symbolic = symbolic ? Object.freeze({ ...symbolic }) : null;
        this.concolic = concolic ? Object.freeze({ ...concolic }) : null;
        this.regression = regression ? Object.freeze({ ...regression }) : null;
        this.contract = contract ? Object.freeze({ ...contract }) : null;
        this.behavioral = behavioral ? Object.freeze({ ...behavioral }) : null;
        this.status = status;
        Object.freeze(this);
    }

    get isValidated() {
        return this.status === 'VALIDATED';
    }

    toJSON() {
        return {
            syntax: this.syntax,
            staticAnalysis: this.staticAnalysis,
            symbolic: this.symbolic,
            concolic: this.concolic,
            regression: this.regression,
            contract: this.contract,
            behavioral: this.behavioral,
            status: this.status,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new RepairValidation(json);
    }
}
