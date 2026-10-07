import { LanguageKind } from './LanguageCapability.js';

/**
 * Universal language federation adapter providing normalized AST, CFG, contract and symbol structures
 */
export class LanguageFederationAdapter {
  constructor(language = LanguageKind.JAVASCRIPT) {
    this.language = language.toUpperCase();
  }

  normalizeType(typeStr) {
    const raw = (typeStr || '').toLowerCase().trim();
    if (['number', 'int', 'i32', 'i64', 'float', 'f64', 'double'].includes(raw)) return 'NUMBER';
    if (['string', 'str', '&str', 'char*'].includes(raw)) return 'STRING';
    if (['boolean', 'bool'].includes(raw)) return 'BOOLEAN';
    if (['void', 'unit', '()', 'none', 'null', 'undefined'].includes(raw)) return 'VOID';
    if (raw.endsWith('[]') || raw.startsWith('list') || raw.startsWith('vector') || raw.startsWith('vec') || raw.startsWith('array')) return 'ARRAY';
    return 'OBJECT';
  }

  normalizeAST(ast) {
    return {
      language: this.language,
      nodesCount: ast?.body?.length || 1,
      type: 'NormalizedProgramAST',
      raw: ast
    };
  }

  normalizeContract(preconditions = [], postconditions = []) {
    return {
      language: this.language,
      preconditions: preconditions.map(p => ({ expr: String(p), status: 'ACTIVE' })),
      postconditions: postconditions.map(p => ({ expr: String(p), status: 'ACTIVE' }))
    };
  }

  normalizeExecutionResult(rawResult) {
    return {
      language: this.language,
      returnValue: rawResult?.returnValue ?? rawResult?.value ?? null,
      exception: rawResult?.error || rawResult?.exception || null,
      executionTrace: rawResult?.trace || []
    };
  }
}
