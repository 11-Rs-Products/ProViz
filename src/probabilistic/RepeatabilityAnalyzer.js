import { ExecutionVariance } from './ExecutionVariance.js';

export class RepeatabilityAnalyzer {
  /**
   * Analyze repeated execution results for identical inputs.
   * executions: Array of { returnValue, exception, state, durationMs, environment }
   */
  static analyze(subject, executions = []) {
    if (!executions || executions.length === 0) {
      return new ExecutionVariance({ subject, runsCount: 0 });
    }

    const retSet = new Set();
    const excSet = new Set();
    const durations = [];
    const envSet = new Set();

    for (const ex of executions) {
      if (ex.exception !== undefined && ex.exception !== null) {
        excSet.add(String(ex.exception));
      } else {
        retSet.add(typeof ex.returnValue === 'object' ? JSON.stringify(ex.returnValue) : String(ex.returnValue));
      }
      if (typeof ex.durationMs === 'number') {
        durations.push(ex.durationMs);
      }
      if (ex.environment) {
        envSet.add(JSON.stringify(ex.environment));
      }
    }

    let timingVariance = 0;
    if (durations.length > 1) {
      const mean = durations.reduce((a, b) => a + b, 0) / durations.length;
      timingVariance = durations.reduce((acc, v) => acc + (v - mean) * (v - mean), 0) / (durations.length - 1);
    }

    return new ExecutionVariance({
      subject,
      runsCount: executions.length,
      distinctReturnValues: Array.from(retSet),
      distinctExceptions: Array.from(excSet),
      timingVariance,
      hasReturnValueVariance: retSet.size > 1,
      hasExceptionVariance: excSet.size > 1 || (excSet.size > 0 && retSet.size > 0),
      hasStateVariance: false,
      hasEnvironmentSensitivity: envSet.size > 1
    });
  }
}
