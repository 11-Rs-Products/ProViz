/**
 * ConcreteAssignmentBuilder — Builds concrete TestInput from solver models.
 */

import { TestInput } from '../testing/TestInput.js';
import { TestValue } from '../testing/TestValue.js';

export class ConcreteAssignmentBuilder {
    /**
     * Build TestInput from solver model.
     * @param {object} model - Variable assignments from solver
     * @param {object} [baseBindings={}] - Optional parent inputs to retain
     * @returns {TestInput}
     */
    static buildInput(model = {}, baseBindings = {}) {
        const merged = { ...baseBindings };

        for (const [k, v] of Object.entries(model || {})) {
            if (v === null) merged[k] = TestValue.none();
            else if (typeof v === 'number') merged[k] = TestValue.int(v);
            else if (typeof v === 'string') merged[k] = TestValue.string(v);
            else if (typeof v === 'boolean') merged[k] = TestValue.bool(v);
            else merged[k] = new TestValue({ value: v });
        }

        return new TestInput({
            bindings: merged,
        });
    }
}
