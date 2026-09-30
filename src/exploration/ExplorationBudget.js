export class ExplorationBudget {
    /**
     * @param {object} [params]
     * @param {number} [params.maxIterations=1000]
     * @param {number} [params.maxTests=1000]
     * @param {number} [params.maxExecutions=5000]
     * @param {number} [params.maxGenerationSteps=10000]
     * @param {number} [params.maxShrinkSteps=50]
     * @param {number} [params.maxTimeMs=10000]
     * @param {number} [params.maxDepth=5]
     * @param {number} [params.maxInputSize=100]
     */
    constructor({
        maxIterations = 1000,
        maxTests = 1000,
        maxExecutions = 5000,
        maxGenerationSteps = 10000,
        maxShrinkSteps = 50,
        maxTimeMs = 10000,
        maxDepth = 5,
        maxInputSize = 100,
    } = {}) {
        this.maxIterations = Number(maxIterations);
        this.currentIterations = 0;
        this.maxTests = Number(maxTests);
        this.maxExecutions = Number(maxExecutions);
        this.maxGenerationSteps = Number(maxGenerationSteps);
        this.maxShrinkSteps = Number(maxShrinkSteps);
        this.maxTimeMs = Number(maxTimeMs);
        this.maxDepth = Number(maxDepth);
        this.maxInputSize = Number(maxInputSize);
    }

    consumeIteration(count = 1) {
        this.currentIterations += count;
    }

    isExhausted() {
        return this.currentIterations >= this.maxIterations;
    }

    toJSON() {
        return {
            maxIterations: this.maxIterations,
            currentIterations: this.currentIterations,
            maxTests: this.maxTests,
            maxExecutions: this.maxExecutions,
            maxGenerationSteps: this.maxGenerationSteps,
            maxShrinkSteps: this.maxShrinkSteps,
            maxTimeMs: this.maxTimeMs,
            maxDepth: this.maxDepth,
            maxInputSize: this.maxInputSize,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new ExplorationBudget(json);
    }
}
