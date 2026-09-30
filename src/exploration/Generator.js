/**
 * Generator — Abstract base class for all deterministic value generators.
 */

import { GeneratorContext } from './GeneratorContext.js';
import { GeneratorOutput } from './GeneratorOutput.js';
import { GeneratorState } from './GeneratorState.js';

export class Generator {
    /**
     * @param {object} params
     * @param {string} [params.id]
     * @param {string} [params.name='Generator']
     * @param {string} [params.type='any']
     * @param {Array<GeneratorConstraint>} [params.constraints=[]]
     * @param {object} [params.metadata={}]
     */
    constructor({
        id = null,
        name = 'Generator',
        type = 'any',
        constraints = [],
        metadata = {},
    } = {}) {
        this.name = name;
        this.type = type;
        this.constraints = Object.freeze([...constraints]);
        this.metadata = Object.freeze({ ...metadata });
        this.state = new GeneratorState();

        const hashPayload = JSON.stringify({
            name: this.name,
            type: this.type,
            constraints: this.constraints.map(c => c.toJSON?.() || c),
        });
        this.id = id || `generator_${Generator.computeHash(hashPayload)}`;

        if (new.target === Generator) {
            Object.freeze(this);
        }
    }

    static computeHash(str) {
        let hash = 5381;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) + hash) + str.charCodeAt(i);
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16);
    }

    /**
     * Generates a raw value from the given context.
     * Must be implemented by subclasses.
     * @param {GeneratorContext} context
     * @returns {any}
     */
    generateValue(context) {
        throw new Error('generateValue must be implemented by subclass');
    }

    /**
     * Generates a wrapped GeneratorOutput ensuring constraint satisfaction.
     * @param {GeneratorContext} [context]
     * @returns {GeneratorOutput}
     */
    generate(context = new GeneratorContext()) {
        let currentCtx = context;
        let attempts = 0;
        let value = undefined;
        let satisfied = false;

        while (attempts < 20 && !satisfied) {
            value = this.generateValue(currentCtx);
            satisfied = this.constraints.every(c => c.satisfies(value));
            if (!satisfied) {
                currentCtx = currentCtx.next(1);
                attempts++;
            }
        }

        const noveltyFeatures = [
            `type:${typeof value}`,
            `val:${String(value)}`,
        ];

        return new GeneratorOutput({
            value,
            generatorId: this.id,
            seed: context.seed,
            step: currentCtx.step,
            generationPath: [this.name],
            noveltyFeatures,
        });
    }

    sample(context = new GeneratorContext(), count = 1) {
        const results = [];
        let curr = context;
        for (let i = 0; i < count; i++) {
            const out = this.generate(curr);
            results.push(out.value);
            curr = curr.next(1);
        }
        return results;
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            type: this.type,
            constraints: this.constraints.map(c => c.toJSON?.() || c),
            metadata: this.metadata,
        };
    }
}
