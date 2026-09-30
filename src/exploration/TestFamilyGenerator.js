import { TestFamily } from './TestFamily.js';

export class TestFamilyGenerator {
  constructor({ context = null } = {}) {
    this.context = context;
  }

  generateFamily(template, count = 10) {
    const family = new TestFamily({
      name: `Family for ${template.targetFunction}`,
      template: template.id,
      parameters: Object.keys(template.paramGenerators)
    });

    for (let i = 0; i < count; i++) {
      const paramValues = {};
      for (const [param, generator] of Object.entries(template.paramGenerators)) {
        const out = generator.generate(this.context);
        paramValues[param] = out.value;
      }
      const instance = template.instantiate(paramValues);
      family.addInstance(instance);
    }

    return family;
  }
}
