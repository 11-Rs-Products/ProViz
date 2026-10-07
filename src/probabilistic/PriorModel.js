export class PriorModel {
  constructor({
    type = 'Beta', // Beta, Dirichlet, Normal, Uniform
    parameters = { alpha: 1.0, beta: 1.0 },
    description = 'Standard uninformative prior'
  }) {
    this.type = type;
    this.parameters = Object.freeze({ ...parameters });
    this.description = description;
    Object.freeze(this);
  }

  toJSON() {
    return {
      type: this.type,
      parameters: this.parameters,
      description: this.description
    };
  }
}
