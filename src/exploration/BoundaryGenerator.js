/**
 * BoundaryGenerator — Generates semantic boundary inputs prioritized by BoundaryModel.
 */

import { Generator } from './Generator.js';
import { BoundaryAnalyzer } from './BoundaryAnalyzer.js';
import { BoundaryModel } from './BoundaryModel.js';


export class BoundaryGenerator extends Generator {
    /**
     * @param {object} params
     * @param {string} [params.parameter='']
     * @param {BoundaryModel} [params.boundaryModel]
     */
    constructor(params = {}) {
        super({
            ...params,
            name: 'BoundaryGenerator',
            type: 'boundary',
        });
        this.parameter = params.parameter || '';
        this.boundaryModel = params.boundaryModel || (params.boundaryPoints ? new BoundaryModel({ points: params.boundaryPoints }) : BoundaryAnalyzer.extractBoundaries(this.parameter, params));
    }

    generateValue(context) {
        const vals = this.boundaryModel.values;
        if (vals.length === 0) return 0;
        const idx = context.step % vals.length;
        return vals[idx];
    }
}
