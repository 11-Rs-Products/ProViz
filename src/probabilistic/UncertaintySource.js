export class UncertaintySource {
  constructor({
    kind,
    name,
    description = '',
    location = null,
    metadata = {}
  }) {
    this.kind = kind;
    this.name = name;
    this.description = description;
    this.location = location;
    this.metadata = Object.freeze({ ...metadata });
    Object.freeze(this);
  }

  toJSON() {
    return {
      kind: this.kind,
      name: this.name,
      description: this.description,
      location: this.location,
      metadata: this.metadata
    };
  }
}
