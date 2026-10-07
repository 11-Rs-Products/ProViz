import { KnowledgeEntityKind } from './KnowledgeEntityKind.js';

const EMPTY_ARR = Object.freeze([]);
const EMPTY_OBJ = Object.freeze({});

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
    timestamps = null,
    parentEntities = null,
    relatedArtifacts = null,
    attributes = null,
    metadata = null
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
    this.timestamps = timestamps ? Object.freeze({
      created: timestamps.created ?? Date.now(),
      updated: timestamps.updated ?? Date.now()
    }) : Object.freeze({ created: Date.now(), updated: Date.now() });
    this.parentEntities = parentEntities && parentEntities.length > 0 ? Object.freeze([...new Set(parentEntities)]) : EMPTY_ARR;
    this.relatedArtifacts = relatedArtifacts && relatedArtifacts.length > 0 ? Object.freeze([...new Set(relatedArtifacts)]) : EMPTY_ARR;
    this.attributes = attributes && Object.keys(attributes).length > 0 ? Object.freeze({ ...attributes }) : EMPTY_OBJ;
    this.metadata = metadata && Object.keys(metadata).length > 0 ? Object.freeze({ ...metadata }) : EMPTY_OBJ;
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
