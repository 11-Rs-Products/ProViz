/**
 * ProjectModel.js
 * Unified hierarchical project structure indexing all entities across all kinds.
 */

import { ProjectEntity } from './ProjectEntity.js';
import { ProjectEntityKind } from './ProjectEntityKind.js';
import { ProjectGraph } from './ProjectGraph.js';

export class ProjectModel {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {string} [options.name='']
   * @param {ProjectGraph} [options.graph]
   * @param {Object} [options.metadata={}]
   */
  constructor({
    id,
    name = '',
    graph = new ProjectGraph(),
    metadata = {}
  }) {
    if (!id) throw new Error('ProjectModel requires id');
    this.id = id;
    this.name = name || id;
    this.graph = graph;
    this.metadata = { ...metadata };
  }

  addEntity(entity) {
    return this.graph.addNode(entity);
  }

  getEntity(id) {
    return this.graph.getNode(id);
  }

  getEntitiesByKind(kind) {
    return this.graph.getNodes().filter(node => node.kind === kind);
  }

  getRepositories() { return this.getEntitiesByKind(ProjectEntityKind.REPOSITORY); }
  getApplications() { return this.getEntitiesByKind(ProjectEntityKind.APPLICATION); }
  getPackages() { return this.getEntitiesByKind(ProjectEntityKind.PACKAGE); }
  getModules() { return this.getEntitiesByKind(ProjectEntityKind.MODULE); }
  getFiles() { return this.getEntitiesByKind(ProjectEntityKind.FILE); }
  getSymbols() { return this.getEntitiesByKind(ProjectEntityKind.SYMBOL); }
  getAPIs() { return this.getEntitiesByKind(ProjectEntityKind.API); }
  getDependencies() { return this.getEntitiesByKind(ProjectEntityKind.DEPENDENCY); }
  getTests() { return this.getEntitiesByKind(ProjectEntityKind.TEST); }
  getSpecifications() { return this.getEntitiesByKind(ProjectEntityKind.SPECIFICATION); }
  getVerificationObligations() { return this.getEntitiesByKind(ProjectEntityKind.VERIFICATION_OBLIGATION); }
  getSecurityBoundaries() { return this.getEntitiesByKind(ProjectEntityKind.SECURITY_BOUNDARY); }
  getPerformanceModels() { return this.getEntitiesByKind(ProjectEntityKind.PERFORMANCE_MODEL); }
  getConcurrencyModels() { return this.getEntitiesByKind(ProjectEntityKind.CONCURRENCY_MODEL); }
  getTransformations() { return this.getEntitiesByKind(ProjectEntityKind.TRANSFORMATION); }
  getEvidence() { return this.getEntitiesByKind(ProjectEntityKind.EVIDENCE); }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      metadata: { ...this.metadata },
      graph: this.graph.toJSON()
    };
  }

  static fromJSON(json) {
    return new ProjectModel({
      id: json.id,
      name: json.name,
      metadata: json.metadata,
      graph: ProjectGraph.fromJSON(json.graph)
    });
  }
}
