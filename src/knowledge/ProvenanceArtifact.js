/**
 * Represents an individual artifact with its lineage and derivation context
 */
export class ProvenanceArtifact {
  constructor({
    artifactId,
    entityKind = 'STATEMENT',
    stage = 1,
    sourceFile = null,
    sourceLocation = null,
    derivedFrom = [],
    creator = 'SYSTEM',
    fingerprint = null,
    metadata = {}
  } = {}) {
    if (!artifactId) {
      throw new Error('ProvenanceArtifact requires an artifactId');
    }

    this.artifactId = artifactId;
    this.entityKind = entityKind;
    this.stage = stage;
    this.sourceFile = sourceFile;
    this.sourceLocation = sourceLocation ? Object.freeze({ ...sourceLocation }) : null;
    this.derivedFrom = Object.freeze([...new Set(derivedFrom)]);
    this.creator = creator;
    this.fingerprint = fingerprint || `${this.entityKind}:${this.artifactId}:${this.stage}`;
    this.metadata = Object.freeze({ ...metadata });
    Object.freeze(this);
  }

  toJSON() {
    return {
      artifactId: this.artifactId,
      entityKind: this.entityKind,
      stage: this.stage,
      sourceFile: this.sourceFile,
      sourceLocation: this.sourceLocation ? { ...this.sourceLocation } : null,
      derivedFrom: [...this.derivedFrom],
      creator: this.creator,
      fingerprint: this.fingerprint,
      metadata: { ...this.metadata }
    };
  }

  static fromJSON(json = {}) {
    return new ProvenanceArtifact(json);
  }
}
