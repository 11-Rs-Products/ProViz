import { ProvenanceArtifact } from './ProvenanceArtifact.js';

/**
 * Maintains the complete ancestry and cross-stage derivation chain for an artifact
 */
export class ProvenanceChain {
  constructor({ targetArtifact, links = [] } = {}) {
    this.targetArtifact = targetArtifact instanceof ProvenanceArtifact ? targetArtifact : ProvenanceArtifact.fromJSON(targetArtifact);
    this.links = Object.freeze(links.map(l => (l instanceof ProvenanceArtifact ? l : ProvenanceArtifact.fromJSON(l))));
    Object.freeze(this);
  }

  getOrigin() {
    if (this.links.length === 0) return this.targetArtifact;
    // Earliest stage link
    return [...this.links].sort((a, b) => a.stage - b.stage)[0];
  }

  getAncestors() {
    return this.links.filter(l => l.stage < this.targetArtifact.stage);
  }

  getDescendants() {
    return this.links.filter(l => l.stage > this.targetArtifact.stage);
  }

  getDerivationPath() {
    const sorted = [...this.links, this.targetArtifact].sort((a, b) => a.stage - b.stage);
    return sorted.map(a => a.artifactId);
  }

  getSupportingEvidence() {
    return this.links.filter(l => l.entityKind === 'EVIDENCE' || l.entityKind === 'PROOF' || l.entityKind === 'TEST_ORACLE');
  }

  getAffectedArtifacts() {
    return this.getDescendants();
  }

  toJSON() {
    return {
      targetArtifact: this.targetArtifact.toJSON(),
      links: this.links.map(l => l.toJSON())
    };
  }

  static fromJSON(json = {}) {
    return new ProvenanceChain(json);
  }
}
