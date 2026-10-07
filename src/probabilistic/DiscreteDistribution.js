/**
 * DiscreteDistribution — Maps discrete values to normalized probabilities.
 */

import { ProbabilityDistribution } from './ProbabilityDistribution.js';

export class DiscreteDistribution extends ProbabilityDistribution {
    constructor(probabilityMap = {}) {
        super('discrete');
        const entries = probabilityMap instanceof Map
            ? Array.from(probabilityMap.entries())
            : Object.entries(probabilityMap);
        let sum = entries.reduce((acc, [, p]) => acc + Number(p), 0);
        sum = sum > 0 ? sum : 1;

        const normalized = {};
        for (const [key, val] of entries) {
            normalized[key] = Number(val) / sum;
        }

        this.distribution = Object.freeze(normalized);
        Object.freeze(this);
    }

    probabilityOf(key) {
        return this.distribution[String(key)] || 0.0;
    }

    probability(key) {
        return this.probabilityOf(key);
    }

    sample(randomFn = Math.random) {
        const r = randomFn();
        let cumulative = 0;
        for (const [key, p] of Object.entries(this.distribution)) {
            cumulative += p;
            if (r <= cumulative) return key;
        }
        const keys = Object.keys(this.distribution);
        return keys.length > 0 ? keys[keys.length - 1] : null;
    }

    toJSON() {
        return {
            type: this.type,
            distribution: this.distribution,
        };
    }

    static fromJSON(json) {
        if (!json) return new DiscreteDistribution();
        return new DiscreteDistribution(json.distribution || json);
    }
}
