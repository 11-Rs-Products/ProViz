import { KnowledgeEntityKind } from './KnowledgeEntityKind.js';

/**
 * Immutable canonical entity in the universal verification knowledge graph
 */
export class KnowledgeEntity {
  constructor({
    id,
    kind = KnowledgeEntityKind.PROGRAM,
    name = '',
    sourceArtifact = null,
    sourceLocation = null, // { file, line, column, endLine, endColumn }
    creationStage = 1,
    semanticFingerprint = null,
    timestamps = { created: Date.now(), updated: Date.now() },
    parentEntities = [],
    relatedArtifacts = [],
    attributes = {},
    metadata = {}
  } = {}) {
    if (!id) {
      throw new Error('KnowledgeEntity requires an id');
    }

    this.id = id;
    this.kind = kind;
    this.name = name || id;
    this.sourceArtifact = sourceArtifact;
    this.sourceLocation = sourceLocation ? Object.freeze({ ...sourceLocation }) : null;
    this.creationStage = creationStage;
    this.semanticFingerprint = semanticFingerprint || `${this.kind}:${this.name}:${this.id}`;
    this.timestamps = Object.freeze({
      created: timestamps?.created ?? Date.now(),
      updated: timestamps?.updated ?? Date.now()
    });
    this.parentEntities = Object.freeze([...new Set(parentEntities)]);
    this.relatedArtifacts = Object.freeze([...new Set(relatedArtifacts)]);
    this.attributes = Object.freeze({ ...attributes });
    this.metadata = Object.freeze({ ...metadata });
    Object.freeze(this);
  }

  withAttribute(key, value) {
    return new KnowledgeEntity({
      ...this.toJSON(),
      attributes: {
        ...this.attributes,
        [key]: value
      },
      timestamps: {
        ...this.timestamps,
        updated: Date.now()
      }
    });
  }

  withParent(parentId) {
    return new KnowledgeEntity({
      ...this.toJSON(),
      parentEntities: [...this.parentEntities, parentId],
      timestamps: {
        ...this.timestamps,
        updated: Date.now()
      }
    });
  }

  toJSON() {
    return {
      id: this.id,
      kind: this.kind,
      name: this.name,
      sourceArtifact: this.sourceArtifact,
      sourceLocation: this.sourceLocation ? { ...this.sourceLocation } : null,
      creationStage: this.creationStage,
      semanticFingerprint: this.semanticFingerprint,
      timestamps: { ...this.timestamps },
      parentEntities: [...this.parentEntities],
      relatedArtifacts: [...this.relatedArtifacts],
      attributes: { ...this.attributes },
      metadata: { ...this.metadata }
    };
  }

  static fromJSON(json = {}) {
    return new KnowledgeEntity(json);
  }
}
