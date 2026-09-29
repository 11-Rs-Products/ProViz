/**
 * ConcolicCoverage — Tracks coverage progression across concolic exploration iterations.
 */

import { Coverage } from '../testing/Coverage.js';

export class ConcolicCoverage {
    /**
     * @param {object} [params]
     * @param {Coverage|object} [params.cumulativeCoverage]
     * @param {Array<object>} [params.history=[]]
     */
    constructor({
        cumulativeCoverage = new Coverage(),
        history = [],
    } = {}) {
        this.cumulativeCoverage = cumulativeCoverage instanceof Coverage ? cumulativeCoverage : Coverage.fromJSON(cumulativeCoverage);
        this.history = Object.freeze([...history]);
        Object.freeze(this);
    }

    recordIteration(pathCoverage, iterationIndex = 0) {
        const delta = pathCoverage.delta(this.cumulativeCoverage);
        const nextCumulative = this.cumulativeCoverage.union(pathCoverage);

        const entry = {
            iteration: iterationIndex,
            linesCovered: pathCoverage.lines.length,
            newLines: delta.newLines,
            lineGain: delta.lineGain,
        };

        return new ConcolicCoverage({
            cumulativeCoverage: nextCumulative,
            history: [...this.history, entry],
        });
    }

    toJSON() {
        return {
            cumulativeCoverage: this.cumulativeCoverage.toJSON(),
            history: this.history,
        };
    }

    static fromJSON(json) {
        if (!json) return new ConcolicCoverage();
        return new ConcolicCoverage({
            cumulativeCoverage: Coverage.fromJSON(json.cumulativeCoverage),
            history: json.history,
        });
    }
}
