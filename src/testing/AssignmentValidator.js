/**
 * AssignmentValidator — Validates that a concrete assignment satisfies symbolic constraints.
 */

export class AssignmentValidator {
    /**
     * Validate a map of concrete values against an array/set of constraints.
     * @param {Map<string, *>|object} bindings
     * @param {Array<object>|import('../symbolic/ConstraintSet.js').ConstraintSet} constraints
     * @returns {object} - { isValid: boolean, violatedConstraints: Array<object> }
     */
    static validate(bindings, constraints) {
        const rawMap = bindings instanceof Map ? bindings : new Map(Object.entries(bindings || {}));
        const cstList = constraints && constraints.getConstraints ? constraints.getConstraints() : (Array.isArray(constraints) ? constraints : []);
        const violated = [];

        for (const c of cstList) {
            const varName = c.left?.name || c.left?.symbol?.name;
            if (!varName) continue;

            const valObj = rawMap.get(varName);
            const val = valObj && typeof valObj === 'object' && 'value' in valObj ? valObj.value : valObj;
            const targetVal = c.right?.value;

            if (val === undefined) continue;

            let ok = true;
            if (c.relation === '==' && val !== targetVal) ok = false;
            else if (c.relation === '!=' && val === targetVal) ok = false;
            else if (c.relation === '<' && !(val < targetVal)) ok = false;
            else if (c.relation === '<=' && !(val <= targetVal)) ok = false;
            else if (c.relation === '>' && !(val > targetVal)) ok = false;
            else if (c.relation === '>=' && !(val >= targetVal)) ok = false;
            else if (c.relation === 'is' && targetVal === null && val !== null) ok = false;
            else if (c.relation === 'is not' && targetVal === null && val === null) ok = false;

            if (!ok) {
                violated.push(c);
            }
        }

        return {
            isValid: violated.length === 0,
            violatedConstraints: violated,
        };
    }
}
