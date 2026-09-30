/**
 * BoundaryModel — Collection of boundary points discovered for a target function or parameter.
 */

import { BoundaryPoint } from './BoundaryPoint.js';

export class BoundaryModel {
    /**
     * @param {object} params
     * @param {string} params.target
     * @param {Array<BoundaryPoint>} [params.points=[]]
     */
    constructor({
        target,
        points = [],
    } = {}) {
        this.target = String(target || '');
        this.points = Object.freeze(points.map(p => p instanceof BoundaryPoint ? p : BoundaryPoint.fromJSON(p)));
        Object.freeze(this);
    }

    get values() {
        return this.points.map(p => p.value);
    }

    toJSON() {
        return {
            target: this.target,
            points: this.points.map(p => p.toJSON()),
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new BoundaryModel(json);
    }
}
