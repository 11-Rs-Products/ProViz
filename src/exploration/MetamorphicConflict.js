/**
 * MetamorphicConflict — Represents a conflict where candidate metamorphic transformations contradict observations.
 */

export class MetamorphicConflict {
    /**
     * @param {object} params
     * @param {string} params.relationId
     * @param {any} params.seedInput
     * @param {any} params.baselineOutput
     * @param {any} params.transformedOutput
     * @param {string} [params.reason='']
     */
    constructor({
        relationId,
        seedInput,
        baselineOutput,
        transformedOutput,
        reason = '',
    } = {}) {
        this.relationId = String(relationId || '');
        this.seedInput = seedInput;
        this.baselineOutput = baselineOutput;
        this.transformedOutput = transformedOutput;
        this.reason = String(reason || '');
        Object.freeze(this);
    }

    toJSON() {
        return {
            relationId: this.relationId,
            seedInput: this.seedInput,
            baselineOutput: this.baselineOutput,
            transformedOutput: this.transformedOutput,
            reason: this.reason,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new MetamorphicConflict(json);
    }
}
