export class EnvironmentVariableModel {
  constructor(variables = {}) {
    this.variables = Object.freeze({ ...variables });
    Object.freeze(this);
  }

  get(key) {
    return this.variables[key] || 'UNKNOWN';
  }

  toJSON() {
    return { ...this.variables };
  }
}
