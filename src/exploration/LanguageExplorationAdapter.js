export class LanguageExplorationAdapter {
  constructor(language = 'generic') {
    this.language = language;
  }

  formatInput(input) {
    return JSON.stringify(input);
  }

  generateExecutableInvocation(functionName, args = {}) {
    throw new Error('generateExecutableInvocation must be implemented by language adapter');
  }

  parseExecutionOutput(rawOutput) {
    return rawOutput;
  }
}
