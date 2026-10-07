/**
 * Supported Languages in ProViz Federation
 */
export const LanguageKind = Object.freeze({
  JAVASCRIPT: 'JAVASCRIPT',
  TYPESCRIPT: 'TYPESCRIPT',
  PYTHON: 'PYTHON',
  JAVA: 'JAVA',
  CPP: 'CPP',
  RUST: 'RUST',
  GO: 'GO'
});

export class LanguageCapability {
  constructor({
    languages = [LanguageKind.JAVASCRIPT, LanguageKind.TYPESCRIPT],
    hasAST = true,
    hasCFG = true,
    hasTypeInference = true,
    hasFFIBoundaries = false,
    runtimeExecutors = ['node']
  } = {}) {
    this.languages = Object.freeze([...new Set(languages)]);
    this.hasAST = hasAST;
    this.hasCFG = hasCFG;
    this.hasTypeInference = hasTypeInference;
    this.hasFFIBoundaries = hasFFIBoundaries;
    this.runtimeExecutors = Object.freeze([...new Set(runtimeExecutors)]);
    Object.freeze(this);
  }

  supportsLanguage(language) {
    const lang = (language || '').toUpperCase();
    return this.languages.includes(lang) || this.languages.includes('*');
  }

  toJSON() {
    return {
      languages: [...this.languages],
      hasAST: this.hasAST,
      hasCFG: this.hasCFG,
      hasTypeInference: this.hasTypeInference,
      hasFFIBoundaries: this.hasFFIBoundaries,
      runtimeExecutors: [...this.runtimeExecutors]
    };
  }

  static fromJSON(json = {}) {
    return new LanguageCapability(json);
  }
}
