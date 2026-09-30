/**
 * GeneratorOutput — Output value, metadata, generation path, and novelty features produced by a Generator.
 */

export class GeneratorOutput {
    /**
     * @param {object} params
     * @param {any} params.value
     * @param {string} params.generatorId
     * @param {number} params.seed
     * @param {number} params.step
     * @param {Array<string>} [params.generationPath=[]]
     * @param {Array<string>} [params.noveltyFeatures=[]]
     * @param {object} [params.metadata={}]
     */
    constructor({
        value,
        generatorId,
        seed = 42,
        step = 0,
        generationPath = [],
        noveltyFeatures = [],
        metadata = {},
    } = {}) {
        this.value = value;
        this.generatorId = String(generatorId || '');
        this.seed = Number(seed);
        this.step = Number(step);
        this.generationPath = Object.freeze([...generationPath]);
        this.noveltyFeatures = Object.freeze([...noveltyFeatures]);
        this.metadata = Object.freeze({ ...metadata });

        const hashPayload = JSON.stringify({
            generatorId: this.generatorId,
            seed: this.seed,
            step: this.step,
            value: this.value,
        });
        this.id = `gen_out_${GeneratorOutput.computeHash(hashPayload)}`;
        Object.freeze(this);
    }

    static computeHash(str) {
        let hash = 5381;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) + hash) + str.charCodeAt(i);
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16);
    }

    toJSON() {
        return {
            id: this.id,
            value: this.value,
            generatorId: this.generatorId,
            seed: this.seed,
            step: this.step,
            generationPath: this.generationPath,
            noveltyFeatures: this.noveltyFeatures,
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new GeneratorOutput(json);
    }
}
