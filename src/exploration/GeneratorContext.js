/**
 * GeneratorContext — Execution context, seed, step counter, and constraints for input generation.
 */

export class GeneratorContext {
    /**
     * @param {object} params
     * @param {number} [params.seed=42]
     * @param {number} [params.step=0]
     * @param {number} [params.maxDepth=5]
     * @param {number} [params.maxSize=50]
     * @param {object} [params.constraints={}]
     * @param {object} [params.metadata={}]
     */
    constructor({
        seed = 42,
        step = 0,
        maxDepth = 5,
        maxSize = 50,
        constraints = {},
        metadata = {},
    } = {}) {
        this.seed = Number(seed) || 42;
        this.step = Number(step) || 0;
        this.maxDepth = Number(maxDepth) || 5;
        this.maxSize = Number(maxSize) || 50;
        this.constraints = Object.freeze({ ...constraints });
        this.metadata = Object.freeze({ ...metadata });
        Object.freeze(this);
    }

    next(stepIncrement = 1) {
        return new GeneratorContext({
            seed: this.seed,
            step: this.step + stepIncrement,
            maxDepth: this.maxDepth,
            maxSize: this.maxSize,
            constraints: this.constraints,
            metadata: this.metadata,
        });
    }

    withConstraints(newConstraints) {
        return new GeneratorContext({
            seed: this.seed,
            step: this.step,
            maxDepth: this.maxDepth,
            maxSize: this.maxSize,
            constraints: { ...this.constraints, ...newConstraints },
            metadata: this.metadata,
        });
    }

    /**
     * Returns a deterministic pseudo-random float in [0, 1) based on seed and step.
     */
    random(offset = 0) {
        const s = (this.seed * 9301 + (this.step + offset) * 49297 + 233280) % 233280;
        return s / 233280;
    }

    toJSON() {
        return {
            seed: this.seed,
            step: this.step,
            maxDepth: this.maxDepth,
            maxSize: this.maxSize,
            constraints: this.constraints,
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new GeneratorContext(json);
    }
}
