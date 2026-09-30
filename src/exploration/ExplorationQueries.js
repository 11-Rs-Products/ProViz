export class ExplorationQueries {
  constructor(matrix, campaign) {
    this.matrix = matrix;
    this.campaign = campaign;
  }

  findCandidatesForObjective(objectiveId) {
    const results = [];
    for (const [candidateId, objectives] of this.matrix.candidateObjectives.entries()) {
      if (objectives.has(objectiveId)) {
        results.push(candidateId);
      }
    }
    return results;
  }

  findCandidatesForSpec(specId) {
    const results = [];
    for (const [candidateId, specs] of this.matrix.candidateSpecs.entries()) {
      if (specs.has(specId)) {
        results.push(candidateId);
      }
    }
    return results;
  }

  findCandidatesKillingMutant(mutantId) {
    const results = [];
    for (const [candidateId, mutants] of this.matrix.candidateMutants.entries()) {
      if (mutants.has(mutantId)) {
        results.push(candidateId);
      }
    }
    return results;
  }

  getCandidatesInCluster(clusterId) {
    const results = [];
    for (const [candidateId, cId] of this.matrix.candidateClusters.entries()) {
      if (cId === clusterId) {
        results.push(candidateId);
      }
    }
    return results;
  }

  getAllKilledMutants() {
    const killed = new Set();
    for (const mutants of this.matrix.candidateMutants.values()) {
      for (const m of mutants) killed.add(m);
    }
    return [...killed];
  }

  getAllCoveredObjectives() {
    const objs = new Set();
    for (const objectives of this.matrix.candidateObjectives.values()) {
      for (const o of objectives) objs.add(o);
    }
    return [...objs];
  }
}
