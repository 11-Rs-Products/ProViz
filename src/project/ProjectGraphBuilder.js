/**
 * ProjectGraphBuilder.js
 * Fluent builder for assembling and indexing ProjectGraphs from diverse sources.
 */

import { ProjectGraph } from './ProjectGraph.js';
import { ProjectEntity } from './ProjectEntity.js';
import { ProjectEntityKind } from './ProjectEntityKind.js';
import { ProjectRelation, ProjectRelationKind } from './ProjectRelation.js';

export class ProjectGraphBuilder {
  constructor() {
    this.graph = new ProjectGraph();
  }

  addEntity(entityData) {
    this.graph.addNode(entityData);
    return this;
  }

  addModule(id, name, path, attributes = {}, metadata = {}) {
    return this.addEntity(new ProjectEntity({
      id,
      name,
      kind: ProjectEntityKind.MODULE,
      path,
      attributes,
      metadata
    }));
  }

  addPackage(id, name, path, attributes = {}, metadata = {}) {
    return this.addEntity(new ProjectEntity({
      id,
      name,
      kind: ProjectEntityKind.PACKAGE,
      path,
      attributes,
      metadata
    }));
  }

  addDependency(fromId, toId, weight = 1.0, metadata = {}) {
    this.graph.addEdge(new ProjectRelation({
      from: fromId,
      to: toId,
      kind: ProjectRelationKind.DEPENDS_ON,
      weight,
      metadata
    }));
    return this;
  }

  addHierarchy(parentId, childId) {
    this.graph.addEdge(new ProjectRelation({
      from: parentId,
      to: childId,
      kind: ProjectRelationKind.CONTAINS,
      weight: 1.0
    }));
    return this;
  }

  addSpecificationLink(specId, targetId) {
    this.graph.addEdge(new ProjectRelation({
      from: specId,
      to: targetId,
      kind: ProjectRelationKind.CONSTRAINS
    }));
    return this;
  }

  addVerificationEvidenceLink(evidenceId, obligationId) {
    this.graph.addEdge(new ProjectRelation({
      from: evidenceId,
      to: obligationId,
      kind: ProjectRelationKind.VERIFIES
    }));
    return this;
  }

  build() {
    return this.graph;
  }
}
