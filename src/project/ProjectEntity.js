/**
 * ProjectEntity.js
 * Canonical immutable representation of a project entity referencing semantic, knowledge, verification, and continuous identities.
 */

import { ProjectEntityKind } from './ProjectEntityKind.js';

const EMPTY_OBJ = Object.freeze({});

export class ProjectEntity {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {string} [options.name='']
   * @param {string} [options.kind=ProjectEntityKind.MODULE]
   * @param {string} [options.path='']
   * @param {string|null} [options.semanticId=null]
   * @param {string|null} [options.knowledgeId=null]
   * @param {string|null} [options.layer=null]
   * @param {string|null} [options.owner=null]
   * @param {Object} [options.attributes={}]
   * @param {Object} [options.metadata={}]
   */
  constructor({
    id,
    name = '',
    kind = ProjectEntityKind.MODULE,
    path = '',
    semanticId = null,
    knowledgeId = null,
    layer = null,
    owner = null,
    attributes = EMPTY_OBJ,
    metadata = EMPTY_OBJ
  }) {
    if (!id) throw new Error('ProjectEntity requires id');
    this.id = id;
    this.name = name || id;
    this.kind = kind;
    this.path = path;
    this.semanticId = semanticId;
    this.knowledgeId = knowledgeId;
    this.layer = layer;
    this.owner = owner;
    this.attributes = attributes === EMPTY_OBJ || Object.keys(attributes).length === 0 ? EMPTY_OBJ : Object.freeze({ ...attributes });
    this.metadata = metadata === EMPTY_OBJ || Object.keys(metadata).length === 0 ? EMPTY_OBJ : Object.freeze({ ...metadata });
    Object.freeze(this);
  }

  withLayer(layer) {
    return new ProjectEntity({
      id: this.id,
      name: this.name,
      kind: this.kind,
      path: this.path,
      semanticId: this.semanticId,
      knowledgeId: this.knowledgeId,
      layer,
      owner: this.owner,
      attributes: this.attributes,
      metadata: this.metadata
    });
  }

  withOwner(owner) {
    return new ProjectEntity({
      id: this.id,
      name: this.name,
      kind: this.kind,
      path: this.path,
      semanticId: this.semanticId,
      knowledgeId: this.knowledgeId,
      layer: this.layer,
      owner,
      attributes: this.attributes,
      metadata: this.metadata
    });
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      kind: this.kind,
      path: this.path,
      semanticId: this.semanticId,
      knowledgeId: this.knowledgeId,
      layer: this.layer,
      owner: this.owner,
      attributes: { ...this.attributes },
      metadata: { ...this.metadata }
    };
  }

  static fromJSON(json) {
    return new ProjectEntity(json);
  }
}
