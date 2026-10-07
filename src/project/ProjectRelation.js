/**
 * ProjectRelation.js
 * Represents directed edges and dependencies between project entities.
 */

export const ProjectRelationKind = Object.freeze({
  CONTAINS: 'CONTAINS',
  DEPENDS_ON: 'DEPENDS_ON',
  CALLS: 'CALLS',
  IMPLEMENTS: 'IMPLEMENTS',
  TESTS: 'TESTS',
  VERIFIES: 'VERIFIES',
  DEFINES_CONTRACT: 'DEFINES_CONTRACT',
  PROTECTS: 'PROTECTS',
  TRANSFORMS: 'TRANSFORMS',
  HAS_EVIDENCE: 'HAS_EVIDENCE',
  OWNS: 'OWNS',
  CONSTRAINS: 'CONSTRAINS'
});

export class ProjectRelation {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {string} options.from - Source entity ID
   * @param {string} options.to - Target entity ID
   * @param {string} [options.kind=ProjectRelationKind.DEPENDS_ON]
   * @param {number} [options.weight=1.0]
   * @param {Object} [options.attributes={}]
   * @param {Object} [options.metadata={}]
   */
  constructor({
    id,
    from,
    to,
    kind = ProjectRelationKind.DEPENDS_ON,
    weight = 1.0,
    attributes = {},
    metadata = {}
  }) {
    if (!from || !to) throw new Error('ProjectRelation requires from and to');
    this.id = id || `${from}->${to}:${kind}`;
    this.from = from;
    this.to = to;
    this.kind = kind;
    this.weight = typeof weight === 'number' ? weight : 1.0;
    this.attributes = Object.freeze({ ...attributes });
    this.metadata = Object.freeze({ ...metadata });
    Object.freeze(this);
  }

  toJSON() {
    return {
      id: this.id,
      from: this.from,
      to: this.to,
      kind: this.kind,
      weight: this.weight,
      attributes: { ...this.attributes },
      metadata: { ...this.metadata }
    };
  }

  static fromJSON(json) {
    return new ProjectRelation(json);
  }
}
