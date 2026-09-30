/**
 * TreeGenerator — Generates bounded recursive tree data structures with depth budget.
 */

import { Generator } from './Generator.js';
import { IntegerGenerator } from './IntegerGenerator.js';

export class TreeGenerator extends Generator {
    /**
     * @param {object} params
     * @param {Generator} [params.valueGenerator]
     * @param {number} [params.maxDepth=3]
     */
    constructor(params = {}) {
        super({
            ...params,
            name: 'TreeGenerator',
            type: 'tree',
        });
        this.valueGenerator = params.valueGenerator || new IntegerGenerator({ min: 1, max: 100 });
        this.maxDepth = params.maxDepth !== undefined ? Number(params.maxDepth) : 3;
        Object.freeze(this);
    }

    generateValue(context) {
        return this._buildNode(context, 0);
    }

    _buildNode(context, currentDepth) {
        if (currentDepth >= this.maxDepth || (currentDepth > 0 && context.random() > 0.6)) {
            return null;
        }

        const val = this.valueGenerator.generateValue(context.next(currentDepth + 1));
        const left = this._buildNode(context.next(currentDepth * 2 + 1), currentDepth + 1);
        const right = this._buildNode(context.next(currentDepth * 2 + 2), currentDepth + 1);
        const children = [left, right].filter(Boolean);
        return {
            val,
            value: val,
            left,
            right,
            children
        };
    }
}
