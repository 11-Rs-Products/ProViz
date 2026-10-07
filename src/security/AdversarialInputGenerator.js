/**
 * AdversarialInputGenerator.js
 * Generates edge-case, boundary, malformed, and resource-intensive inputs for security testing.
 */

import { AdversarialInput, AdversarialInputCategory } from './AdversarialInput.js';

export class AdversarialInputGenerator {
  /**
   * Synthesizes adversarial inputs tailored to a target parameter.
   * @param {string} paramName
   * @param {string} typeHint
   * @returns {Array<AdversarialInput>}
   */
  generateForParameter(paramName, typeHint = 'string') {
    const inputs = [];
    const prefix = `adv:${paramName}`;

    // 1. Boundary & Extreme
    if (typeHint === 'number') {
      inputs.push(new AdversarialInput({
        id: `${prefix}_min_safe`,
        category: AdversarialInputCategory.BOUNDARY,
        targetParam: paramName,
        payload: Number.MIN_SAFE_INTEGER,
        expectedFailureType: 'INTEGER_UNDERFLOW'
      }));
      inputs.push(new AdversarialInput({
        id: `${prefix}_max_safe`,
        category: AdversarialInputCategory.BOUNDARY,
        targetParam: paramName,
        payload: Number.MAX_SAFE_INTEGER,
        expectedFailureType: 'INTEGER_OVERFLOW'
      }));
      inputs.push(new AdversarialInput({
        id: `${prefix}_nan`,
        category: AdversarialInputCategory.MALFORMED,
        targetParam: paramName,
        payload: NaN,
        expectedFailureType: 'INVALID_NUMBER'
      }));
      inputs.push(new AdversarialInput({
        id: `${prefix}_infinity`,
        category: AdversarialInputCategory.EXTREME,
        targetParam: paramName,
        payload: Infinity,
        expectedFailureType: 'OVERFLOW'
      }));
    } else {
      // String / Object / Generic
      inputs.push(new AdversarialInput({
        id: `${prefix}_empty`,
        category: AdversarialInputCategory.EMPTY,
        targetParam: paramName,
        payload: '',
        expectedFailureType: 'EMPTY_INPUT'
      }));
      inputs.push(new AdversarialInput({
        id: `${prefix}_null_byte`,
        category: AdversarialInputCategory.MALFORMED,
        targetParam: paramName,
        payload: 'admin\0.user',
        expectedFailureType: 'NULL_BYTE_INJECTION'
      }));
      inputs.push(new AdversarialInput({
        id: `${prefix}_traversal`,
        category: AdversarialInputCategory.STRUCTURALLY_INVALID,
        targetParam: paramName,
        payload: '../../../../etc/passwd',
        expectedFailureType: 'PATH_TRAVERSAL'
      }));
      inputs.push(new AdversarialInput({
        id: `${prefix}_long_str`,
        category: AdversarialInputCategory.RESOURCE_EXPENSIVE,
        targetParam: paramName,
        payload: 'A'.repeat(65536),
        expectedFailureType: 'BUFFER_EXHAUSTION'
      }));
      inputs.push(new AdversarialInput({
        id: `${prefix}_proto_pollute`,
        category: AdversarialInputCategory.SEMANTICALLY_INVALID,
        targetParam: paramName,
        payload: { '__proto__': { 'isAdmin': true } },
        expectedFailureType: 'PROTOTYPE_POLLUTION'
      }));
    }

    return inputs;
  }
}
