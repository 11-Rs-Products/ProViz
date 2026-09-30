export class TestFamilyTemplate {
  constructor({
    id,
    targetFunction,
    paramGenerators = {},
    oracleType = 'INVARIANT',
    assertionTemplate = '',
    metadata = {}
  } = {}) {
    this.id = id || `tmpl_${Math.random().toString(36).substring(2, 9)}`;
    this.targetFunction = targetFunction;
    this.paramGenerators = paramGenerators; // paramName -> Generator
    this.oracleType = oracleType;
    this.assertionTemplate = assertionTemplate;
    this.metadata = metadata;
  }

  instantiate(paramValues = {}) {
    return {
      templateId: this.id,
      targetFunction: this.targetFunction,
      inputs: paramValues,
      oracleType: this.oracleType,
      timestamp: Date.now()
    };
  }

  toJSON() {
    return {
      id: this.id,
      targetFunction: this.targetFunction,
      oracleType: this.oracleType,
      assertionTemplate: this.assertionTemplate,
      metadata: this.metadata
    };
  }
}
