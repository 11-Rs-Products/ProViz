/**
 * TraceabilityMatrix.js
 * Comprehensive bidirectional traceability matrix across Requirements, Specs, Code, Tests, Obligations, and Evidence.
 */

export class TraceabilityLink {
  /**
   * @param {Object} options
   * @param {string} options.requirementId
   * @param {string|null} [options.specificationId=null]
   * @param {string[]} [options.implementationIds=[]]
   * @param {string[]} [options.testIds=[]]
   * @param {string[]} [options.obligationIds=[]]
   * @param {string[]} [options.evidenceIds=[]]
   * @param {string|null} [options.certificateId=null]
   */
  constructor({
    requirementId,
    specificationId = null,
    implementationIds = [],
    testIds = [],
    obligationIds = [],
    evidenceIds = [],
    certificateId = null
  }) {
    if (!requirementId) throw new Error('TraceabilityLink requires requirementId');
    this.requirementId = requirementId;
    this.specificationId = specificationId;
    this.implementationIds = Object.freeze([...implementationIds]);
    this.testIds = Object.freeze([...testIds]);
    this.obligationIds = Object.freeze([...obligationIds]);
    this.evidenceIds = Object.freeze([...evidenceIds]);
    this.certificateId = certificateId;
    Object.freeze(this);
  }

  get isFullyTraceable() {
    return Boolean(
      this.specificationId &&
      this.implementationIds.length > 0 &&
      this.obligationIds.length > 0 &&
      this.evidenceIds.length > 0
    );
  }

  toJSON() {
    return {
      requirementId: this.requirementId,
      specificationId: this.specificationId,
      implementationIds: [...this.implementationIds],
      testIds: [...this.testIds],
      obligationIds: [...this.obligationIds],
      evidenceIds: [...this.evidenceIds],
      certificateId: this.certificateId,
      isFullyTraceable: this.isFullyTraceable
    };
  }

  static fromJSON(json) {
    return new TraceabilityLink(json);
  }
}

export class TraceabilityMatrix {
  /**
   * @param {Object} options
   * @param {TraceabilityLink[]} [options.links=[]]
   * @param {string[]} [options.orphanRequirements=[]]
   * @param {string[]} [options.orphanImplementations=[]]
   */
  constructor({
    links = [],
    orphanRequirements = [],
    orphanImplementations = []
  } = {}) {
    this.links = Object.freeze(links.map(l => l instanceof TraceabilityLink ? l : new TraceabilityLink(l)));
    this.orphanRequirements = Object.freeze([...orphanRequirements]);
    this.orphanImplementations = Object.freeze([...orphanImplementations]);
    this.timestamp = Date.now();
    Object.freeze(this);
  }

  get fullyTraceableCount() {
    return this.links.filter(l => l.isFullyTraceable).length;
  }

  toJSON() {
    return {
      links: this.links.map(l => l.toJSON()),
      orphanRequirements: [...this.orphanRequirements],
      orphanImplementations: [...this.orphanImplementations],
      fullyTraceableCount: this.fullyTraceableCount,
      timestamp: this.timestamp
    };
  }

  static fromJSON(json) {
    return new TraceabilityMatrix({
      links: (json.links || []).map(l => TraceabilityLink.fromJSON(l)),
      orphanRequirements: json.orphanRequirements,
      orphanImplementations: json.orphanImplementations
    });
  }
}
