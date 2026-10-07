export class EnvironmentCondition {
  constructor({
    dimension, // os, runtime, locale, timezone, arch, dependency
    value,
    isAvailable = true
  }) {
    this.dimension = dimension;
    this.value = isAvailable ? value : 'UNKNOWN';
    this.isAvailable = isAvailable;
    Object.freeze(this);
  }

  matches(other) {
    if (!this.isAvailable || !other.isAvailable) return true; // UNKNOWN does not conflict
    return this.value === other.value;
  }

  toJSON() {
    return {
      dimension: this.dimension,
      value: this.value,
      isAvailable: this.isAvailable
    };
  }
}
