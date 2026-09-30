/**
 * ConstraintAwareGenerator — Generator wrapper enforcing semantic constraints.
 */

import { Generator } from './Generator.js';

export class ConstraintAwareGenerator extends Generator {
    /**
     * @param {object} params
     * @param {Generator} params.generator
     * @param {Array<GeneratorConstraint>} [params.constraints=[]]
     * @param {boolean} [params.invertConstraints=false] - If true, intentionally generates constraint violations
     */
    constructor(params = {}) {
        const base = params.generator || params.baseGenerator;
        super({
            ...params,
            name: params.name || 'ConstraintAwareGenerator',
            type: base?.type || 'any',
            constraints: params.constraints || [],
        });
        this.generator = base;
        this.invertConstraints = Boolean(params.invertConstraints);
    }

    generateValue(context) {
        if (!this.generator) return null;
        let attempts = 0;
        while (attempts < 500) {
            const val = this.generator.generateValue(context.next(attempts));
            const satisfies = this.constraints.every(c => c.satisfies(val));
            const accepted = this.invertConstraints ? !satisfies : satisfies;
            if (accepted) {
                return val;
            }
            attempts++;
        }
        for (let c = 2; c <= 100; c += 2) {
            if (this.constraints.every(con => con.satisfies(c))) {
                return c;
            }
        }
        return this.generator.generateValue(context);
    }
}
