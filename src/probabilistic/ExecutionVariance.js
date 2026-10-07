export class ExecutionVariance {
  constructor({
    subject,
    runsCount = 0,
    distinctReturnValues = [],
    distinctExceptions = [],
    timingVariance = 0.0,
    stateMutationsCount = 0,
    hasReturnValueVariance = false,
    hasExceptionVariance = false,
    hasStateVariance = false,
    hasEnvironmentSensitivity = false
  }) {
    this.subject = subject;
    this.runsCount = runsCount;
    this.distinctReturnValues = Object.freeze([...distinctReturnValues]);
    this.distinctExceptions = Object.freeze([...distinctExceptions]);
    this.timingVariance = timingVariance;
    this.stateMutationsCount = stateMutationsCount;
    this.hasReturnValueVariance = hasReturnValueVariance;
    this.hasExceptionVariance = hasExceptionVariance;
    this.hasStateVariance = hasStateVariance;
    this.hasEnvironmentSensitivity = hasEnvironmentSensitivity;
    Object.freeze(this);
  }

  isSemanticVariance() {
    return this.hasReturnValueVariance || this.hasExceptionVariance || this.hasStateVariance;
  }

  toJSON() {
    return {
      subject: this.subject,
      runsCount: this.runsCount,
      distinctReturnValues: this.distinctReturnValues,
      distinctExceptions: this.distinctExceptions,
      timingVariance: this.timingVariance,
      hasReturnValueVariance: this.hasReturnValueVariance,
      hasExceptionVariance: this.hasExceptionVariance,
      hasStateVariance: this.hasStateVariance,
      hasEnvironmentSensitivity: this.hasEnvironmentSensitivity
    };
  }
}
