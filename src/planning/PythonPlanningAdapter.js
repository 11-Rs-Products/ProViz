import { LanguagePlanningAdapter } from './LanguagePlanningAdapter.js';
import { ExperimentKind } from './ExperimentKind.js';
import { ExperimentCost } from './ExperimentCost.js';

export class PythonPlanningAdapter extends LanguagePlanningAdapter {
  constructor() {
    super('python');
  }

  estimateVerificationCost(node = null) {
    let costMs = 5;
    if (node && node.type === 'FunctionDef') {
      costMs = 15;
    }
    return new ExperimentCost({ cpuCost: 1.0, wallClockEstimateMs: costMs });
  }

  identifyLanguageSpecificRisks(sourceCode = '') {
    const risks = [];
    if (sourceCode.includes('/')) {
      risks.push({ type: 'DIVISION_BY_ZERO', severity: 'HIGH' });
    }
    if (sourceCode.includes('[') && sourceCode.includes(']')) {
      risks.push({ type: 'INDEX_ERROR', severity: 'MEDIUM' });
    }
    if (sourceCode.includes('.get(') || sourceCode.includes('None')) {
      risks.push({ type: 'NONE_ATTRIBUTE_ACCESS', severity: 'HIGH' });
    }
    return risks;
  }

  suggestLanguageExperiments(finding = {}) {
    const experiments = [];
    if (finding.type === 'DIVISION_BY_ZERO' || finding.type === 'POSSIBLE_ZERO_DIVISION') {
      experiments.push(ExperimentKind.BOUNDARY_EXPLORATION);
      experiments.push(ExperimentKind.SYMBOLIC_DISPROVE);
    } else if (finding.type === 'POSSIBLE_NONE_ACCESS') {
      experiments.push(ExperimentKind.SYMBOLIC_PROVE);
      experiments.push(ExperimentKind.GENERATE_TEST);
    }
    return experiments;
  }
}
