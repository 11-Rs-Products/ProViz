export class TestFamilyReducer {
  constructor({ maxPerCluster = 2 } = {}) {
    this.maxPerCluster = maxPerCluster;
  }

  reduce(family, candidateClusters = new Map()) {
    // Keep a subset of family instances covering diverse behavioral clusters or unique inputs
    const seenSignatures = new Set();
    const retained = [];

    for (const inst of family.instances) {
      const sig = JSON.stringify(inst.inputs);
      if (!seenSignatures.has(sig)) {
        seenSignatures.add(sig);
        retained.push(inst);
      }
    }

    family.instances = retained;
    return family;
  }
}
