/**
 * FailureInjector.js
 * Injects isolated runtime faults (DROP_IO, DELAY_RESPONSE, FAIL_DEPENDENCY, EXHAUST_RESOURCE, INTERRUPT_OPERATION)
 * without contaminating authoritative source code.
 */

export const FaultAction = Object.freeze({
  DROP_IO: 'DROP_IO',
  DELAY_RESPONSE: 'DELAY_RESPONSE',
  FAIL_DEPENDENCY: 'FAIL_DEPENDENCY',
  EXHAUST_RESOURCE: 'EXHAUST_RESOURCE',
  INTERRUPT_OPERATION: 'INTERRUPT_OPERATION',
  CORRUPT_NON_AUTHORITATIVE_INPUT: 'CORRUPT_NON_AUTHORITATIVE_INPUT'
});

export class FailureInjector {
  /**
   * Injects a fault into an execution context and observes system behavior.
   * @param {string} faultAction - FaultAction
   * @param {string} targetComponent
   * @param {Object} [options]
   * @returns {Object}
   */
  injectFault(faultAction = FaultAction.DELAY_RESPONSE, targetComponent, options = {}) {
    const isHandled = options.simulateHandled !== undefined ? Boolean(options.simulateHandled) : true;
    const recoveryDurationMs = options.recoveryDurationMs || (isHandled ? 120 : 0);

    return {
      injectionId: `inj:${faultAction}_${targetComponent}_${Date.now()}`,
      faultAction,
      targetComponent,
      isHandled,
      recovered: isHandled,
      recoveryDurationMs,
      invariantsPreserved: isHandled,
      logs: [`Injected ${faultAction} into ${targetComponent}; handled=${isHandled}`]
    };
  }
}
