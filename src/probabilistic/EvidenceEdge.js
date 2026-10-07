export class EvidenceEdge {
  constructor({
    from,
    to,
    relation = 'SUPPORTS', // SUPPORTS, REFUTES, DERIVED_FROM, DEPENDS_ON, VERIFIES
    weight = 1.0,
    metadata = {}
  }) {
    this.from = from;
    this.to = to;
    this.relation = relation;
    this.weight = weight;
    this.metadata = Object.freeze({ ...metadata });
    Object.freeze(this);
  }

  toJSON() {
    return {
      from: this.from,
      to: this.to,
      relation: this.relation,
      weight: this.weight,
      metadata: this.metadata
    };
  }
}
