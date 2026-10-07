export const DependencyRelation = Object.freeze({
  REQUIRED: 'REQUIRED',
  OPTIONAL: 'OPTIONAL',
  EVIDENCE: 'EVIDENCE',
  RESOURCE: 'RESOURCE',
  ENVIRONMENT: 'ENVIRONMENT',
  EXCLUSION: 'EXCLUSION'
});

export class TaskDependency {
  constructor({
    sourceTaskId,
    targetTaskId,
    relation = DependencyRelation.REQUIRED,
    metadata = {}
  }) {
    this.sourceTaskId = String(sourceTaskId);
    this.targetTaskId = String(targetTaskId);
    this.relation = relation;
    this.metadata = Object.freeze({ ...metadata });
    Object.freeze(this);
  }

  toJSON() {
    return {
      sourceTaskId: this.sourceTaskId,
      targetTaskId: this.targetTaskId,
      relation: this.relation,
      metadata: this.metadata
    };
  }
}
