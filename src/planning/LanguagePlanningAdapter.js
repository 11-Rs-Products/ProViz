import { ExperimentCost } from './ExperimentCost.js';

export class LanguagePlanningAdapter {
  constructor(language = 'generic') {
    this.language = language;
  }

  getLanguageId() {
    return this.language;
  }

  estimateVerificationCost(node = null) {
    return new ExperimentCost({ cpuCost: 1.0, wallClockEstimateMs: 10 });
  }

  identifyLanguageSpecificRisks(sourceCode) {
    return [];
  }

  suggestLanguageExperiments(finding) {
    return [];
  }
}
