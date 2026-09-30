export class ExplorationMatrix {
  constructor() {
    // candidateId -> Set of objectiveIds
    this.candidateObjectives = new Map();
    // candidateId -> Set of specIds validated/violated
    this.candidateSpecs = new Map();
    // candidateId -> Set of mutantIds killed
    this.candidateMutants = new Map();
    // candidateId -> clusterId
    this.candidateClusters = new Map();
    // candidateId -> findings
    this.candidateFindings = new Map();
  }

  recordCandidateObjective(candidateId, objectiveId) {
    if (!this.candidateObjectives.has(candidateId)) {
      this.candidateObjectives.set(candidateId, new Set());
    }
    this.candidateObjectives.get(candidateId).add(objectiveId);
  }

  recordCandidateSpec(candidateId, specId) {
    if (!this.candidateSpecs.has(candidateId)) {
      this.candidateSpecs.set(candidateId, new Set());
    }
    this.candidateSpecs.get(candidateId).add(specId);
  }

  recordCandidateMutant(candidateId, mutantId) {
    if (!this.candidateMutants.has(candidateId)) {
      this.candidateMutants.set(candidateId, new Set());
    }
    this.candidateMutants.get(candidateId).add(mutantId);
  }

  recordCandidateCluster(candidateId, clusterId) {
    this.candidateClusters.set(candidateId, clusterId);
  }

  recordCandidateFinding(candidateId, findingId) {
    if (!this.candidateFindings.has(candidateId)) {
      this.candidateFindings.set(candidateId, new Set());
    }
    this.candidateFindings.get(candidateId).add(findingId);
  }

  toJSON() {
    return {
      candidateObjectives: Object.fromEntries([...this.candidateObjectives.entries()].map(([k, v]) => [k, [...v]])),
      candidateSpecs: Object.fromEntries([...this.candidateSpecs.entries()].map(([k, v]) => [k, [...v]])),
      candidateMutants: Object.fromEntries([...this.candidateMutants.entries()].map(([k, v]) => [k, [...v]])),
      candidateClusters: Object.fromEntries(this.candidateClusters.entries()),
      candidateFindings: Object.fromEntries([...this.candidateFindings.entries()].map(([k, v]) => [k, [...v]]))
    };
  }
}
