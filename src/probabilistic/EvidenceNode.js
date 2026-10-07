export class EvidenceNode {
  constructor({
    id,
    type, // PROGRAM, SPECIFICATION, ORACLE, TEST, EXECUTION, OBSERVATION, BEHAVIOR, EVIDENCE, CONFIDENCE
    label = '',
    data = {}
  }) {
    this.id = id;
    this.type = type;
    this.label = label || id;
    this.data = Object.freeze({ ...data });
    Object.freeze(this);
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      label: this.label,
      data: this.data
    };
  }
}
