/**
 * High-performance secondary index for the Verification Knowledge Graph
 */
export class KnowledgeGraphIndex {
  constructor() {
    this.byKind = new Map();
    this.bySymbol = new Map();
    this.byFile = new Map();
    this.byStage = new Map();
    this.byRelation = new Map();
    this.bySource = new Map();
    this.byTarget = new Map();
  }

  indexEntity(entity) {
    // 1. By Kind
    if (!this.byKind.has(entity.kind)) this.byKind.set(entity.kind, new Set());
    this.byKind.get(entity.kind).add(entity.id);

    // 2. By Stage
    if (!this.byStage.has(entity.creationStage)) this.byStage.set(entity.creationStage, new Set());
    this.byStage.get(entity.creationStage).add(entity.id);

    // 3. By File
    const file = entity.sourceLocation?.file || entity.sourceArtifact;
    if (file) {
      if (!this.byFile.has(file)) this.byFile.set(file, new Set());
      this.byFile.get(file).add(entity.id);
    }

    // 4. By Symbol / Name
    if (entity.name) {
      if (!this.bySymbol.has(entity.name)) this.bySymbol.set(entity.name, new Set());
      this.bySymbol.get(entity.name).add(entity.id);
    }
  }

  unindexEntity(entity) {
    if (this.byKind.has(entity.kind)) this.byKind.get(entity.kind).delete(entity.id);
    if (this.byStage.has(entity.creationStage)) this.byStage.get(entity.creationStage).delete(entity.id);
    const file = entity.sourceLocation?.file || entity.sourceArtifact;
    if (file && this.byFile.has(file)) this.byFile.get(file).delete(entity.id);
    if (entity.name && this.bySymbol.has(entity.name)) this.bySymbol.get(entity.name).delete(entity.id);
  }

  indexEdge(edge) {
    // 1. By Relation
    if (!this.byRelation.has(edge.relation)) this.byRelation.set(edge.relation, new Set());
    this.byRelation.get(edge.relation).add(edge.id);

    // 2. By Source
    if (!this.bySource.has(edge.source)) this.bySource.set(edge.source, new Set());
    this.bySource.get(edge.source).add(edge.id);

    // 3. By Target
    if (!this.byTarget.has(edge.target)) this.byTarget.set(edge.target, new Set());
    this.byTarget.get(edge.target).add(edge.id);
  }

  unindexEdge(edge) {
    if (this.byRelation.has(edge.relation)) this.byRelation.get(edge.relation).delete(edge.id);
    if (this.bySource.has(edge.source)) this.bySource.get(edge.source).delete(edge.id);
    if (this.byTarget.has(edge.target)) this.byTarget.get(edge.target).delete(edge.id);
  }

  clear() {
    this.byKind.clear();
    this.bySymbol.clear();
    this.byFile.clear();
    this.byStage.clear();
    this.byRelation.clear();
    this.bySource.clear();
    this.byTarget.clear();
  }
}
