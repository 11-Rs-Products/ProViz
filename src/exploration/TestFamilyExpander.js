export class TestFamilyExpander {
  constructor({ mutators = [] } = {}) {
    this.mutators = mutators;
  }

  expand(family, factor = 2) {
    const originalCount = family.instances.length;
    const additional = [];

    for (let i = 0; i < originalCount * factor; i++) {
      const base = family.instances[i % originalCount];
      const clonedInputs = JSON.parse(JSON.stringify(base.inputs || {}));
      
      // Apply slight perturbation if mutators are available or numeric nudge
      for (const [key, val] of Object.entries(clonedInputs)) {
        if (typeof val === 'number') {
          clonedInputs[key] = val + (i % 2 === 0 ? 1 : -1);
        }
      }

      additional.push({
        ...base,
        inputs: clonedInputs,
        expandedFrom: base.templateId
      });
    }

    for (const inst of additional) {
      family.addInstance(inst);
    }

    return family;
  }
}
