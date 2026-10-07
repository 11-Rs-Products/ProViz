/**
 * BernoulliModel — Models binary properties (e.g. holds vs violates, pass vs fail).
 */

import { ProbabilityDistribution } from './ProbabilityDistribution.js';
import { ProbabilityInterval } from './ProbabilityInterval.js';

export class BernoulliModel extends ProbabilityDistribution {
    constructor({ successes = 0, failures = 0, alphaPrior = 1.0, betaPrior = 1.0 } = {}) {
        super('bernoulli');
        this.successes = Number(successes) || 0;
        this.failures = Number(failures) || 0;
        this.alphaPrior = Number(alphaPrior) || 1.0;
        this.betaPrior = Number(betaPrior) || 1.0;

        this.totalSamples = this.successes + this.failures;
        this.alphaPosterior = this.alphaPrior + this.successes;
        this.betaPosterior = this.betaPrior + this.failures;

        this.mean = this.alphaPosterior / (this.alphaPosterior + this.betaPosterior);
        this.variance = (this.alphaPosterior * this.betaPosterior) /
            (Math.pow(this.alphaPosterior + this.betaPosterior, 2) * (this.alphaPosterior + this.betaPosterior + 1));

        Object.freeze(this);
    }

    observe(success = true) {
        return new BernoulliModel({
            successes: this.successes + (success ? 1 : 0),
            failures: this.failures + (success ? 0 : 1),
            alphaPrior: this.alphaPrior,
            betaPrior: this.betaPrior,
        });
    }

    probabilityOf(outcome) {
        return outcome ? this.mean : (1.0 - this.mean);
    }

    getCredibleInterval(confidence = 0.95) {
        const stdDev = Math.sqrt(this.variance);
        const z = confidence === 0.99 ? 2.576 : (confidence === 0.90 ? 1.645 : 1.96);
        const lower = Math.max(0, this.mean - z * stdDev);
        const upper = Math.min(1, this.mean + z * stdDev);
        return new ProbabilityInterval({
            lower,
            upper,
            point: this.mean,
            confidenceLevel: confidence,
        });
    }

    toJSON() {
        return {
            type: this.type,
            successes: this.successes,
            failures: this.failures,
            alphaPrior: this.alphaPrior,
            betaPrior: this.betaPrior,
            mean: this.mean,
            variance: this.variance,
            totalSamples: this.totalSamples,
        };
    }

    static fromJSON(json) {
        if (!json) return new BernoulliModel();
        return new BernoulliModel(json);
    }
}
