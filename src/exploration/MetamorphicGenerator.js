/**
 * MetamorphicGenerator — Generates transformed inputs from seed values according to a MetamorphicRelation.
 */

import { MetamorphicTransformation } from './MetamorphicTransformation.js';

export class MetamorphicGenerator {
    /**
     * @param {MetamorphicRelation} relation
     * @param {any} seedInput
     * @param {object} [options={}]
     * @returns {any}
     */
    static transform(relation, seedInput, options = {}) {
        return MetamorphicTransformation.apply(relation.transformation, seedInput, options);
    }
}
