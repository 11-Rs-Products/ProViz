/**
 * ProbabilityDistribution — Base abstract model for probability distributions.
 */

export class ProbabilityDistribution {
    constructor(type = 'generic') {
        this.type = type;
    }

    probabilityOf(outcome) {
        return 0;
    }

    sample(randomFn = Math.random) {
        return null;
    }

    getExpectedValue() {
        return 0;
    }

    getVariance() {
        return 0;
    }
}
