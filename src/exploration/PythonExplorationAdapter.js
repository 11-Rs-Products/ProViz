import { LanguageExplorationAdapter } from './LanguageExplorationAdapter.js';

export class PythonExplorationAdapter extends LanguageExplorationAdapter {
  constructor() {
    super('python');
  }

  formatValue(val) {
    if (val === null || val === undefined) return 'None';
    if (val === true) return 'True';
    if (val === false) return 'False';
    if (typeof val === 'string') return JSON.stringify(val);
    if (Array.isArray(val)) {
      return `[${val.map(v => this.formatValue(v)).join(', ')}]`;
    }
    if (typeof val === 'object') {
      const items = Object.entries(val).map(([k, v]) => `${JSON.stringify(k)}: ${this.formatValue(v)}`);
      return `{${items.join(', ')}}`;
    }
    return String(val);
  }

  generateExecutableInvocation(functionName, args = {}) {
    if (Array.isArray(args)) {
      const formattedArgs = args.map(a => this.formatValue(a)).join(', ');
      return `${functionName}(${formattedArgs})`;
    }
    const formattedKwargs = Object.entries(args).map(([k, v]) => `${k}=${this.formatValue(v)}`).join(', ');
    return `${functionName}(${formattedKwargs})`;
  }

  generatePropertyTestHarness(functionName, testInputs = [], assertions = []) {
    let code = `# Auto-generated Exploration Test Harness for ${functionName}\n\n`;
    code += `def test_exploration_suite():\n`;
    for (let i = 0; i < testInputs.length; i++) {
      const inv = this.generateExecutableInvocation(functionName, testInputs[i]);
      code += `    result_${i} = ${inv}\n`;
    }
    code += `\ntest_exploration_suite()\n`;
    return code;
  }
}
