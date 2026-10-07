/**
 * ArchitectureGraph.js
 * High-level architecture graph modeling Domains, Services, Modules, Components, APIs, and Infrastructure.
 */

export const ArchitectureLayer = Object.freeze({
  SYSTEM: 'SYSTEM',
  DOMAIN: 'DOMAIN',
  SERVICE: 'SERVICE',
  MODULE: 'MODULE',
  COMPONENT: 'COMPONENT',
  DATA: 'DATA',
  API: 'API',
  INFRASTRUCTURE: 'INFRASTRUCTURE'
});

export class ArchitectureNode {
  constructor({ id, name, layer, parentId = null, metadata = {} }) {
    this.id = id;
    this.name = name;
    this.layer = layer;
    this.parentId = parentId;
    this.metadata = Object.freeze({ ...metadata });
    Object.freeze(this);
  }
}

export class ArchitectureGraph {
  constructor() {
    this._nodes = new Map(); // id -> ArchitectureNode
    this._dependencies = new Map(); // fromId -> Set of toId
  }

  addNode(node) {
    if (!(node instanceof ArchitectureNode)) node = new ArchitectureNode(node);
    this._nodes.set(node.id, node);
    if (!this._dependencies.has(node.id)) this._dependencies.set(node.id, new Set());
    return this;
  }

  getNode(id) {
    return this._nodes.get(id) || null;
  }

  addDependency(fromId, toId) {
    if (!this._nodes.has(fromId) || !this._nodes.has(toId)) {
      throw new Error(`Cannot add architectural dependency: ${fromId} or ${toId} does not exist`);
    }
    this._dependencies.get(fromId).add(toId);
    return this;
  }

  getDependencies(fromId) {
    const deps = this._dependencies.get(fromId);
    return deps ? Array.from(deps) : [];
  }

  getAllNodes() {
    return Array.from(this._nodes.values());
  }
}
