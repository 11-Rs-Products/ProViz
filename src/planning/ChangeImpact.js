export class ChangeImpact {
  constructor({
    changedFiles = [],
    affectedFunctions = [],
    affectedProperties = [],
    affectedMutants = [],
    staleEvidenceIds = [],
    preservedEvidenceIds = [],
    impactScore = 0.5
  } = {}) {
    this.changedFiles = Object.freeze([...changedFiles]);
    this.affectedFunctions = Object.freeze([...affectedFunctions]);
    this.affectedProperties = Object.freeze([...affectedProperties]);
    this.affectedMutants = Object.freeze([...affectedMutants]);
    this.staleEvidenceIds = Object.freeze([...staleEvidenceIds]);
    this.preservedEvidenceIds = Object.freeze([...preservedEvidenceIds]);
    this.impactScore = Number(impactScore);
    Object.freeze(this);
  }

  toJSON() {
    return {
      changedFiles: this.changedFiles,
      affectedFunctions: this.affectedFunctions,
      affectedProperties: this.affectedProperties,
      affectedMutants: this.affectedMutants,
      staleEvidenceIds: this.staleEvidenceIds,
      preservedEvidenceIds: this.preservedEvidenceIds,
      impactScore: this.impactScore
    };
  }
}
