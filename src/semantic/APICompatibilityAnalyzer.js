/**
 * APICompatibilityAnalyzer.js
 * Detects API compatibility breakages across source, binary, runtime, and behavioral dimensions.
 */

export const CompatibilityStatus = Object.freeze({
  COMPATIBLE: 'COMPATIBLE',
  POTENTIALLY_BREAKING: 'POTENTIALLY_BREAKING',
  BREAKING: 'BREAKING',
  SOURCE_BREAK: 'SOURCE_BREAK',
  BINARY_BREAK: 'BINARY_BREAK',
  RUNTIME_BREAK: 'RUNTIME_BREAK',
  BEHAVIORAL_BREAK: 'BEHAVIORAL_BREAK'
});

export class APICompatibilityAnalyzer {
  /**
   * Compares an old APIContract with a new APIContract.
   */
  compare(oldContract, newContract) {
    if (!oldContract || !newContract) {
      return { status: CompatibilityStatus.COMPATIBLE, reasons: ['No previous contract to compare'] };
    }

    const reasons = [];
    let isBreaking = false;
    let isPotentiallyBreaking = false;

    // Check for removed parameters or changed required parameter types
    for (const oldInput of oldContract.inputTypes) {
      const matched = newContract.inputTypes.find(ni => ni.name === oldInput.name);
      if (!matched && oldInput.required) {
        reasons.push(`Required parameter '${oldInput.name}' was removed`);
        isBreaking = true;
      } else if (matched && matched.type !== oldInput.type && oldInput.type !== 'any') {
        reasons.push(`Parameter '${oldInput.name}' type changed from '${oldInput.type}' to '${matched.type}'`);
        isBreaking = true;
      }
    }

    // Check for newly added required parameters without default
    for (const newInput of newContract.inputTypes) {
      const matched = oldContract.inputTypes.find(oi => oi.name === newInput.name);
      if (!matched && newInput.required && newInput.default === undefined) {
        reasons.push(`New required parameter '${newInput.name}' added without default value`);
        isBreaking = true;
      }
    }

    // Check return type
    if (oldContract.outputType && newContract.outputType) {
      if (oldContract.outputType.type !== 'any' && oldContract.outputType.type !== newContract.outputType.type) {
        reasons.push(`Return type changed from '${oldContract.outputType.type}' to '${newContract.outputType.type}'`);
        isBreaking = true;
      }
    }

    // Check preconditions strengthening
    if (newContract.preconditions.length > oldContract.preconditions.length) {
      reasons.push('New preconditions added, strengthening caller requirements');
      isPotentiallyBreaking = true;
    }

    let status = CompatibilityStatus.COMPATIBLE;
    if (isBreaking) status = CompatibilityStatus.BREAKING;
    else if (isPotentiallyBreaking) status = CompatibilityStatus.POTENTIALLY_BREAKING;

    return {
      status,
      reasons,
      isCompatible: status === CompatibilityStatus.COMPATIBLE
    };
  }
}
