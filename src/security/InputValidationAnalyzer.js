/**
 * InputValidationAnalyzer.js
 * Analyzes whether untrusted input undergoes comprehensive schema/type/range validation before critical operations.
 */

export class InputValidationAnalyzer {
  /**
   * Validates if parameter is protected by validation schemas or sanitizers.
   * @param {string} paramName
   * @param {Array<string>} activeValidators
   * @param {Object} [schemaRules]
   * @returns {Object}
   */
  evaluateValidation(paramName, activeValidators = [], schemaRules = null) {
    const hasValidator = activeValidators.some(v => v.includes('VALIDATE') || v.includes('SCHEMA_CHECK') || v.includes('SANITIZE'));
    const isMissingValidation = !hasValidator && (!schemaRules || schemaRules.allowAny);

    if (isMissingValidation) {
      return {
        isValidated: false,
        isVulnerable: true,
        paramName,
        reason: `Missing input validation or sanitization for parameter '${paramName}'`
      };
    }

    return {
      isValidated: true,
      isVulnerable: false,
      paramName,
      appliedValidators: activeValidators,
      reason: 'Input validation verified'
    };
  }
}
