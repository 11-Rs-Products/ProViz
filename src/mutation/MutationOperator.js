/**
 * MutationOperator — Structural definition and transformation logic of a mutation operator.
 */

import { MUTATION_OPERATOR_KINDS } from './MutationOperatorKind.js';

export class MutationOperator {
    /**
     * @param {object} params
     * @param {string} params.operatorId
     * @param {string} params.name
     * @param {string} [params.category=MUTATION_OPERATOR_KINDS.ARITHMETIC]
     * @param {string} [params.description='']
     * @param {Array<string>} [params.languageSupport=['python']]
     * @param {Function|null} [params.applicability=null] - (node) => boolean
     * @param {Function|null} [params.transform=null] - (originalCode, node) => string
     */
    constructor({
        operatorId,
        name,
        category = MUTATION_OPERATOR_KINDS.ARITHMETIC,
        description = '',
        languageSupport = ['python'],
        applicability = null,
        transform = null,
    } = {}) {
        this.operatorId = String(operatorId);
        this.name = String(name);
        this.category = category;
        this.description = String(description || '');
        this.languageSupport = Object.freeze([...languageSupport]);
        this.applicability = applicability;
        this.transform = transform;
        Object.freeze(this);
    }

    canApply(node) {
        if (typeof this.applicability === 'function') {
            return this.applicability(node);
        }
        return true;
    }

    apply(originalCode, node) {
        if (typeof this.transform === 'function') {
            return this.transform(originalCode, node);
        }
        return originalCode;
    }

    toJSON() {
        return {
            operatorId: this.operatorId,
            name: this.name,
            category: this.category,
            description: this.description,
            languageSupport: this.languageSupport,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new MutationOperator(json);
    }
}
