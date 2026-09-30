export class TestFamily {
  constructor({
    id,
    name = 'Test Family',
    template = null,
    parameters = [],
    instances = [],
    metadata = {}
  } = {}) {
    this.id = id || `family_${Math.random().toString(36).substring(2, 9)}`;
    this.name = name;
    this.template = template;
    this.parameters = parameters;
    this.instances = instances; // Generated test cases belonging to this family
    this.metadata = metadata;
  }

  addInstance(instance) {
    this.instances.push(instance);
  }

  size() {
    return this.instances.length;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      template: this.template,
      parameters: this.parameters,
      instancesCount: this.instances.length,
      metadata: this.metadata
    };
  }
}
